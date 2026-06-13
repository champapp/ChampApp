import { CC, Avatar, Icon, matchLongDate, matchLabelShort } from '../../../ui';
import { playerById } from '../../../lib/domain';
import { usePlayers, useMatches } from '../../../lib/queries';

// posición de cada dorsal en la cancha (x%, y% desde arriba)
const PITCH_SPOTS = {
  15: { x: 50, y: 9 },                         // fullback (atrás)
  11: { x: 16, y: 22 }, 14: { x: 84, y: 22 },  // wings
  13: { x: 67, y: 27 }, 12: { x: 41, y: 31 },  // centros
  10: { x: 33, y: 41 },                         // apertura
  9: { x: 52, y: 47 },                          // medio scrum
  6: { x: 24, y: 58 }, 8: { x: 50, y: 60 }, 7: { x: 76, y: 58 }, // tercera línea
  4: { x: 38, y: 70 }, 5: { x: 62, y: 70 },     // segunda línea
  1: { x: 30, y: 82 }, 2: { x: 50, y: 83 }, 3: { x: 70, y: 82 }, // primera línea
};

export function PitchPlayer({ dorsal, player }) {
  const initials = player ? player.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '';
  const last = player ? (player.name.split(' ').slice(-1)[0]) : '';
  return (
    <div style={{ position: 'absolute', left: PITCH_SPOTS[dorsal].x + '%', top: PITCH_SPOTS[dorsal].y + '%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 64 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', border: '2.5px solid #fff',
          background: player && player.photo_url ? `center/cover url(${player.photo_url})` : `linear-gradient(150deg, ${CC.navy700}, ${CC.navy900})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff',
        }}>{!(player && player.photo_url) && initials}</div>
        <div style={{ position: 'absolute', bottom: -4, right: -6, minWidth: 19, height: 19, padding: '0 4px', borderRadius: 999, background: CC.gold, color: CC.navy900, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0c6b2f', boxSizing: 'content-box', lineHeight: 1 }}>{dorsal}</div>
      </div>
      {player && (
        <div style={{ marginTop: 5, maxWidth: 70, textAlign: 'center', background: 'rgba(7,28,16,0.55)', borderRadius: 6, padding: '2px 6px', backdropFilter: 'blur(2px)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: '#fff', letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.05 }}>{last}</div>
        </div>
      )}
    </div>
  );
}

const LINE_COL = 'rgba(255,255,255,0.32)';

// Equipo parado en la cancha (vista del jugador). `embedded` quita el encabezado/marco.
export function LineupPitch({ lineup, embedded }) {
  const playersQ = usePlayers();
  const matchesQ = useMatches();

  if (playersQ.isLoading || matchesQ.isLoading) return null;

  const match = matchesQ.data.find((m) => m.id === lineup.match_id);
  const starters = [];
  for (let d = 1; d <= 15; d++) starters.push({ d, p: lineup.positions[d] ? playerById(playersQ.data, lineup.positions[d]) : null });
  const subs = [];
  for (let d = 16; d <= 23; d++) { const pid = lineup.positions[d]; if (pid) subs.push({ d, p: playerById(playersQ.data, pid) }); }

  return (
    <div style={{ borderRadius: embedded ? 0 : 18, overflow: 'hidden', marginBottom: embedded ? 0 : 14, boxShadow: embedded ? 'none' : '0 10px 28px rgba(7,36,61,0.2)', border: embedded ? 'none' : `1px solid ${CC.line}`, background: '#fff' }}>
      {/* encabezado */}
      {!embedded && (<div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', background: `linear-gradient(150deg, ${CC.navy}, ${CC.navy900})`, color: '#fff' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(249,178,51,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="players" size={16} color={CC.gold} sw={2.2} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.3, lineHeight: 1 }}>{lineup.name}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{lineup.cat}{match ? ' · ' + matchLabelShort(match) + ' · ' + matchLongDate(match.date) : ''}</div>
        </div>
      </div>)}

      {/* cancha */}
      <div style={{
        position: 'relative', width: '100%', paddingBottom: '128%',
        background: 'repeating-linear-gradient(0deg, #1c8f3f 0 9%, #189338 9% 18%)',
      }}>
        {/* textura de pasto + sombreado */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.10), rgba(0,0,0,0.18) 75%)' }} />
        {/* líneas de cancha */}
        <div style={{ position: 'absolute', inset: '4% 5%', border: `2px solid ${LINE_COL}`, borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: '5%', right: '5%', top: '50%', height: 0, borderTop: `2px solid ${LINE_COL}` }} />
        <div style={{ position: 'absolute', left: '5%', right: '5%', top: '26%', height: 0, borderTop: `2px dashed ${LINE_COL}` }} />
        <div style={{ position: 'absolute', left: '5%', right: '5%', top: '74%', height: 0, borderTop: `2px dashed ${LINE_COL}` }} />
        {/* try lines (in-goal) */}
        <div style={{ position: 'absolute', left: '5%', right: '5%', top: '13%', height: 0, borderTop: `2px solid ${LINE_COL}` }} />
        <div style={{ position: 'absolute', left: '5%', right: '5%', top: '87%', height: 0, borderTop: `2px solid ${LINE_COL}` }} />
        {/* jugadores */}
        {starters.map((s) => <PitchPlayer key={s.d} dorsal={s.d} player={s.p} />)}
      </div>

      {/* suplentes */}
      {subs.length > 0 && (
        <div style={{ padding: '11px 12px', background: CC.paper }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: CC.faint, textTransform: 'uppercase', marginBottom: 8 }}>Suplentes</div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 2 }}>
            {subs.map(({ d, p }) => p && (
              <div key={d} style={{ flexShrink: 0, width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={p.name} photo={p.photo_url} size={42} />
                  <div style={{ position: 'absolute', bottom: -3, right: -4, minWidth: 17, height: 17, padding: '0 3px', borderRadius: 999, background: CC.navy, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxSizing: 'content-box' }}>{d}</div>
                </div>
                <div style={{ marginTop: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11.5, color: CC.ink, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 56, lineHeight: 1 }}>{p.name.split(' ').slice(-1)[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
