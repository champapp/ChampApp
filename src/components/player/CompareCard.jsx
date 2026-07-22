import { CC, Icon, Card, fmtPct, rateColor } from '../../ui';

// barra comparativa: mi valor (relleno) vs el promedio de la categoría (marca dorada)
function CompareBar({ label, mine, avg, color }) {
  const max = Math.max(mine, avg, 0.0001) * 1.12;
  const diff = mine - avg;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink }}>{label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink }}>{fmtPct(mine)}</span>
          <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, color: diff >= 0 ? CC.good : CC.bad }}>
            {diff >= 0 ? '+' : ''}{Math.round(diff * 100)}%
          </span>
        </span>
      </div>
      <div style={{ position: 'relative', height: 12, background: 'rgba(14,58,92,0.07)', borderRadius: 6 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (mine / max * 100) + '%', background: color || CC.navy, borderRadius: 6, transition: 'width .6s cubic-bezier(.2,.8,.2,1)' }} />
        <div style={{ position: 'absolute', left: (avg / max * 100) + '%', top: -3, bottom: -3, width: 2.5, background: CC.gold, borderRadius: 2 }} title="Promedio de la categoría" />
      </div>
    </div>
  );
}

// Comparativa de la asistencia del jugador vs el promedio de su categoría,
// separando cancha (la marca el admin) y gimnasio (el mes actual).
export function CompareCard({ player, attendance, categoryAvg, gymAtt, categoryGymAvg }) {
  const showGym = categoryGymAvg && categoryGymAvg.total > 0;
  return (
    <Card pad={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="stats" size={19} color={CC.gold} sw={2.3} />
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>Mi asistencia vs categoría</span>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted }}>
          <span style={{ width: 11, height: 3, background: CC.gold, borderRadius: 2, display: 'inline-block' }} />promedio {player.cat}{player.sub ? ' ' + player.sub : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CompareBar label="Asistencia a cancha" mine={attendance.rate} avg={categoryAvg.rate} color={rateColor(attendance.rate)} />
        {showGym && <CompareBar label="Asistencia al gimnasio (este mes)" mine={gymAtt.rate} avg={categoryGymAvg.rate} color={rateColor(gymAtt.rate)} />}
      </div>
    </Card>
  );
}
