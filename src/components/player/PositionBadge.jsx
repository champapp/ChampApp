import { CC } from '../../ui';

// Puesto + dorsal del jugador. No renderiza nada si no tiene posición cargada.
export function PositionBadge({ player, light, big }) {
  if (!player.pos_short) return null;
  const fwd = player.pos_type === 'Forward';
  const tone = fwd ? CC.navy : CC.goldDeep;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: light ? 'rgba(255,255,255,0.12)' : 'rgba(14,58,92,0.06)',
      borderRadius: 999, padding: big ? '5px 11px 5px 6px' : '3px 9px 3px 4px',
    }}>
      <span style={{
        width: big ? 26 : 22, height: big ? 26 : 22, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: light ? CC.gold : tone, color: light ? CC.navy900 : '#fff',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: big ? 14 : 12, lineHeight: 1,
      }}>{player.dorsal}</span>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: big ? 15 : 13.5, letterSpacing: 0.3,
        color: light ? '#fff' : CC.ink,
      }}>{player.pos_short}</span>
      <span style={{
        fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: big ? 9.5 : 9, letterSpacing: 0.6,
        textTransform: 'uppercase', color: light ? 'rgba(255,255,255,0.6)' : (fwd ? CC.navy700 : CC.goldDeep),
      }}>{fwd ? 'FWD' : 'BACK'}</span>
    </span>
  );
}
