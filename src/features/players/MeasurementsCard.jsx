import { useState } from 'react';
import { CC, Icon, Card, SectionTitle, MiniChart, fmtDate, Field, TextInput } from '../../ui';
import { usePlayerMeasurements, useUpsertMeasurement, useDeleteMeasurement } from '../../lib/queries';

function MeasurementForm({ playerId, initial, onDone }) {
  const upsert = useUpsertMeasurement();
  const [f, setF] = useState({
    date: initial?.date || new Date().toISOString().slice(0, 10),
    peso: initial?.peso != null ? String(initial.peso) : '',
    talla: initial?.talla != null ? String(initial.talla) : '',
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  function save() {
    if (!f.date || (f.peso === '' && f.talla === '')) return;
    upsert.mutate({ id: initial?.id, player_id: playerId, date: f.date, peso: f.peso || null, talla: f.talla || null }, {
      onSuccess: onDone,
    });
  }

  return (
    <div style={{ background: CC.paper, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, border: `1.5px solid ${CC.line}` }}>
      <Field label="Fecha"><TextInput type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Peso (kg)" half><TextInput type="number" inputMode="decimal" min="0" step="0.1" value={f.peso} onChange={(e) => set('peso', e.target.value)} placeholder="Ej: 85.5" /></Field>
        <Field label="Talla (cm)" half><TextInput type="number" inputMode="decimal" min="0" step="0.1" value={f.talla} onChange={(e) => set('talla', e.target.value)} placeholder="Ej: 178" /></Field>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={upsert.isPending} style={{ flex: 1, border: 'none', background: CC.gold, color: CC.navy900, borderRadius: 10, padding: '11px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, opacity: upsert.isPending ? 0.6 : 1 }}>
          {initial ? 'Guardar cambios' : 'Agregar'}
        </button>
        <button onClick={onDone} style={{ flex: 0.4, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.muted, borderRadius: 10, padding: '11px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>Cancelar</button>
      </div>
    </div>
  );
}

export function MeasurementsCard({ player, admin }) {
  const measQ = usePlayerMeasurements(player?.id);
  const delMeas = useDeleteMeasurement();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // measurement object
  const [confirmDel, setConfirmDel] = useState(null); // id

  const rows = measQ.data || [];
  const pesoData = rows.filter((r) => r.peso != null).map((r) => ({ date: r.date, value: Number(r.peso) }));
  const tallaData = rows.filter((r) => r.talla != null).map((r) => ({ date: r.date, value: Number(r.talla) }));
  const imcData = rows.filter((r) => r.imc != null).map((r) => ({ date: r.date, value: Number(r.imc) }));
  const latest = rows[rows.length - 1];

  function handleDelete(id) {
    if (confirmDel !== id) { setConfirmDel(id); return; }
    delMeas.mutate({ id, player_id: player.id }, { onSuccess: () => setConfirmDel(null) });
  }

  return (
    <>
      <SectionTitle icon="bolt" action={admin ? (
        <button onClick={() => { setAdding(true); setEditing(null); }} style={{ border: 'none', background: 'rgba(14,58,92,0.08)', color: CC.navy, padding: '5px 10px 5px 7px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="plus" size={13} color={CC.navy} sw={2.7} />Medición
        </button>
      ) : null}>Físico</SectionTitle>

      {/* Últimos valores */}
      {latest && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {latest.peso != null && (
            <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: `1px solid ${CC.line}`, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 28, color: CC.navy, lineHeight: 1 }}>{Number(latest.peso).toFixed(1)}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.muted, fontWeight: 600, marginTop: 2 }}>kg</div>
            </div>
          )}
          {latest.talla != null && (
            <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: `1px solid ${CC.line}`, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 28, color: CC.navy, lineHeight: 1 }}>{Number(latest.talla).toFixed(0)}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.muted, fontWeight: 600, marginTop: 2 }}>cm</div>
            </div>
          )}
          {latest.imc != null && (
            <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: `1px solid ${CC.line}`, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 28, color: CC.navy, lineHeight: 1 }}>{Number(latest.imc).toFixed(1)}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.muted, fontWeight: 600, marginTop: 2 }}>IMC</div>
            </div>
          )}
        </div>
      )}

      {/* Gráficos de evolución */}
      {pesoData.length >= 2 && (
        <Card pad={14} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.muted, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Evolución del peso</div>
          <MiniChart data={pesoData} unit="kg" color={CC.navy} height={60} />
        </Card>
      )}
      {tallaData.length >= 2 && (
        <Card pad={14} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.muted, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Evolución de la talla</div>
          <MiniChart data={tallaData} unit="cm" color="#2ECC71" height={60} />
        </Card>
      )}
      {imcData.length >= 2 && (
        <Card pad={14} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.muted, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Evolución del IMC</div>
          <MiniChart data={imcData} unit="" color={CC.goldDeep} height={60} />
        </Card>
      )}

      {/* Formulario */}
      {adding && !editing && (
        <div style={{ marginBottom: 10 }}>
          <MeasurementForm playerId={player.id} onDone={() => setAdding(false)} />
        </div>
      )}
      {editing && (
        <div style={{ marginBottom: 10 }}>
          <MeasurementForm playerId={player.id} initial={editing} onDone={() => setEditing(null)} />
        </div>
      )}

      {/* Historial */}
      {rows.length > 0 && admin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {[...rows].reverse().map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 10, border: `1px solid ${CC.line}`, padding: '8px 12px' }}>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, minWidth: 72 }}>{fmtDate(r.date)}</span>
              <span style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.ink }}>
                {r.peso != null ? `${Number(r.peso).toFixed(1)} kg` : ''}
                {r.peso != null && r.talla != null ? ' · ' : ''}
                {r.talla != null ? `${Number(r.talla).toFixed(0)} cm` : ''}
                {r.imc != null ? <span style={{ color: CC.faint, fontSize: 12, fontWeight: 600 }}> (IMC {Number(r.imc).toFixed(1)})</span> : null}
              </span>
              <button onClick={() => { setEditing(r); setAdding(false); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: CC.faint }}>
                <Icon name="edit" size={15} color={CC.faint} sw={2.2} />
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                style={{ border: 'none', background: confirmDel === r.id ? CC.bad : 'transparent', color: confirmDel === r.id ? '#fff' : CC.bad, cursor: 'pointer', borderRadius: 7, padding: '3px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12 }}
              >
                {confirmDel === r.id ? '¿Seguro?' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '16px 0 12px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.faint }}>
          {admin ? 'Sin mediciones. Agregá la primera.' : 'Sin mediciones registradas.'}
        </div>
      )}
    </>
  );
}
