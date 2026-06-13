import { useState } from 'react';
import { CC, Icon, Card, SectionTitle, fmtDate } from '../../ui';
import { ADMIN_DOC_TYPES, adminDocStatus } from '../../lib/domain';
import { useAdminDocs, useUpsertAdminDoc } from '../../lib/queries';

const docDateStyle = { boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '8px 9px', fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, background: '#fff' };

function DocStatusChip({ status }) {
  let bg, col, t;
  if (!status) { bg = 'rgba(14,58,92,0.06)'; col = CC.faint; t = 'SIN FECHA'; }
  else if (status.level === 'expired') { bg = 'rgba(224,82,78,0.1)'; col = CC.bad; t = 'VENCIDO'; }
  else if (status.level === 'warn') { bg = 'rgba(249,178,51,0.16)'; col = CC.goldDeep; t = status.days === 0 ? 'VENCE HOY' : 'VENCE EN ' + status.days + (status.days === 1 ? ' DÍA' : ' DÍAS'); }
  else { bg = 'rgba(30,158,106,0.1)'; col = CC.good; t = 'AL DÍA'; }
  return <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color: col, borderRadius: 999, padding: '3px 9px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11.5, letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{t}</span>;
}

// "Administrativo": estado de los 4 papeles del jugador (ficha médica, curso
// de conmoción, Rugby Ready, antidoping) con su vencimiento. El admin puede
// editar las fechas de cualquier jugador; se guarda al instante.
export function AdminDocsCard({ player, canEdit, toast }) {
  const docsQ = useAdminDocs(player.id);
  const upsert = useUpsertAdminDoc();
  const [editing, setEditing] = useState(false);

  const docByType = new Map((docsQ.data ?? []).map((d) => [d.type, d]));

  function setExpiry(type, expiry) {
    upsert.mutate({ player_id: player.id, type, expiry }, {
      onError: () => toast?.('No se pudo guardar'),
    });
  }

  function toggleEdit() {
    if (editing) toast?.('Documentación actualizada');
    setEditing((e) => !e);
  }

  return (
    <>
      <SectionTitle icon="shield" action={canEdit && (
        <button onClick={toggleEdit} style={{ border: 'none', background: editing ? CC.gold : 'rgba(14,58,92,0.06)', color: editing ? CC.navy900 : CC.navy, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name={editing ? 'check' : 'edit'} size={14} sw={2.4} />{editing ? 'Listo' : 'Editar'}
        </button>
      )}>Administrativo</SectionTitle>
      <Card pad={13} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: editing ? 8 : 10 }}>
          {ADMIN_DOC_TYPES.map((type) => {
            const doc = docByType.get(type) || { type, expiry: '' };
            const status = adminDocStatus(doc);
            if (editing) {
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1.3, fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink }}>{type}</div>
                  <input type="date" defaultValue={doc.expiry || ''} onChange={(e) => setExpiry(type, e.target.value)} style={{ ...docDateStyle, flex: 1 }} />
                </div>
              );
            }
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: CC.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="shield" size={15} color={CC.navy} sw={2.3} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: CC.ink }}>{type}</div>
                  {doc.expiry && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 1 }}>Vence: {fmtDate(doc.expiry)}</div>}
                </div>
                <DocStatusChip status={status} />
              </div>
            );
          })}
        </div>
        {editing && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 10 }}>La alarma aparece sola cuando falta 1 mes para el vencimiento.</div>}
      </Card>
    </>
  );
}
