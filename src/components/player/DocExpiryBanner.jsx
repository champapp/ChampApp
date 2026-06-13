import { CC, Icon, fmtDate } from '../../ui';
import { adminDocAlerts } from '../../lib/domain';

// Alerta de documentación vencida o por vencer (≤1 mes) de un jugador.
export function DocExpiryBanner({ docs, pad = true }) {
  const alerts = adminDocAlerts(docs);
  if (!alerts.length) return null;

  const expired = alerts.some((a) => a.status.level === 'expired');
  const col = expired ? CC.bad : CC.goldDeep;
  const bg = expired ? 'rgba(224,82,78,0.08)' : 'rgba(249,178,51,0.12)';
  const border = expired ? CC.bad : CC.gold;

  return (
    <div style={{ padding: pad ? '16px 16px 0' : 0 }}>
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: bg, border: `1.5px solid ${border}`, borderRadius: 16, padding: '13px 14px', marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="alert" size={18} color={expired ? '#fff' : CC.navy900} sw={2.4} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: col, letterSpacing: 0.2, lineHeight: 1.1 }}>Documentación por vencer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, lineHeight: 1.35 }}>
                <b>{a.doc.type}</b>{a.status.level === 'expired'
                  ? <span style={{ color: CC.bad, fontWeight: 700 }}> · venció el {fmtDate(a.doc.expiry)}</span>
                  : <span> · vence el {fmtDate(a.doc.expiry)} <b style={{ color: col }}>({a.status.days === 0 ? 'hoy' : 'en ' + a.status.days + (a.status.days === 1 ? ' día' : ' días')})</b></span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
