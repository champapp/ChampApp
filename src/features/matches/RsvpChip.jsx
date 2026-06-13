import { CC, Icon } from '../../ui';

// Chip de estado de respuesta a la encuesta de RSVP.
export function RsvpChip({ val, small }) {
  const map = {
    yes: { label: 'Asistirá', color: CC.good, bg: 'rgba(30,158,106,0.12)', icon: 'check' },
    no: { label: 'No asiste', color: CC.bad, bg: 'rgba(224,82,78,0.1)', icon: 'x' },
  };
  const c = map[val] || { label: 'Sin responder', color: CC.muted, bg: 'rgba(14,58,92,0.06)', icon: 'dot' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: c.bg, color: c.color, borderRadius: 999, padding: small ? '3px 9px' : '5px 11px' }}>
      <Icon name={c.icon} size={small ? 12 : 14} color={c.color} sw={2.5} />
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: small ? 13 : 14.5, letterSpacing: 0.2 }}>{c.label}</span>
    </span>
  );
}
