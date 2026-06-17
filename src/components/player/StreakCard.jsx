import { CC, Icon } from '../../ui';
import { playerStreak } from '../../lib/domain';

export function StreakCard({ history }) {
  if (!history || !history.length) return null;
  const { current, best } = playerStreak(history);
  if (current === 0 && best === 0) return null;

  const last10 = history.slice(-10);
  const active = current > 0;

  return (
    <div style={{ border: `1px solid ${CC.line}`, borderRadius: 14, background: '#fff', padding: '11px 13px', marginBottom: 16, boxShadow: '0 1px 2px rgba(14,34,53,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: active ? 'rgba(249,178,51,0.15)' : 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="bolt" size={18} color={active ? CC.gold : CC.muted} sw={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, lineHeight: 1 }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.muted, letterSpacing: 0.3 }}>Racha</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: active ? CC.goldDeep : CC.muted }}>{current}</span>
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint, marginTop: 3 }}>
            {best > 0 ? `Récord de temporada: ${best}` : 'Sin racha activa'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {last10.map((e, i) => (
            <div
              key={i}
              style={{ width: 7, height: 7, borderRadius: '50%', background: e.status === 'P' ? CC.good : CC.bad, opacity: i < last10.length - current ? 0.45 : 1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
