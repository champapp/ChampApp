import { useState } from 'react';
import { CC, Icon, fmtDate } from '../../ui';
import { todayISO } from '../../lib/domain';

const R_COLOR = { W: CC.good, D: '#8E9BB5', L: CC.bad };
const R_LABEL = { W: 'G', D: 'E', L: 'P' };
const R_BG    = { W: CC.good, D: 'rgba(14,58,92,0.1)', L: CC.bad };

function matchResult(m) {
  if (m.score_us > m.score_them) return 'W';
  if (m.score_us < m.score_them) return 'L';
  return 'D';
}

function ResultChip({ r, size = 18 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.25, background: R_BG[r], display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: size * 0.58, color: r === 'D' ? CC.muted : '#fff', flexShrink: 0 }}>
      {R_LABEL[r]}
    </span>
  );
}

// Historial de victorias/empates/derrotas de la categoría del jugador.
// Compacto cuando está cerrado, desplegable para ver partido a partido.
export function MatchRecord({ player, matches }) {
  const [open, setOpen] = useState(false);

  const today = todayISO();
  const catMatches = (matches || [])
    .filter((m) => m.cat === player.cat && m.date < today && m.score_us != null && m.score_them != null)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!catMatches.length) return null;

  const wins   = catMatches.filter((m) => m.score_us > m.score_them).length;
  const draws  = catMatches.filter((m) => m.score_us === m.score_them).length;
  const losses = catMatches.filter((m) => m.score_us < m.score_them).length;
  const last5  = catMatches.slice(0, 5).reverse();

  const catLabel = player.cat + (player.sub ? ' · ' + player.sub : '');

  return (
    <div style={{ border: `1px solid ${CC.line}`, borderRadius: 14, background: '#fff', marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(14,34,53,0.04)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="trophy" size={17} color={CC.navy} sw={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.ink, letterSpacing: 0.3, lineHeight: 1 }}>
            Récord {catLabel}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.good }}>{wins}G</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.muted }}>{draws}E</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.bad }}>{losses}P</span>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, alignSelf: 'center' }}>{catMatches.length} partido{catMatches.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {/* últimos 5 como mini-chips */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {last5.map((m, i) => <ResultChip key={i} r={matchResult(m)} />)}
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={17} color={CC.faint} sw={2.3} />
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${CC.line}`, maxHeight: 300, overflowY: 'auto' }}>
          {catMatches.map((m) => {
            const r = matchResult(m);
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderBottom: `1px solid ${CC.line}` }}>
                <ResultChip r={r} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    vs {m.rival}
                  </div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint, marginTop: 1 }}>
                    {fmtDate(m.date)} · {m.home ? 'Local' : 'Visitante'}
                  </div>
                </div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: R_COLOR[r], letterSpacing: 0.3, flexShrink: 0 }}>
                  {m.score_us}–{m.score_them}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
