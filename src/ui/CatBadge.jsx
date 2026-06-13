import { CC } from './tokens';

export function CatBadge({ id, sub, size = 'md' }) {
  const big = size === 'lg';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
        fontSize: big ? 15 : 13, letterSpacing: 0.5, color: CC.navy,
        background: 'rgba(249,178,51,0.22)', padding: big ? '3px 9px' : '2px 7px', borderRadius: 6,
      }}>{id}</span>
      {sub && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: big ? 14 : 12, color: CC.muted }}>·{sub}</span>}
    </span>
  );
}
