import { useState } from 'react';
import { CC, Icon, Field, TextInput } from '../../ui';
import { CATS, ROUTINE_SECTIONS } from '../../lib/domain';
import { usePlayers, useUpsertRoutine } from '../../lib/queries';

const blankEx = () => ({ section: '', name: '', aprox: '', detail: '', rest: '' });

function CatChip({ active, label, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
      border: `1.5px solid ${active ? CC.navy : CC.line}`,
      background: active ? CC.navy : '#fff', color: active ? '#fff' : CC.ink,
      borderRadius: 999, padding: '7px 13px',
      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, letterSpacing: 0.3,
    }}>
      {active && <Icon name="check" size={13} color="#fff" sw={2.8} />}{label}
    </button>
  );
}

// Modal de alta/edición de una rutina de gimnasio (admin): nombre, categorías
// destino, nota y bloques (días) con sus ejercicios.
export function RoutineBuilder({ initial, onClose, toast }) {
  const playersQ = usePlayers();
  const upsert = useUpsertRoutine();

  const [title, setTitle] = useState(initial ? initial.title : '');
  const [cats, setCats] = useState(() => {
    if (initial && Array.isArray(initial.cats) && initial.cats.length) return initial.cats;
    return ['all'];
  });
  const [note, setNote] = useState(initial ? (initial.note || '') : '');
  const [blocks, setBlocks] = useState(() => (initial
    ? JSON.parse(JSON.stringify(initial.blocks || []))
    : [{ title: 'Día 1', exercises: [blankEx()] }]));

  if (playersQ.isLoading) return null;
  const players = playersQ.data ?? [];

  function setBlock(i, k, v) { setBlocks((b) => { const n = b.slice(); n[i] = { ...n[i], [k]: v }; return n; }); }
  function addBlock() { setBlocks((b) => b.concat({ title: 'Día ' + (b.length + 1), exercises: [blankEx()] })); }
  function delBlock(i) { setBlocks((b) => b.filter((_, j) => j !== i)); }
  function setEx(bi, ei, k, v) { setBlocks((b) => { const n = JSON.parse(JSON.stringify(b)); n[bi].exercises[ei][k] = v; return n; }); }
  function addEx(bi) {
    setBlocks((b) => {
      const n = JSON.parse(JSON.stringify(b));
      const prev = n[bi].exercises[n[bi].exercises.length - 1];
      const ex = blankEx();
      if (prev) ex.section = prev.section || '';
      n[bi].exercises.push(ex);
      return n;
    });
  }
  function delEx(bi, ei) { setBlocks((b) => { const n = JSON.parse(JSON.stringify(b)); n[bi].exercises = n[bi].exercises.filter((_, j) => j !== ei); return n; }); }

  function toggleCat(id) {
    setCats((cur) => {
      if (id === 'all') return ['all'];
      let next = cur.filter((c) => c !== 'all');
      next = next.includes(id) ? next.filter((c) => c !== id) : next.concat(id);
      return next.length ? next : ['all'];
    });
  }
  const allCat = cats.includes('all');

  function save() {
    if (!title.trim()) { toast('Poné un nombre a la rutina'); return; }
    const cleanBlocks = blocks
      .map((b) => ({
        title: (b.title || '').trim() || 'Bloque',
        exercises: (b.exercises || [])
          .filter((e) => e.name.trim())
          .map((e) => ({ section: (e.section || '').trim(), name: e.name.trim(), aprox: (e.aprox || '').trim(), detail: (e.detail || '').trim(), rest: (e.rest || '').trim() })),
      }))
      .filter((b) => b.exercises.length);
    if (!cleanBlocks.length) { toast('Agregá al menos un ejercicio'); return; }
    const finalCats = allCat || !cats.length ? ['all'] : cats;
    upsert.mutate(
      { id: initial ? initial.id : undefined, title: title.trim(), cats: finalCats, note: note.trim(), blocks: cleanBlocks },
      {
        onSuccess: () => { onClose(); toast(initial ? 'Rutina actualizada' : 'Rutina publicada ✓'); },
        onError: () => toast('No se pudo guardar. Probá de nuevo.'),
      },
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={initial ? 'edit' : 'plus'} size={20} color="#fff" sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{initial ? 'Editar rutina' : 'Nueva rutina'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Bloques (días) y ejercicios</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre de la rutina"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Pretemporada · Fuerza" /></Field>
          <Field label="Categorías (podés elegir varias)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <CatChip active={allCat} label="Todo el club" onClick={() => toggleCat('all')} />
              {CATS.filter((c) => players.some((p) => p.cat === c.id)).map((c) => (
                <CatChip key={c.id} active={!allCat && cats.includes(c.id)} label={c.id} onClick={() => toggleCat(c.id)} />
              ))}
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 7 }}>{allCat ? 'La rutina le aparece a todo el plantel.' : 'Le aparece a: ' + cats.join(', ')}</div>
          </Field>
          <Field label="Nota (opcional)"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: 3 series, descanso 90s" /></Field>

          {blocks.map((b, bi) => (
            <div key={bi} style={{ border: `1.5px solid ${CC.line}`, borderRadius: 14, padding: 12, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input value={b.title} onChange={(e) => setBlock(bi, 'title', e.target.value)} placeholder="Día / bloque" style={{ flex: 1, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.ink, background: CC.paper }} />
                {blocks.length > 1 && <button onClick={() => delBlock(bi)} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={14} color={CC.bad} sw={2.5} /></button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {b.exercises.map((ex, ei) => (
                  <div key={ei} style={{ border: `1px solid ${CC.line}`, borderRadius: 11, padding: 8, background: CC.paper, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select value={ex.section || ''} onChange={(e) => setEx(bi, ei, 'section', e.target.value)} style={{ width: 128, flexShrink: 0, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 6px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: ex.section ? CC.navy : CC.faint, background: '#fff' }}>
                        <option value="">Sección…</option>
                        {ROUTINE_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input value={ex.name} onChange={(e) => setEx(bi, ei, 'name', e.target.value)} placeholder="Ejercicio" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 10px', fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, background: '#fff' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={ex.aprox || ''} onChange={(e) => setEx(bi, ei, 'aprox', e.target.value)} placeholder="Aprox. (1×10-1×8)" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.ink, textAlign: 'center', background: '#fff' }} />
                      <input value={ex.detail || ''} onChange={(e) => setEx(bi, ei, 'detail', e.target.value)} placeholder="Set/Rep (4×5+5)" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.goldDeep, textAlign: 'center', background: '#fff' }} />
                      <input value={ex.rest || ''} onChange={(e) => setEx(bi, ei, 'rest', e.target.value)} placeholder="Desc. (2 min)" style={{ flex: 0.8, minWidth: 0, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.ink, textAlign: 'center', background: '#fff' }} />
                      <button onClick={() => delEx(bi, ei)} style={{ width: 32, height: 36, borderRadius: 9, border: `1px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={13} color={CC.faint} sw={2.5} /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addEx(bi)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: CC.navy, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5 }}><Icon name="plus" size={13} color={CC.navy} sw={2.6} />Ejercicio</button>
              </div>
            </div>
          ))}
          <button onClick={addBlock} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px dashed ${CC.navy}`, background: 'rgba(14,58,92,0.03)', color: CC.navy, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}><Icon name="plus" size={15} color={CC.navy} sw={2.6} />Agregar día / bloque</button>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} disabled={upsert.isPending} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: upsert.isPending ? 0.7 : 1 }}><Icon name="check" size={18} color={CC.navy900} sw={2.6} />{initial ? 'Guardar' : 'Publicar'}</button>
        </div>
      </div>
    </div>
  );
}
