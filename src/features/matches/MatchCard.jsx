import { CC, Icon, CatBadge } from '../../ui';
import { todayISO, matchRsvpStats, matchTimeLabel } from '../../lib/domain';
import { usePlayers, useRsvp } from '../../lib/queries';

const MONTH_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// barra compacta de stats + botón (para tarjetas de partido del admin)
function MatchRsvpBar({ match, onOpen }) {
  const playersQ = usePlayers();
  const rsvpQ = useRsvp();
  if (playersQ.isLoading || rsvpQ.isLoading) return null;
  const stats = matchRsvpStats({ players: playersQ.data, rsvp: rsvpQ.data, matchId: match.id, cat: match.cat, sub: null });
  return (
    <button onClick={(e) => { e.stopPropagation(); onOpen(match); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', cursor: 'pointer', border: 'none', borderTop: `1px solid ${CC.line}`, background: 'transparent', padding: '9px 2px 2px', marginTop: 9, textAlign: 'left' }}>
      <Icon name="players" size={15} color={CC.navy} sw={2.2} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.good }}><span style={{ width: 7, height: 7, borderRadius: 4, background: CC.good }} />{stats.yes}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.bad }}><span style={{ width: 7, height: 7, borderRadius: 4, background: CC.bad }} />{stats.no}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.muted }}><span style={{ width: 7, height: 7, borderRadius: 4, background: CC.faint }} />{stats.pending}</span>
      <span style={{ marginLeft: 'auto', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, color: CC.navy, letterSpacing: 0.3, display: 'inline-flex', alignItems: 'center', gap: 2 }}>Convocatoria<Icon name="chevron" size={14} color={CC.navy} /></span>
    </button>
  );
}

// Tarjeta de partido. `admin` habilita edición (tap) y la barra de convocatoria.
export function MatchCard({ m, onEdit, admin, onRsvp }) {
  const past = m.date < todayISO();
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '13px 14px',
      border: `1px solid ${CC.line}`, boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 18px rgba(14,34,53,0.05)',
      opacity: past ? 0.62 : 1,
    }}>
      <div onClick={admin ? () => onEdit(m) : undefined} style={{ display: 'flex', alignItems: 'center', gap: 13, cursor: admin ? 'pointer' : 'default' }}>
        {/* fecha */}
        <div style={{ width: 54, flexShrink: 0, textAlign: 'center', background: past ? 'rgba(14,58,92,0.05)' : CC.navy, borderRadius: 12, padding: '8px 0', color: past ? CC.muted : '#fff' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: 0.95 }}>{m.date.slice(8, 10)}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: past ? CC.faint : CC.gold }}>{MONTH_SHORT[parseInt(m.date.slice(5, 7), 10) - 1]}</div>
        </div>
        {/* detalle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <CatBadge id={m.cat} />
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: m.home ? CC.good : CC.goldDeep, textTransform: 'uppercase' }}>{m.home ? 'Local' : 'Visitante'}</span>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>vs {m.rival}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted }}>
            {matchTimeLabel(m) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0 }}><Icon name="clock" size={13} color={CC.faint} sw={2.2} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{matchTimeLabel(m)}</span></span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0 }}><Icon name="pin" size={13} color={CC.faint} sw={2.2} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.place}</span></span>
          </div>
        </div>
        {admin && <div style={{ color: CC.faint, flexShrink: 0 }}><Icon name="edit" size={17} sw={2.2} /></div>}
      </div>
      {admin && onRsvp && <MatchRsvpBar match={m} onOpen={onRsvp} />}
    </div>
  );
}
