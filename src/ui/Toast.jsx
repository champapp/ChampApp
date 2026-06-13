import { CC } from './tokens';

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
      background: CC.navy900, color: '#fff', padding: '11px 20px', borderRadius: 999,
      fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap',
      boxShadow: '0 10px 30px rgba(0,0,0,0.4)', border: `1px solid ${CC.line}`,
      maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{msg}</div>
  );
}
