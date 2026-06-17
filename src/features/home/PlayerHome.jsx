import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { CC, Toast } from '../../ui';
import {
  usePlayers, usePractices, useAttendance, useMatches, useRsvp, useGymChecks, useGymMarks,
  usePlayerInjury, useInjuryProtocols, useFisioBookings, useMessages, useAdminDocs,
} from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { protocolsForInjury, playerHistory } from '../../lib/domain';
import { computeMyData } from './myData';
import { buildFeedWidgets } from './widgets';
import { HeaderHero } from './HeaderHero';
import { BirthdayBanner } from '../../components/player/BirthdayBanner';
import { PlayerAlerts } from '../../components/player/PlayerAlerts';
import { InjuryCard } from '../../components/player/InjuryCard';
import { PlayerFisioCard } from '../../components/player/PlayerFisioCard';
import { DocExpiryBanner } from '../../components/player/DocExpiryBanner';
import { FeedBoard } from '../../components/feed/FeedBoard';
import { RsvpSurveyCard } from '../matches/RsvpSurveyCard';
import { PlayerLineups } from '../matches/lineups/PlayerLineups';
import { NextMatchCard } from '../matches/NextMatchCard';
import { EditPlayerSheet } from '../players/EditPlayerSheet';
import { MatchRecord } from '../players/MatchRecord';
import { StreakCard } from '../../components/player/StreakCard';
import { ShopOrderBanner } from '../../components/player/ShopOrderBanner';

function HomeLoading() {
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>
      Cargando…
    </div>
  );
}

export function PlayerHome() {
  const { player, refreshPlayer } = useAuth();
  const [editing, setEditing] = useState(false);
  const [toast, showToast] = useToast();
  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymChecksQ = useGymChecks();
  const gymMarksQ = useGymMarks();
  const injuryQ = usePlayerInjury(player?.id);
  const protocolsQ = useInjuryProtocols();
  const fisioQ = useFisioBookings();
  const messagesQ = useMessages();
  const adminDocsQ = useAdminDocs(player?.id);

  const queries = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymChecksQ, gymMarksQ, injuryQ, protocolsQ, fisioQ, messagesQ, adminDocsQ];
  if (queries.some((q) => q.isLoading)) return <HomeLoading />;

  const data = {
    players: playersQ.data ?? [],
    practices: practicesQ.data ?? [],
    attendance: attendanceQ.data ?? [],
    matches: matchesQ.data ?? [],
    rsvp: rsvpQ.data ?? [],
    gymChecks: gymChecksQ.data ?? [],
    gymMarks: gymMarksQ.data ?? [],
    messages: messagesQ.data ?? [],
  };

  const d = computeMyData(player, data);
  const widgets = buildFeedWidgets(player, d);
  const injury = injuryQ.data;
  const protocols = injury ? protocolsForInjury(protocolsQ.data ?? [], injury.id) : [];
  const history = playerHistory({ practices: data.practices, attendance: data.attendance, matches: data.matches, rsvp: data.rsvp, gymChecks: data.gymChecks, player });

  return (
    <div style={{ paddingBottom: 16 }}>
      <HeaderHero player={player} injury={injury} d={d} onEdit={() => setEditing(true)} />
      <BirthdayBanner me={player} players={data.players} />
      <RsvpSurveyCard me={player} onlyIfPending />
      <PlayerAlerts me={player} messages={data.messages} />
      <ShopOrderBanner playerId={player?.id} />
      {injury && (
        <div style={{ padding: '16px 16px 0' }}>
          <InjuryCard injury={injury} protocols={protocols} />
        </div>
      )}
      <DocExpiryBanner docs={adminDocsQ.data} />
      <PlayerFisioCard playerId={player.id} bookings={fisioQ.data ?? []} toast={showToast} />
      <PlayerLineups me={player} />
      {d.nextMatch && (
        <div style={{ padding: '16px 16px 0' }}>
          <NextMatchCard match={d.nextMatch} player={player} />
        </div>
      )}
      <div style={{ padding: '16px 16px 0' }}>
        <MatchRecord player={player} matches={data.matches} />
        <StreakCard history={history} />
        <FeedBoard storageKey={'champ_feed_' + player.id} widgets={widgets} title="Personalizar mi feed" />
      </div>
      {editing && (
        <EditPlayerSheet
          player={player}
          selfEdit
          onClose={() => setEditing(false)}
          onSaved={refreshPlayer}
          toast={showToast}
        />
      )}
      <Toast msg={toast} />
    </div>
  );
}
