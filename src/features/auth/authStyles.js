import { CC } from '../../ui';

export const inputStyle = {
  width: '100%', boxSizing: 'border-box', border: '1.5px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px',
  color: '#fff', fontFamily: 'Barlow, sans-serif', fontSize: 16,
};

export const labelStyle = {
  fontFamily: 'Barlow, sans-serif', fontSize: 12.5, letterSpacing: 0.5,
  color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 600,
  marginBottom: 6, display: 'block',
};

export const submitBtn = {
  width: '100%', cursor: 'pointer', border: 'none', borderRadius: 12,
  background: CC.gold, color: CC.navy900, padding: '13px 16px',
  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.4,
};
