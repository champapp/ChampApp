import { CC } from './tokens';

export function Empty({ t }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: CC.faint, fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>{t}</div>
  );
}
