import { useState } from 'react';
import { CC, Icon, Field, TextInput } from '../../ui';
import { useUpsertStandingsTable } from '../../lib/queries';
import { teamCrestSrc } from '../../lib/rivalCrests';

const NUM_FIELDS = [
  { key: 'pj', label: 'PJ' },
  { key: 'pg', label: 'PG' },
  { key: 'pe', label: 'PE' },
  { key: 'pp', label: 'PP' },
  { key: 'bo', label: 'BO' },
  { key: 'bd', label: 'BD' },
  { key: 'pts', label: 'PTS' },
];

function blankRow() {
  return { team: '', pj: '', pg: '', pe: '', pp: '', bo: '', bd: '', pts: '' };
}

// Carga/edita una tabla de posiciones (admin): nombre de la división (ej.
// "Primera") y una fila por equipo, en el mismo orden en que aparecen en la
// tabla oficial (posición 1 arriba). Al guardar, el orden actual pasa a ser
// el snapshot anterior para calcular las flechas de movimiento la próxima vez.
export function StandingsEditSheet({ cat, table, onClose, toast }) {
  const [label, setLabel] = useState(table?.label || '');
  const [rows, setRows] = useState(() => {
    if (!table?.rows?.length) return [blankRow()];
    return table.rows.map((r) => ({
      team: r.team || '',
      pj: r.pj ?? '', pg: r.pg ?? '', pe: r.pe ?? '', pp: r.pp ?? '',
      bo: r.bo ?? '', bd: r.bd ?? '', pts: r.pts ?? '',
    }));
  });
  const upsert = useUpsertStandingsTable();

  function setRow(i, field, value) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  }
  function addRow() { setRows((rs) => [...rs, blankRow()]); }
  function removeRow(i) { setRows((rs) => rs.filter((_, j) => j !== i)); }

  function save() {
    if (!label.trim()) { toast?.('Ponele un nombre a la tabla (ej: Primera)'); return; }
    const cleanRows = rows
      .filter((r) => r.team.trim())
      .map((r) => ({
        team: r.team.trim(),
        pj: Number(r.pj) || 0, pg: Number(r.pg) || 0, pe: Number(r.pe) || 0, pp: Number(r.pp) || 0,
        bo: Number(r.bo) || 0, bd: Number(r.bd) || 0, pts: Number(r.pts) || 0,
      }));
    if (!cleanRows.length) { toast?.('Cargá al menos un equipo'); return; }
    upsert.mutate({ id: table?.id, cat, label: label.trim(), sortOrder: table?.sort_order ?? 0, rows: cleanRows }, {
      onSuccess: () => { onClose(); toast?.('Tabla guardada'); },
      onError: () => toast?.('No se pudo guardar la tabla'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 360, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="trophy" size={20} color="#fff" sw={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Tabla de posiciones</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 2 }}>{cat}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Nombre de la tabla (ej: Primera, Intermedia, Fase Plata)">
            <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Primera" />
          </Field>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 540, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
                <div style={{ flex: 1, minWidth: 140 }} />
                {NUM_FIELDS.map((f) => (
                  <div key={f.key} style={{ width: 40, textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted }}>{f.label}</div>
                ))}
                <div style={{ width: 26 }} />
              </div>
              {rows.map((r, i) => {
                const crest = teamCrestSrc(r.team);
                return (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#fff', border: `1px solid ${CC.line}`, borderRadius: 10, padding: 6 }}>
                    <div style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, color: CC.faint, width: 14, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                      {crest ? <img src={crest} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} /> : <span style={{ width: 18, flexShrink: 0 }} />}
                      <input value={r.team} onChange={(e) => setRow(i, 'team', e.target.value)} placeholder="Equipo" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, background: 'transparent' }} />
                    </div>
                    {NUM_FIELDS.map((f) => (
                      <input
                        key={f.key} type="number" value={r[f.key]} onChange={(e) => setRow(i, f.key, e.target.value)}
                        style={{ width: 40, border: `1px solid ${CC.line}`, borderRadius: 7, padding: '5px 2px', textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.ink }}
                      />
                    ))}
                    <button onClick={() => removeRow(i)} style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: 'rgba(224,82,78,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="x" size={13} color={CC.bad} sw={2.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={addRow} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1.5px dashed ${CC.navy}`, background: 'rgba(14,58,92,0.03)', color: CC.navy, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5 }}>
            <Icon name="plus" size={14} color={CC.navy} sw={2.6} />Agregar equipo
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'rgba(14,58,92,0.04)', borderRadius: 11, padding: '10px 12px' }}>
            <Icon name="alert" size={14} color={CC.muted} sw={2.3} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, lineHeight: 1.4 }}>El orden de la lista es el orden de la tabla (1° arriba). Al guardar se compara con la versión anterior para mostrar quién subió o bajó posiciones.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} disabled={upsert.isPending} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: upsert.isPending ? 0.6 : 1 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />Guardar tabla
          </button>
        </div>
      </div>
    </div>
  );
}
