import { useState } from 'react';
import { CC, Icon, Card, fmtDate } from '../../ui';
import { routineCats } from '../../lib/domain';
import { useRoutines, useDeleteRoutine, useUpsertRoutine } from '../../lib/queries';
import { RoutineBuilder } from './RoutineBuilder';
import { RoutineImport } from './RoutineImport';

function byWeekStart(a, b) { return (a.week_start || '').localeCompare(b.week_start || ''); }

function RoutineRow({ r, onEdit, onToggleArchive, onDelete }) {
  const cs = routineCats(r);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${CC.line}`, borderRadius: 12, padding: '10px 12px', background: r.archived ? CC.paper : '#fff' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted }}>
          {r.week_start ? 'Semana del ' + fmtDate(r.week_start) + ' · ' : ''}{cs.includes('all') ? 'Todo el club' : cs.join(' · ')} · {(r.blocks || []).length} bloques
        </div>
      </div>
      <button onClick={() => onToggleArchive(r)} title={r.archived ? 'Desarchivar' : 'Archivar'} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${CC.line}`, background: r.archived ? 'rgba(249,178,51,0.15)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="archive" size={14} color={r.archived ? CC.goldDeep : CC.navy} sw={2.3} /></button>
      <button onClick={() => onEdit(r)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="edit" size={14} color={CC.navy} sw={2.3} /></button>
      <button onClick={() => onDelete(r.id)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={15} color={CC.bad} sw={2.5} /></button>
    </div>
  );
}

// Tarjeta colapsable del panel admin: listado de rutinas publicadas + alta/edición/import.
export function AdminRoutines({ toast }) {
  const routinesQ = useRoutines();
  const deleteRoutine = useDeleteRoutine();
  const archiveRoutine = useUpsertRoutine();
  const [open, setOpen] = useState(false);
  const [building, setBuilding] = useState(null); // true (nueva) | { initial: routine }
  const [importing, setImporting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  if (routinesQ.isLoading) return null;
  const all = routinesQ.data ?? [];
  const list = all.filter((r) => !r.archived).sort(byWeekStart);
  const archived = all.filter((r) => r.archived).sort(byWeekStart);

  function del(id) {
    deleteRoutine.mutate(id, {
      onSuccess: () => toast('Rutina eliminada'),
      onError: () => toast('No se pudo eliminar. Probá de nuevo.'),
    });
  }

  function toggleArchive(r) {
    archiveRoutine.mutate({ id: r.id, archived: !r.archived }, {
      onSuccess: () => toast(r.archived ? 'Rutina desarchivada' : 'Rutina archivada'),
      onError: () => toast('No se pudo actualizar. Probá de nuevo.'),
    });
  }

  return (
    <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="weight" size={20} color={CC.navy} sw={2.1} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Rutinas de gimnasio</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 3 }}>{all.length ? list.length + ' vigente' + (list.length === 1 ? '' : 's') + (archived.length ? ' · ' + archived.length + ' archivada' + (archived.length === 1 ? '' : 's') : '') : 'Cargá rutinas para los jugadores'}</div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: list.length ? 12 : 0 }}>
            <button onClick={() => setBuilding(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px dashed ${CC.navy}`, background: 'rgba(14,58,92,0.03)', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}><Icon name="plus" size={16} color={CC.navy} sw={2.7} />Nueva</button>
            <button onClick={() => setImporting(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', background: CC.navy, color: '#fff', padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}><Icon name="download" size={16} color="#fff" sw={2.4} style={{ transform: 'rotate(180deg)' }} />Importar Excel</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((r) => (
              <RoutineRow key={r.id} r={r} onEdit={(rt) => setBuilding({ initial: rt })} onToggleArchive={toggleArchive} onDelete={del} />
            ))}
          </div>
          {archived.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setShowArchived((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', color: CC.muted, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, padding: '4px 0' }}>
                <Icon name={showArchived ? 'chevUp' : 'chevron'} size={14} sw={2.4} />Ver archivadas ({archived.length})
              </button>
              {showArchived && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {archived.map((r) => (
                    <RoutineRow key={r.id} r={r} onEdit={(rt) => setBuilding({ initial: rt })} onToggleArchive={toggleArchive} onDelete={del} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {building && <RoutineBuilder initial={building.initial} onClose={() => setBuilding(null)} toast={toast} />}
      {importing && <RoutineImport onClose={() => setImporting(false)} toast={toast} />}
    </Card>
  );
}
