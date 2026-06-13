import { CC, SectionTitle, Toast } from '../../ui';
import { useAuth } from '../auth/useAuth';
import { protocolsForInjury } from '../../lib/domain';
import { usePlayerInjury, useInjuryProtocols, useFisioBookings } from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { InjuryCard } from '../../components/player/InjuryCard';
import { PlayerFisioCard } from '../../components/player/PlayerFisioCard';
import { FisioAgenda } from './FisioAgenda';

// Sanidad (jugador): estado de su lesión + protocolos de recuperación,
// su próximo turno de fisio (si tiene) y la agenda para reservar/cancelar.
export function PlayerHealthScreen() {
  const { player } = useAuth();
  const [toast, showToast] = useToast();
  const injuryQ = usePlayerInjury(player.id);
  const protocolsQ = useInjuryProtocols();
  const bookingsQ = useFisioBookings();

  if (injuryQ.isLoading || protocolsQ.isLoading || bookingsQ.isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const injury = injuryQ.data;
  const protocols = injury ? protocolsForInjury(protocolsQ.data ?? [], injury.id) : [];
  const bookings = bookingsQ.data ?? [];

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="medkit">Sanidad</SectionTitle>

      {injury && (
        <div style={{ marginBottom: 16 }}>
          <InjuryCard injury={injury} protocols={protocols} />
        </div>
      )}

      <PlayerFisioCard playerId={player.id} bookings={bookings} pad={false} toast={showToast} />

      <FisioAgenda mode="player" playerId={player.id} toast={showToast} />

      <Toast msg={toast} />
    </div>
  );
}
