import { CC, Card, Icon, matchLongDate } from '../../ui';
import { nextMatch, isSurveyActive } from '../../lib/domain';
import { useMatches, useRsvp } from '../../lib/queries';
import { RsvpChip } from './RsvpChip';

// Respuesta de RSVP de un jugador al próximo partido (vista admin, en su perfil).
export function PlayerMatchRsvp({ player }) {
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  if (matchesQ.isLoading || rsvpQ.isLoading) return null;

  const m = nextMatch({ matches: matchesQ.data, cat: player.cat, sub: player.sub });
  if (!m) return null;

  const vote = rsvpQ.data.find((r) => r.match_id === m.id && r.player_id === player.id)?.answer ?? null;
  const active = isSurveyActive(m);

  return (
    <Card pad={14} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(14,58,92,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="versus" size={20} color={CC.navy} sw={2.2} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Encuesta · {m.home ? 'vs' : '@'} {m.rival}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.faint, marginTop: 1 }}>{matchLongDate(m.date)}{active ? '' : ' · encuesta no abierta'}</div>
        </div>
        <RsvpChip val={vote} />
      </div>
    </Card>
  );
}
