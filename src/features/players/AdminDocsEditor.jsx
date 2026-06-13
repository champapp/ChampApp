import { CC, Icon } from '../../ui';
import { ADMIN_DOC_TYPES } from '../../lib/domain';
import { useAdminDocs, useUpsertAdminDoc } from '../../lib/queries';

const docDateStyle = { flex: 1, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '9px 9px', fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, background: '#fff' };

// Documentación administrativa: el jugador ingresa la fecha de vencimiento
// de cada papel (ficha médica, curso de conmoción, Rugby Ready, antidoping).
// Se guarda al instante, fila por fila.
export function AdminDocsEditor({ playerId }) {
  const docsQ = useAdminDocs(playerId);
  const upsert = useUpsertAdminDoc();
  const docByType = new Map((docsQ.data ?? []).map((d) => [d.type, d]));

  function setExpiry(type, expiry) {
    upsert.mutate({ player_id: playerId, type, expiry });
  }

  return (
    <div style={{ borderTop: `1px solid ${CC.line}`, paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
        <Icon name="shield" size={17} color={CC.navy} sw={2.3} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 }}>Administrativo</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ADMIN_DOC_TYPES.map((type) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1.3, fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink }}>{type}</div>
            <input type="date" defaultValue={docByType.get(type)?.expiry || ''} onChange={(e) => setExpiry(type, e.target.value)} style={docDateStyle} />
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 10 }}>La alarma aparece sola cuando falta 1 mes para el vencimiento.</div>
    </div>
  );
}
