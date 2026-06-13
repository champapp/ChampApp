import { CC, Icon, fmtDate } from '../../ui';
import { injuryStatus } from '../../lib/domain';

// Símbolo médico con semáforo, al lado del nombre. `injury` es la fila activa
// de `injuries` (closed_at IS NULL) del jugador, o null/undefined si no tiene.
export function InjuryBadge({ injury, size = 18 }) {
  const st = injuryStatus(injury);
  if (!st) return null;
  const col = st.color === 'red' ? CC.bad : CC.gold;
  return (
    <span title={'Lesionado · vuelve ' + fmtDate(st.returnDate)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size + 8, height: size + 8, borderRadius: '50%', background: col, flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,255,255,0.5)' }}>
      <Icon name="medkit" size={size - 3} color="#fff" sw={2.4} />
    </span>
  );
}
