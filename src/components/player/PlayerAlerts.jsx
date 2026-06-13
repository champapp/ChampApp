import { CC, Icon, fmtDate } from '../../ui';
import { activeMessagesFor } from '../../lib/domain';

// Comunicados del club activos para el jugador (en su perfil/inicio).
export function PlayerAlerts({ me, messages, pad = true }) {
  const msgs = activeMessagesFor({ messages, player: me });
  if (!msgs.length) return null;

  return (
    <div style={{ padding: pad ? '16px 16px 0' : 0 }}>
      {msgs.map((m) => (
        <div key={m.id} style={{ display: 'flex', gap: 11, background: 'linear-gradient(150deg, #FFF6E4, #FDEFD0)', border: `1.5px solid ${CC.gold}`, borderRadius: 16, padding: '13px 14px', marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: CC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="megaphone" size={18} color={CC.navy900} sw={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.navy900, letterSpacing: 0.2, lineHeight: 1.1 }}>{m.title}</div>
            {m.body && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: '#6b4e1e', lineHeight: 1.4, marginTop: 4 }}>{m.body}</div>}
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: '#9a7a3c', fontWeight: 600, letterSpacing: 0.3, marginTop: 6, textTransform: 'uppercase' }}>
              Comunicado del club{m.end_date ? ' · vigente hasta ' + fmtDate(m.end_date) : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
