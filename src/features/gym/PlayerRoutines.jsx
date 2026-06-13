import { routinesForPlayer } from '../../lib/domain';
import { RoutineView } from './RoutineView';

// Rutinas vigentes (con días pendientes) para el jugador logueado.
export function PlayerRoutines({ player, routines, gymChecks, toast }) {
  const list = routinesForPlayer({ routines, gymChecks, player });
  return (
    <>
      {list.map((r) => (
        <RoutineView key={r.id} routine={r} player={player} gymChecks={gymChecks} toast={toast} />
      ))}
    </>
  );
}
