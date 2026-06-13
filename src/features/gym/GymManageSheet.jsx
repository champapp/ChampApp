import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { useSaveGymMarks } from '../../lib/queries';
import { GymEditor } from './GymEditor';

// Agrupa las filas planas de `gym_marks` de un jugador por ejercicio,
// para el estado local del editor.
function groupMarks(gymMarks, playerId) {
  const out = {};
  gymMarks
    .filter((g) => g.player_id === playerId)
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .forEach((g) => {
      if (!out[g.exercise]) out[g.exercise] = [];
      out[g.exercise].push({ _key: 'id-' + g.id, id: g.id, date: g.date, value: Number(g.value), unit: g.unit || '' });
    });
  return out;
}

// Modal de mediciones de gimnasio de un jugador (admin): edita las filas de
// `gym_marks` agrupadas por ejercicio y guarda los cambios con un diff.
export function GymManageSheet({ player, marks, onClose, toast }) {
  const saveMarks = useSaveGymMarks();
  const [gym, setGym] = useState(() => groupMarks(marks, player.id));

  function save() {
    const originalIds = new Set(marks.filter((g) => g.player_id === player.id).map((g) => g.id));
    const presentIds = new Set();
    const inserts = [];
    const updates = [];
    Object.entries(gym).forEach(([exercise, recs]) => {
      recs.forEach((r) => {
        const row = { exercise, value: r.value, unit: r.unit, date: r.date };
        if (r.id != null) { presentIds.add(r.id); updates.push({ id: r.id, ...row }); }
        else inserts.push(row);
      });
    });
    const deleteIds = [...originalIds].filter((id) => !presentIds.has(id));

    saveMarks.mutate({ playerId: player.id, inserts, updates, deleteIds }, {
      onSuccess: () => { onClose(); toast('Mediciones actualizadas'); },
      onError: () => toast('No se pudo guardar. Probá de nuevo.'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="weight" size={20} color="#fff" sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Mediciones de gimnasio</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>{player.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px' }}>
          <GymEditor value={gym} onChange={setGym} />
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} disabled={saveMarks.isPending} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saveMarks.isPending ? 0.7 : 1 }}><Icon name="check" size={18} color={CC.navy900} sw={2.6} />Guardar</button>
        </div>
      </div>
    </div>
  );
}
