import { useState } from 'react';
import { CC, Icon, Card, fmtDate } from '../../ui';
import { standingsForCat } from '../../lib/domain';
import { useStandingsTables, useDeleteStandingsTable } from '../../lib/queries';
import { StandingsEditSheet } from './StandingsEditSheet';

// Panel admin para cargar/editar las tablas de posiciones de la categoría
// seleccionada (puede haber más de una, ej. PS: Primera/Intermedia/Pre-Intermedia).
export function StandingsAdmin({ cat, toast }) {
  const tablesQ = useStandingsTables();
  const deleteTable = useDeleteStandingsTable();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // table | true (nueva) | null
  const [confirmDel, setConfirmDel] = useState(null);

  if (tablesQ.isLoading) return null;
  const tables = standingsForCat(tablesQ.data ?? [], cat);

  function del(id) {
    deleteTable.mutate(id, {
      onSuccess: () => { setConfirmDel(null); toast?.('Tabla eliminada'); },
      onError: () => toast?.('No se pudo eliminar'),
    });
  }

  return (
    <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="trophy" size={19} color={CC.navy} sw={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Tabla de posiciones</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 3 }}>{tables.length ? tables.length + ' tabla' + (tables.length > 1 ? 's' : '') + ' cargada' + (tables.length > 1 ? 's' : '') : 'Sin cargar para ' + cat}</div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tables.map((t) => {
            const confirming = confirmDel === t.id;
            return (
              <div key={t.id} style={{ border: `1px solid ${CC.line}`, borderRadius: 12, padding: '10px 11px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.ink }}>{t.label}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 1 }}>{(t.rows || []).length} equipos · actualizada {fmtDate((t.updated_at || '').slice(0, 10))}</div>
                  </div>
                  <button onClick={() => setEditing(t)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '7px 10px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5 }}>
                    <Icon name="edit" size={13} color={CC.navy} sw={2.4} />Editar
                  </button>
                  <button onClick={() => setConfirmDel(confirming ? null : t.id)} style={{ width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${CC.bad}`, background: confirming ? CC.bad : 'rgba(224,82,78,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="trash" size={14} color={confirming ? '#fff' : CC.bad} sw={2.4} />
                  </button>
                </div>
                {confirming && (
                  <div style={{ marginTop: 9, padding: '9px 10px', background: 'rgba(224,82,78,0.07)', borderRadius: 10, border: `1px solid ${CC.bad}` }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.ink, marginBottom: 8 }}>¿Eliminar la tabla "{t.label}"? No se puede deshacer.</div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button onClick={() => setConfirmDel(null)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '7px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>Cancelar</button>
                      <button onClick={() => del(t.id)} disabled={deleteTable.isPending} style={{ flex: 1, border: 'none', background: CC.bad, color: '#fff', padding: '7px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>
                        {deleteTable.isPending ? 'Eliminando…' : 'Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => setEditing(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px dashed ${CC.navy}`, background: 'rgba(14,58,92,0.03)', color: CC.navy, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>
            <Icon name="plus" size={15} color={CC.navy} sw={2.7} />Nueva tabla para {cat}
          </button>
        </div>
      )}

      {editing && (
        <StandingsEditSheet cat={cat} table={editing === true ? null : editing} onClose={() => setEditing(null)} toast={toast} />
      )}
    </Card>
  );
}
