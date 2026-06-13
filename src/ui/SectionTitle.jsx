import { CC } from './tokens';
import { Icon } from './Icon';

export function SectionTitle({ children, icon, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {icon && <div style={{ color: CC.gold }}><Icon name={icon} size={19} sw={2.3} /></div>}
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20,
        letterSpacing: 0.4, color: CC.ink, textTransform: 'uppercase', flex: 1,
      }}>{children}</div>
      {action}
    </div>
  );
}
