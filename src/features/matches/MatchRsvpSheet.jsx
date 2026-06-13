import { CC, Icon, Avatar, matchLongDate } from '../../ui';
import { matchRsvpStats } from '../../lib/domain';
import { usePlayers, useRsvp, useSetRsvp } from '../../lib/queries';
import { RsvpChip } from './RsvpChip';

// Cuadro de convocatoria de toda la categoría (admin): tocar un jugador
// cicla su respuesta yes → no → sin responder → yes.
export function MatchRsvpSheet({ match, onClose }) {
  const playersQ = usePlayers();
  const rsvpQ = useRsvp();
  const setRsvp = useSetRsvp();

  if (playersQ.isLoading || rsvpQ.isLoading) return null;

  const stats = matchRsvpStats({ players: playersQ.data, rsvp: rsvpQ.data, matchId: match.id, cat: match.cat, sub: null });
  const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  function cycle(pid) {
    const cur = rsvpQ.data.find((r) => r.match_id === match.id && r.player_id === pid)?.answer ?? null;
    const next = cur === 'yes' ? 'no' : cur === 'no' ? null : 'yes';
    setRsvp.mutate({ matchId: match.id, playerId: pid, answer: next });
  }

  const stat = (label, n, color) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30, color, lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="players" size={20} color="#fff" sw={2.2} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Convocatoria · {match.cat}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.home ? 'vs' : '@'} {match.rival} · {matchLongDate(match.date)}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>

        {/* estadística */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: '12px 8px', boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 18px rgba(14,34,53,0.05)' }}>
            {stat('Asistirán', stats.yes, CC.good)}
            <div style={{ width: 1, background: CC.line }} />
            {stat('No asisten', stats.no, CC.bad)}
            <div style={{ width: 1, background: CC.line }} />
            {stat('Sin responder', stats.pending, CC.muted)}
          </div>
          <div style={{ display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', marginTop: 10, background: 'rgba(14,58,92,0.06)' }}>
            <div style={{ width: pct(stats.yes) + '%', background: CC.good }} />
            <div style={{ width: pct(stats.no) + '%', background: CC.bad }} />
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint, marginTop: 8, textAlign: 'center' }}>Tocá un jugador para registrar o cambiar su respuesta</div>
        </div>

        {/* lista */}
        <div style={{ overflowY: 'auto', padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {stats.list.map(({ player, val }) => (
            <button key={player.id} onClick={() => cycle(player.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', border: `1px solid ${CC.line}`, background: '#fff', borderRadius: 13, padding: '9px 11px', textAlign: 'left' }}>
              <Avatar name={player.name} photo={player.photo_url} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 1 }}>#{player.dorsal} · {player.pos_short}</div>
              </div>
              <RsvpChip val={val} small />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
