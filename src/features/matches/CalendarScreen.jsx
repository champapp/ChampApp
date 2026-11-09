import { CC, Icon, Card, SectionTitle } from '../../ui';
import { useAuth } from '../auth/useAuth';
import { useMatches } from '../../lib/queries';
import { todayISO, nextMatch, matchesForCat } from '../../lib/domain';
import { MatchCard } from './MatchCard';
import { NextMatchCard } from './NextMatchCard';
import { RsvpSurveyCard } from './RsvpSurveyCard';

// Pestaña "Calendario" del jugador: encuesta RSVP, próximo partido y fixture de su categoría.
// `focusMatchId`: partido de un link compartido (convocatoria por WhatsApp).
export function CalendarScreen({ focusMatchId = null }) {
  const { player } = useAuth();
  const matchesQ = useMatches();

  if (matchesQ.isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const today = todayISO();
  const all = matchesForCat(matchesQ.data, player.cat);
  const upcoming = all.filter((m) => m.date >= today);
  const past = all.filter((m) => m.date < today).reverse();
  const next = nextMatch({ matches: matchesQ.data, cat: player.cat, sub: player.sub });
  const linked = focusMatchId ? matchesQ.data.find((m) => m.id === focusMatchId) : null;
  const linkedOtherCat = linked && linked.cat !== player.cat ? linked : null;

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="calendar">Calendario</SectionTitle>

      {linkedOtherCat && (
        <div style={{ background: 'rgba(249,178,51,0.14)', borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b4e1e', lineHeight: 1.35 }}>
          El link que abriste es de la categoría <b>{linkedOtherCat.cat}</b> y este perfil es de <b>{player.cat}</b>. Para responder, entrá con el usuario del jugador de {linkedOtherCat.cat}.
        </div>
      )}
      <RsvpSurveyCard me={player} pad={false} focusMatchId={focusMatchId} />
      <NextMatchCard match={next} player={player} />

      {upcoming.length > 1 && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: CC.muted, textTransform: 'uppercase', margin: '4px 0 9px' }}>Próximos partidos</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {upcoming.slice(1).map((m) => <MatchCard key={m.id} m={m} />)}
      </div>
      {upcoming.length === 0 && (
        <Card pad={20} style={{ textAlign: 'center' }}>
          <div style={{ color: CC.faint, marginBottom: 8, display: 'flex', justifyContent: 'center' }}><Icon name="calendar" size={30} /></div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.muted }}>No hay partidos próximos cargados para tu categoría.</div>
        </Card>
      )}

      {past.length > 0 && (<>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: CC.faint, textTransform: 'uppercase', margin: '20px 0 9px' }}>Jugados</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {past.map((m) => <MatchCard key={m.id} m={m} />)}
        </div>
      </>)}
    </div>
  );
}
