import { useState } from 'react';
import { CC, SectionTitle, Toast } from '../../ui';
import { useToast } from '../../lib/useToast';
import { usePlayers, usePractices, useAttendance, useMatches, useRsvp, useActiveInjuries, useAllAdminDocs } from '../../lib/queries';
import { injuredPlayers, adminDocAlertsByPlayer, todayISO } from '../../lib/domain';
import { AdminMessages } from '../messages/AdminMessages';
import { AdminDashboard } from './AdminDashboard';
import { SanidadShortcut } from './SanidadShortcut';
import { DocsExpiringCard } from './DocsExpiringCard';
import { PlayerProfileScreen } from '../players/PlayerProfileScreen';

function HomeLoading() {
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>
      Cargando…
    </div>
  );
}

// Inicio (admin): comunicados del club + panel de estadísticas
// (asistencia general, por categoría, tendencia y ranking).
export function AdminHome({ onGoToHealth }) {
  const [toast, showToast] = useToast();
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [openId, setOpenId] = useState(null);

  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const injuriesQ = useActiveInjuries();
  const docsQ = useAllAdminDocs();

  const queries = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, injuriesQ, docsQ];
  if (queries.some((q) => q.isLoading)) return <HomeLoading />;

  if (openId != null) {
    return <PlayerProfileScreen playerId={openId} onBack={() => setOpenId(null)} />;
  }

  const injuryByPlayer = new Map((injuriesQ.data ?? []).map((i) => [i.player_id, i]));
  const players = (playersQ.data ?? []).map((p) => ({ ...p, injury: injuryByPlayer.get(p.id) }));

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="home">Inicio</SectionTitle>
      <AdminMessages toast={showToast} />
      <SanidadShortcut count={injuredPlayers({ players, injuryByPlayer }).length} onOpen={onGoToHealth} />
      <DocsExpiringCard rows={adminDocAlertsByPlayer({ players, docs: docsQ.data ?? [] })} onOpenPlayer={setOpenId} />
      <AdminDashboard
        players={players}
        practices={practicesQ.data ?? []}
        attendance={attendanceQ.data ?? []}
        matches={matchesQ.data ?? []}
        rsvp={rsvpQ.data ?? []}
        month={month}
        setMonth={setMonth}
        onOpenPlayer={setOpenId}
      />
      <Toast msg={toast} />
    </div>
  );
}
