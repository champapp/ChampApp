import { CC, Icon } from '../../ui';
import { injuryStatus } from '../../lib/domain';

// Punto médico chico, para listas de jugadores. `injury` es la fila activa
// de `injuries` (closed_at IS NULL) del jugador, o null/undefined si no tiene.
export function InjuryDot({ injury }) {
  const st = injuryStatus(injury);
  if (!st) return null;
  const col = st.color === 'red' ? CC.bad : CC.gold;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: col, flexShrink: 0 }}>
      <Icon name="medkit" size={11} color="#fff" sw={2.5} />
    </span>
  );
}
