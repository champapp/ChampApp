import { useState } from 'react';
import { CC, Icon, matchLongDate } from '../../ui';
import { surveyMatch, matchRsvpStats, matchTimeLabel } from '../../lib/domain';
import { usePlayers, useMatches, useRsvp, useSetRsvp } from '../../lib/queries';

// barra de convocatoria de la categoría (cuántos asisten / no / sin responder)
function ConvoBar({ stats, label, light }) {
  const total = stats.total || 1;
  const yp = Math.round((stats.yes / total) * 100);
  const np = Math.round((stats.no / total) * 100);
  const subtle = light ? 'rgba(255,255,255,0.55)' : CC.muted;
  const trackBg = light ? 'rgba(255,255,255,0.14)' : 'rgba(14,58,92,0.07)';
  const pill = (n, color) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, color }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: color }} />{n}
    </span>
  );
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: subtle }}>Convocatoria {label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {pill(stats.yes, CC.good)}{pill(stats.no, CC.bad)}{pill(stats.pending, light ? 'rgba(255,255,255,0.55)' : CC.faint)}
        </span>
      </div>
      <div style={{ display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', background: trackBg }}>
        <div style={{ width: yp + '%', background: CC.good, transition: 'width .4s' }} />
        <div style={{ width: np + '%', background: CC.bad, transition: 'width .4s' }} />
      </div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: subtle, marginTop: 6 }}>
        <b style={{ color: light ? '#fff' : CC.ink }}>{stats.yes}</b> asistirán · <b style={{ color: light ? '#fff' : CC.ink }}>{stats.no}</b> no · <b style={{ color: light ? '#fff' : CC.ink }}>{stats.pending}</b> sin responder
      </div>
    </div>
  );
}

// Encuesta de asistencia al próximo partido (jugador). Aparece en Inicio y Calendario.
// `onlyIfPending`: solo se muestra mientras el jugador no respondió (la usa
// el Inicio, que la oculta una vez contestada porque pasa a verse en Calendario).
export function RsvpSurveyCard({ me, onlyIfPending = false, pad = true }) {
  const [expand, setExpand] = useState(false);
  const playersQ = usePlayers();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const setRsvp = useSetRsvp();

  if (playersQ.isLoading || matchesQ.isLoading || rsvpQ.isLoading) return null;

  const m = surveyMatch({ matches: matchesQ.data, cat: me.cat, sub: me.sub });
  if (!m) return null;

  const vote = rsvpQ.data.find((r) => r.match_id === m.id && r.player_id === me.id)?.answer ?? null;
  if (onlyIfPending && vote != null) return null;
  const stats = matchRsvpStats({ players: playersQ.data, rsvp: rsvpQ.data, matchId: m.id, cat: me.cat, sub: null });

  function setVote(v) {
    setRsvp.mutate({ matchId: m.id, playerId: me.id, answer: v === vote ? null : v });
    setExpand(false);
  }

  const btn = (val, label, icon, color) => {
    const active = vote === val;
    return (
      <button onClick={() => setVote(val)} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
        cursor: 'pointer', border: `2px solid ${active ? color : 'rgba(255,255,255,0.18)'}`, borderRadius: 14,
        background: active ? color : 'rgba(255,255,255,0.06)', padding: '13px 8px', transition: 'all .15s',
      }}>
        <Icon name={icon} size={22} color={active ? '#fff' : 'rgba(255,255,255,0.85)'} sw={2.6} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.3, color: active ? '#fff' : 'rgba(255,255,255,0.9)' }}>{label}</span>
      </button>
    );
  };

  const wrapStyle = { padding: pad ? '16px 16px 0' : 0 };

  // ── Estado compacto: ya votó y no está cambiando ──
  if (vote && !expand) {
    return (
      <div style={wrapStyle}>
        <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', background: `linear-gradient(155deg, ${CC.navy} 0%, ${CC.navy900} 100%)`, boxShadow: '0 5px 16px rgba(7,36,61,0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="versus" size={18} color={CC.gold} sw={2.2} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Encuesta · {matchLongDate(m.date)}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.home ? 'vs' : '@'} {m.rival}</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: vote === 'yes' ? CC.good : CC.bad, color: '#fff', borderRadius: 999, padding: '5px 11px', flexShrink: 0 }}>
              <Icon name={vote === 'yes' ? 'check' : 'x'} size={14} color="#fff" sw={2.6} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>{vote === 'yes' ? 'Asistiré' : 'No asistiré'}</span>
            </span>
          </div>
          <div style={{ padding: '11px 14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <ConvoBar stats={stats} label={me.cat} light />
          </div>
          <button onClick={() => setExpand(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '8px', color: 'rgba(255,255,255,0.8)' }}>
            <Icon name="edit" size={13} color="rgba(255,255,255,0.8)" sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, letterSpacing: 0.3 }}>Cambiar respuesta</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Estado completo: aún no votó (o está cambiando) ──
  return (
    <div style={wrapStyle}>
      <div style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden', background: `linear-gradient(155deg, ${CC.navy} 0%, ${CC.navy900} 100%)`, boxShadow: '0 10px 28px rgba(7,36,61,0.22)', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -20, top: -18, color: 'rgba(249,178,51,0.10)' }}><Icon name="whistle" size={110} color="rgba(249,178,51,0.10)" sw={1.6} /></div>
        <div style={{ padding: '14px 16px 0', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
            <Icon name="versus" size={17} color={CC.gold} sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1, color: CC.gold, textTransform: 'uppercase' }}>¿Vas al partido?</span>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 23, color: '#fff', lineHeight: 1 }}>{m.home ? 'Local vs' : 'Visitante vs'} {m.rival}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{matchLongDate(m.date)}{matchTimeLabel(m) ? ' · ' + matchTimeLabel(m) : ''} · {m.place}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px 14px', position: 'relative' }}>
          {btn('yes', 'Asistiré', 'check', CC.good)}
          {btn('no', 'No asistiré', 'x', CC.bad)}
        </div>
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <ConvoBar stats={stats} label={me.cat} light />
        </div>
      </div>
    </div>
  );
}
