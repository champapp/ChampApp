import { CC, Icon } from '../../ui';

const BADGE_TONES = {
  gold: { bg: 'rgba(249,178,51,0.16)', fg: CC.goldDeep, chip: CC.gold, chipFg: CC.navy900 },
  good: { bg: 'rgba(30,158,106,0.12)', fg: CC.good, chip: CC.good, chipFg: '#fff' },
  navy: { bg: 'rgba(14,58,92,0.07)', fg: CC.navy, chip: CC.navy, chipFg: '#fff' },
};

function BadgeCard({ b }) {
  const t = BADGE_TONES[b.tone] || BADGE_TONES.navy;
  return (
    <div style={{
      flexShrink: 0, width: 132, background: '#fff', borderRadius: 16, padding: '13px 13px 12px',
      boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 18px rgba(14,34,53,0.06)', border: `1px solid ${CC.line}`,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
        <Icon name={b.icon} size={20} sw={2.3} />
      </div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink, lineHeight: 1.05, letterSpacing: 0.2 }}>{b.label}</div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, marginTop: 3, lineHeight: 1.25 }}>{b.detail}</div>
    </div>
  );
}

// `badges` viene de domain.playerBadges(...). Renderiza nada si está vacío.
export function BadgeRail({ badges, inline }) {
  if (!badges || !badges.length) return null;
  if (inline) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {badges.map((b) => {
          const t = BADGE_TONES[b.tone] || BADGE_TONES.navy;
          return (
            <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: t.bg, color: t.fg, borderRadius: 999, padding: '6px 11px 6px 8px' }}>
              <Icon name={b.icon} size={15} sw={2.4} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.2 }}>{b.label}</span>
            </span>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, margin: '0 -16px', padding: '0 16px 6px' }}>
      {badges.map((b) => <BadgeCard key={b.id} b={b} />)}
    </div>
  );
}
