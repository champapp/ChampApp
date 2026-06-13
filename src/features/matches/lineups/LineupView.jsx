import { CC, Icon, Card, Avatar, matchLongDate, matchLabelShort } from '../../../ui';
import { POSITIONS, playerById } from '../../../lib/domain';
import { usePlayers, useMatches, useActiveInjuries } from '../../../lib/queries';
import { InjuryDot } from '../../../components/player/InjuryDot';

const GROUPS = [
  { t: 'Forwards', range: [1, 8] },
  { t: 'Backs', range: [9, 15] },
  { t: 'Suplentes', range: [16, 23] },
];

function posLabel(d) {
  if (d <= 15) { const s = POSITIONS.find((x) => x.dorsal === d); return s ? s.pos : ''; }
  return 'Suplente';
}

// Visualiza una alineación (lista por puesto, con fotos).
export function LineupView({ lineup, onEdit, onDelete }) {
  const playersQ = usePlayers();
  const matchesQ = useMatches();
  const injuriesQ = useActiveInjuries();

  if (playersQ.isLoading || matchesQ.isLoading || injuriesQ.isLoading) return null;

  const match = matchesQ.data.find((m) => m.id === lineup.match_id);
  const injuryByPlayer = new Map(injuriesQ.data.map((i) => [i.player_id, i]));
  const filled = Object.keys(lineup.positions).filter((d) => lineup.positions[d]).length;

  return (
    <Card pad={0} style={{ overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ background: `linear-gradient(150deg, ${CC.navy}, ${CC.navy900})`, padding: '13px 15px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(249,178,51,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="players" size={17} color={CC.gold} sw={2.2} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, letterSpacing: 0.3, lineHeight: 1 }}>{lineup.name}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{lineup.cat} · {match ? matchLabelShort(match) + ' · ' + matchLongDate(match.date) : 'partido'} · {filled} jugadores</div>
          </div>
          {onEdit && <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="edit" size={14} color="#fff" sw={2.3} /></button>}
          {onDelete && <button onClick={onDelete} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(224,82,78,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={15} color="#fff" sw={2.5} /></button>}
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {GROUPS.map((g) => {
          const rows = [];
          for (let d = g.range[0]; d <= g.range[1]; d++) { const pid = lineup.positions[d]; if (pid) rows.push({ d, p: playerById(playersQ.data, pid) }); }
          if (!rows.length) return null;
          return (
            <div key={g.t} style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: CC.faint, textTransform: 'uppercase', marginBottom: 8 }}>{g.t}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map(({ d, p }) => p && (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.navy }}>{d}</span></div>
                    <Avatar name={p.name} photo={p.photo_url} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span><InjuryDot injury={injuryByPlayer.get(p.id)} /></div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted }}>{posLabel(d)}{p.cat !== lineup.cat ? ' · ' + p.cat + (p.sub ? ' ' + p.sub : '') : ''}</div>
                    </div>
                    {p.cat !== lineup.cat && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, color: CC.goldDeep, background: 'rgba(249,178,51,0.16)', padding: '2px 7px', borderRadius: 999 }}>OTRA CAT.</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
