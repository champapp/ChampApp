import { useState } from 'react';
import { CC, Icon, CatBadge } from '../../ui';
import { todayISO, matchRsvpStats, matchTimeLabel, scoreDivsForMatch } from '../../lib/domain';
import { usePlayers, useRsvp, useSetMatchScore } from '../../lib/queries';

const MONTH_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const SCORE_CATS = ['M13', 'M15', 'M17', 'M19', 'PS'];

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

const SINGLE_SCORE_DIV = [{ usKey: 'score_us', themKey: 'score_them', label: null }];

function divResult(match, d) {
  const us = match[d.usKey];
  const them = match[d.themKey];
  if (us == null || them == null) return null;
  return us > them ? 'won' : us === them ? 'tied' : 'lost';
}

function initScores(match, divs) {
  return Object.fromEntries(divs.map((d) => [
    d.usKey,
    { us: match[d.usKey] != null ? String(match[d.usKey]) : '', them: match[d.themKey] != null ? String(match[d.themKey]) : '' },
  ]));
}

// Entrada/display de marcador para partidos jugados (solo admin, categorías
// SCORE_CATS). Si el partido tiene divisiones con horario propio (PS,
// M17) muestra un marcador por cada una de las que tengan horario cargado;
// si no, un único marcador general.
function ScoreBar({ match, toast }) {
  const [open, setOpen] = useState(false);
  const divs = scoreDivsForMatch(match) || SINGLE_SCORE_DIV;
  const [scores, setScores] = useState(() => initScores(match, divs));
  const setScore = useSetMatchScore();

  const results = divs.map((d) => ({ d, r: divResult(match, d) }));
  const hasAnyScore = results.some(({ r }) => r != null);
  const allFilled = divs.every((d) => scores[d.usKey].us !== '' && scores[d.usKey].them !== '');

  function setField(usKey, field, value) {
    setScores((s) => ({ ...s, [usKey]: { ...s[usKey], [field]: value } }));
  }

  function openEdit() {
    setScores(initScores(match, divs));
    setOpen(true);
  }

  function save() {
    if (!allFilled) return;
    const patch = { id: match.id };
    divs.forEach((d) => {
      patch[d.usKey] = Number(scores[d.usKey].us);
      patch[d.themKey] = Number(scores[d.usKey].them);
    });
    setScore.mutate(patch, {
      onSuccess: () => { setOpen(false); toast?.('Resultado guardado'); },
      onError: () => toast?.('Error al guardar'),
    });
  }

  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); openEdit(); }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', cursor: 'pointer', border: 'none', borderTop: `1px solid ${CC.line}`, background: 'transparent', padding: '9px 2px 2px', marginTop: 9, textAlign: 'left' }}
      >
        <Icon name="trophy" size={14} color={hasAnyScore ? CC.navy : CC.faint} sw={2.2} />
        {hasAnyScore ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {results.filter(({ r }) => r != null).map(({ d, r }) => {
              const color = r === 'won' ? CC.good : r === 'tied' ? CC.muted : CC.bad;
              return (
                <span key={d.usKey} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                  {d.label && <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, color: CC.faint }}>{d.label}</span>}
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color, letterSpacing: 0.4 }}>
                    {match[d.usKey]} – {match[d.themKey]}
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, color: CC.faint, letterSpacing: 0.3 }}>Cargar resultado</span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: CC.faint, display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Icon name="edit" size={13} color={CC.faint} sw={2.2} />{hasAnyScore ? 'Editar' : ''}
        </span>
      </button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ borderTop: `1px solid ${CC.line}`, marginTop: 9, paddingTop: 10 }}>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, color: CC.muted, letterSpacing: 0.4, marginBottom: 8, textTransform: 'uppercase' }}>Resultado{divs.length > 1 ? ' por división' : ''}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {divs.map((d) => (
          <div key={d.usKey}>
            {d.label && <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.navy, marginBottom: 5 }}>{d.label}</div>}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, letterSpacing: 0.3, marginBottom: 4 }}>CHAMP</div>
                <input
                  type="number" min="0" inputMode="numeric" value={scores[d.usKey].us} onChange={(e) => setField(d.usKey, 'us', e.target.value)}
                  style={{ width: '100%', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: CC.ink, textAlign: 'center', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, color: CC.faint, fontWeight: 700, paddingBottom: 8 }}>–</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, letterSpacing: 0.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.rival.toUpperCase().slice(0, 14)}</div>
                <input
                  type="number" min="0" inputMode="numeric" value={scores[d.usKey].them} onChange={(e) => setField(d.usKey, 'them', e.target.value)}
                  style={{ width: '100%', border: `1.5px solid ${CC.line}`, borderRadius: 9, padding: '8px 10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: CC.ink, textAlign: 'center', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={setScore.isPending || !allFilled} style={{ flex: 1, height: 44, border: 'none', background: CC.gold, color: CC.navy900, borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.3, opacity: (setScore.isPending || !allFilled) ? 0.5 : 1 }}>Guardar</button>
          <button onClick={() => setOpen(false)} style={{ height: 44, border: 'none', background: 'rgba(14,58,92,0.07)', color: CC.muted, borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// Botón "Cómo llegar" para partidos de visitante
function MapsButton({ match }) {
  const url = match.maps_url || `https://maps.google.com/?q=${encodeURIComponent((match.place || match.rival) + ' Uruguay')}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(14,58,92,0.07)', borderRadius: 8, padding: '4px 9px', textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: CC.navy, letterSpacing: 0.3, flexShrink: 0 }}
    >
      <Icon name="pin" size={13} color={CC.navy} sw={2.3} />Cómo llegar
    </a>
  );
}

// Tarjeta de partido. `admin` habilita edición (tap) y las barras de convocatoria/resultado.
export function MatchCard({ m, onEdit, admin, onRsvp, toast }) {
  const past = m.date < todayISO();
  const hasScore = m.score_us != null && m.score_them != null;
  const won = hasScore && m.score_us > m.score_them;
  const tied = hasScore && m.score_us === m.score_them;

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '13px 14px',
      border: `1px solid ${CC.line}`, boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 18px rgba(14,34,53,0.05)',
      opacity: past && !SCORE_CATS.includes(m.cat) ? 0.62 : past ? 0.85 : 1,
    }}>
      <div onClick={admin ? () => onEdit(m) : undefined} style={{ display: 'flex', alignItems: 'center', gap: 13, cursor: admin ? 'pointer' : 'default' }}>
        {/* fecha pill */}
        <div style={{ width: 54, flexShrink: 0, textAlign: 'center', background: past ? 'rgba(14,58,92,0.05)' : CC.navy, borderRadius: 12, padding: '8px 0 6px', color: past ? CC.muted : '#fff' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: 0.95 }}>{m.date.slice(8, 10)}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: past ? CC.faint : CC.gold }}>{MONTH_SHORT[parseInt(m.date.slice(5, 7), 10) - 1]}</div>
          {past && hasScore && (
            <div style={{ marginTop: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, lineHeight: 1, color: won ? CC.good : tied ? CC.muted : CC.bad }}>
              {m.score_us}–{m.score_them}
            </div>
          )}
        </div>
        {/* detalle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <CatBadge id={m.cat} />
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: m.home ? CC.good : CC.goldDeep, textTransform: 'uppercase' }}>{m.home ? 'Local' : 'Visitante'}</span>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>vs {m.rival}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, flexWrap: 'wrap' }}>
            {matchTimeLabel(m) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
                <Icon name="clock" size={13} color={CC.faint} sw={2.2} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{matchTimeLabel(m)}</span>
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
              <Icon name="pin" size={13} color={CC.faint} sw={2.2} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{m.place}</span>
            </span>
            {!m.home && !past && <MapsButton match={m} />}
          </div>
        </div>
        {admin && <div style={{ color: CC.faint, flexShrink: 0 }}><Icon name="edit" size={17} sw={2.2} /></div>}
      </div>
      {admin && onRsvp && !past && <MatchRsvpBar match={m} onOpen={onRsvp} />}
      {admin && past && SCORE_CATS.includes(m.cat) && <ScoreBar match={m} toast={toast} />}
    </div>
  );
}
