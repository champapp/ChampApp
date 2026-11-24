import { useState } from 'react';
import { CC, Icon, Field, TextInput, SelectInput, fmtDate } from '../../ui';
import { GYM_UNITS, GYM_PRESETS, latestGymMarks, todayISO } from '../../lib/domain';
import { useAddGymMark } from '../../lib/queries';

const norm = (s) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Cargar una marca nueva de gimnasio (jugador). Solo agrega: nunca modifica ni
// borra las marcas anteriores, así queda el historial para ver el progreso.
export function GymMarkAddSheet({ player, marks, onClose, toast }) {
  const addMark = useAddGymMark();
  const latest = latestGymMarks(marks, player.id);
  const own = Object.keys(latest);
  const presets = GYM_PRESETS.filter((p) => !own.some((o) => norm(o) === norm(p.name)));

  const [exercise, setExercise] = useState(own[0] || '');
  const [isOther, setIsOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [unit, setUnit] = useState(own[0] ? latest[own[0]].unit || 'kg' : 'kg');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(todayISO());

  const today = todayISO();
  // el nombre efectivo: si "otro" coincide con uno existente se reutiliza ese
  const typed = otherName.trim();
  const matchOwn = isOther ? own.find((o) => norm(o) === norm(typed)) : null;
  const matchPreset = isOther && !matchOwn ? GYM_PRESETS.find((p) => norm(p.name) === norm(typed)) : null;
  const name = isOther ? (matchOwn || (matchPreset ? matchPreset.name : typed.toUpperCase())) : exercise;
  const prev = name && latest[name] ? latest[name] : null;
  const lockedUnit = prev ? prev.unit : matchPreset ? matchPreset.unit : null;
  const effUnit = lockedUnit || unit;

  function pick(ex, u) { setIsOther(false); setExercise(ex); setUnit(u || 'kg'); }

  function save() {
    const v = parseFloat(String(value).replace(',', '.'));
    if (!name) { toast('Elegí o escribí un ejercicio'); return; }
    if (!Number.isFinite(v) || v <= 0) { toast('Ingresá un valor mayor a 0'); return; }
    if (!date || date > today) { toast('La fecha no puede ser futura'); return; }
    addMark.mutate({ playerId: player.id, exercise: name, value: v, unit: effUnit, date }, {
      onSuccess: () => {
        const diff = prev ? Math.round((v - Number(prev.value)) * 100) / 100 : null;
        const delta = diff == null ? '' : diff === 0 ? ' · igual que la anterior' : ` · ${diff > 0 ? '+' : ''}${diff} ${effUnit} vs. la anterior`;
        onClose();
        toast(`Marca guardada ✓ ${v} ${effUnit}${delta}`);
      },
      onError: () => toast('No se pudo guardar. Probá de nuevo.'),
    });
  }

  const chip = (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', borderRadius: 999, padding: '7px 12px',
    border: `1.5px solid ${active ? CC.navy : CC.line}`, background: active ? CC.navy : '#fff', color: active ? '#fff' : CC.navy,
    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.2,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="weight" size={20} color={CC.navy900} sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Cargar marca</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Se suma a tu historial, no reemplaza las anteriores</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Ejercicio">
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {own.map((ex) => (
                <button key={ex} onClick={() => pick(ex, latest[ex].unit)} style={chip(!isOther && exercise === ex)}>{ex}</button>
              ))}
              {presets.map((p) => (
                <button key={p.name} onClick={() => pick(p.name, p.unit)} style={chip(!isOther && exercise === p.name)}>
                  <Icon name="plus" size={12} color={!isOther && exercise === p.name ? '#fff' : CC.gold} sw={2.8} />{p.name}
                </button>
              ))}
              <button onClick={() => setIsOther(true)} style={chip(isOther)}>Otro ejercicio</button>
            </div>
          </Field>

          {isOther && (
            <Field label="Nombre del ejercicio">
              <TextInput value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Ej: Press militar" autoFocus />
            </Field>
          )}

          {prev && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(14,58,92,0.05)', borderRadius: 11, padding: '9px 11px' }}>
              <Icon name="clock" size={15} color={CC.navy} sw={2.2} />
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink }}>
                Tu última marca: <b>{prev.value} {prev.unit}</b> · {fmtDate(prev.date)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Field label={`Valor (${effUnit})`} half>
              <TextInput type="number" inputMode="decimal" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Unidad" half>
              <SelectInput value={effUnit} onChange={(e) => setUnit(e.target.value)} disabled={!!lockedUnit}>
                {GYM_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </SelectInput>
            </Field>
          </div>

          <Field label="Fecha">
            <TextInput type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} disabled={addMark.isPending} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: addMark.isPending ? 0.7 : 1 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />Guardar marca
          </button>
        </div>
      </div>
    </div>
  );
}
