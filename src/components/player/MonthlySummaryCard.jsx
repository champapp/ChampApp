import { useState } from 'react';
import { CC, Icon, Card, Segmented, fmtPct, monthName, rateColor } from '../../ui';
import { playerMonthlyBreakdown, recentMonths } from '../../lib/domain';

// fila de un resumen mensual: label + barra + "presentes/total · %"
function MonthlyBar({ label, stat }) {
  const { present, total, rate } = stat;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink }}>{label}</span>
        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted }}>
          {total ? `${present}/${total} · ${fmtPct(rate)}` : 'Sin datos'}
        </span>
      </div>
      <div style={{ height: 10, background: 'rgba(14,58,92,0.07)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: Math.round(rate * 100) + '%', height: '100%', borderRadius: 5, background: rateColor(rate), transition: 'width .6s cubic-bezier(.2,.8,.2,1)' }} />
      </div>
    </div>
  );
}

// resumen mensual de un jugador: % de prácticas, partidos y gimnasio de un mes
// elegido. Se usa tanto en "Mi asistencia" (jugador) como en el perfil de
// jugador visto por un admin.
export function MonthlySummaryCard({ practices, attendance, matches, rsvp, gymChecks, routines, player, today }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const options = recentMonths(today, 6).map((m) => ({ id: m, label: monthName(m).slice(0, 3) }));
  const b = playerMonthlyBreakdown({ practices, attendance, matches, rsvp, gymChecks, routines, player, today, month });
  const showGym = b.gym.total > 0;

  return (
    <Card pad={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name="calendar" size={19} color={CC.gold} sw={2.3} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>Resumen mensual</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Segmented small options={options} value={month} onChange={setMonth} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <MonthlyBar label="Prácticas" stat={b.practice} />
        <MonthlyBar label="Partidos" stat={b.match} />
        {showGym && <MonthlyBar label="Gimnasio" stat={b.gym} />}
      </div>
    </Card>
  );
}
