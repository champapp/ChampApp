import { useState } from 'react';
import { CC, Icon, TextInput, SelectInput } from '../../ui';
import { GYM_UNITS, GYM_PRESETS, todayISO } from '../../lib/domain';

let keySeq = 0;
function newKey() { return 'new-' + (++keySeq); }

// Editor de mediciones de gimnasio de un jugador (admin).
// `value` es { [ejercicio]: [{ _key, id?, date, value, unit }] }: las tomas con
// `id` ya existen en `gym_marks`, las que no tienen `id` son nuevas.
export function GymEditor({ value, onChange }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const gym = value || {};
  const clone = () => JSON.parse(JSON.stringify(gym));

  function setRecord(ex, i, patch) { const g = clone(); g[ex][i] = { ...g[ex][i], ...patch }; onChange(g); }
  function addRecord(ex) {
    const g = clone();
    const last = g[ex][g[ex].length - 1];
    g[ex].push({ _key: newKey(), date: todayISO().slice(0, 7) + '-01', value: last ? last.value : 0, unit: last ? last.unit : 'kg' });
    onChange(g);
  }
  function delRecord(ex, i) { const g = clone(); g[ex].splice(i, 1); if (g[ex].length === 0) delete g[ex]; onChange(g); }
  function delExercise(ex) { const g = clone(); delete g[ex]; onChange(g); }
  function addExercise() {
    const name = newName.trim(); if (!name) return;
    const g = clone();
    if (!g[name]) g[name] = [{ _key: newKey(), date: todayISO().slice(0, 7) + '-01', value: 0, unit: newUnit }];
    onChange(g); setNewName(''); setNewUnit('kg'); setAdding(false);
  }
  function addPreset(name, unit) {
    const g = clone();
    if (!g[name]) g[name] = [{ _key: newKey(), date: todayISO().slice(0, 7) + '-01', value: 0, unit }];
    onChange(g);
  }

  const exercises = Object.keys(gym);
  const pendingPresets = GYM_PRESETS.filter((pr) => !exercises.includes(pr.name));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {exercises.length === 0 && !adding && (
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.faint, padding: '2px 0' }}>Sin mediciones cargadas. Agregá un ejercicio para registrar marcas.</div>
      )}
      {exercises.map((ex) => (
        <div key={ex} style={{ background: '#fff', borderRadius: 13, border: `1px solid ${CC.line}`, padding: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <Icon name="weight" size={16} color={CC.navy} sw={2.2} />
            <span style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, color: CC.ink, letterSpacing: 0.2 }}>{ex}</span>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint, fontWeight: 600 }}>{gym[ex][0] ? gym[ex][0].unit : ''}</span>
            <button onClick={() => delExercise(ex)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(224,82,78,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={13} color={CC.bad} sw={2.5} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {gym[ex].map((rec, i) => (
              <div key={rec._key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <input type="month" value={(rec.date || '').slice(0, 7)} onChange={(e) => setRecord(ex, i, { date: (e.target.value || todayISO().slice(0, 7)) + '-01' })}
                  style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 9px', fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, background: CC.paper }} />
                <div style={{ position: 'relative', width: 96, flexShrink: 0 }}>
                  <input type="number" value={rec.value} onChange={(e) => setRecord(ex, i, { value: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 30px 8px 9px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, background: '#fff', textAlign: 'right' }} />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, pointerEvents: 'none' }}>{rec.unit}</span>
                </div>
                <button onClick={() => delRecord(ex, i)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(14,58,92,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={13} color={CC.muted} sw={2.3} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => addRecord(ex)} style={{ marginTop: 9, border: `1.5px dashed ${CC.line}`, background: 'transparent', color: CC.navy, padding: '7px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%' }}><Icon name="plus" size={14} color={CC.navy} sw={2.6} />Agregar toma</button>
        </div>
      ))}

      {pendingPresets.length > 0 && !adding && (
        <div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginBottom: 7 }}>Ejercicios sugeridos</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {pendingPresets.map((pr) => (
              <button key={pr.name} onClick={() => addPreset(pr.name, pr.unit)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '7px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, letterSpacing: 0.2 }}>
                <Icon name="plus" size={13} color={CC.gold} sw={2.8} />{pr.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {adding ? (
        <div style={{ background: 'rgba(14,58,92,0.04)', borderRadius: 13, padding: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del ejercicio (ej: Press plano)" autoFocus />
          <div style={{ display: 'flex', gap: 8 }}>
            <SelectInput value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
              {GYM_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </SelectInput>
            <button onClick={addExercise} style={{ flexShrink: 0, border: 'none', background: CC.navy, color: '#fff', padding: '0 18px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>Agregar</button>
            <button onClick={() => { setAdding(false); setNewName(''); }} style={{ flexShrink: 0, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.muted, padding: '0 14px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ border: `1.5px solid ${CC.navy}`, background: 'rgba(14,58,92,0.04)', color: CC.navy, padding: '10px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="plus" size={16} color={CC.navy} sw={2.6} />Agregar ejercicio</button>
      )}
    </div>
  );
}
