import { CC } from './tokens';

export function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap',
      padding: '7px 13px', borderRadius: 999,
      background: active ? CC.navy : '#fff',
      color: active ? '#fff' : CC.muted,
      borderWidth: active ? 0 : 1.5, borderStyle: 'solid', borderColor: CC.line,
      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.3,
      transition: 'all .15s',
    }}>{children}</button>
  );
}
