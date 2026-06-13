import { useState } from 'react';
import { CC, Icon, Card } from '../../../ui';
import { todayISO } from '../../../lib/domain';
import { useLineups, useMatches, useDeleteLineup } from '../../../lib/queries';
import { LineupView } from './LineupView';
import { LineupBuilder } from './LineupBuilder';

// Tarjeta del panel admin para crear / administrar alineaciones.
export function AdminLineups({ toast }) {
  const lineupsQ = useLineups();
  const matchesQ = useMatches();
  const deleteLineup = useDeleteLineup();
  const [open, setOpen] = useState(false);
  const [building, setBuilding] = useState(null); // {initial} | true

  if (lineupsQ.isLoading || matchesQ.isLoading) return null;

  const today = todayISO();
  const all = lineupsQ.data.filter((l) => {
    const m = matchesQ.data.find((x) => x.id === l.match_id);
    return m && m.date >= today;
  });

  function del(id) {
    deleteLineup.mutate(id, {
      onSuccess: () => toast('Alineación eliminada'),
      onError: () => toast('No se pudo eliminar. Probá de nuevo.'),
    });
  }

  return (
    <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="players" size={20} color={CC.navy} sw={2.1} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Alineaciones</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 3 }}>{all.length ? all.length + ' equipo' + (all.length === 1 ? '' : 's') + ' para los próximos partidos' : 'Armá el equipo para el próximo partido'}</div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          <button onClick={() => setBuilding(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1.5px dashed ${CC.navy}`, background: 'rgba(14,58,92,0.03)', color: CC.navy, padding: '14px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, letterSpacing: 0.3, marginBottom: all.length ? 14 : 0 }}>
            <Icon name="plus" size={18} color={CC.navy} sw={2.7} />Crear alineación
          </button>
          {all.map((l) => <LineupView key={l.id} lineup={l} onEdit={() => setBuilding({ initial: l })} onDelete={() => del(l.id)} />)}
        </div>
      )}

      {building && <LineupBuilder initial={building.initial} onClose={() => setBuilding(null)} toast={toast} />}
    </Card>
  );
}
