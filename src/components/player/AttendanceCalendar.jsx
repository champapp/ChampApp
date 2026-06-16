import { useState } from 'react';
import { CC, Icon, Card, Segmented, monthName } from '../../ui';
import { todayISO } from '../../lib/domain';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const pad2 = (n) => String(n).padStart(2, '0');

// Calendario mensual con el historial de asistencia de un jugador: cancha
// (presente/ausente, marcada por el admin) y gimnasio (check del jugador).
export function AttendanceCalendar({ history }) {
  const today = todayISO();

  const canchaByDate = {};
  const gymDates = new Set();
  history.forEach((e) => {
    if (e.type === 'gym') gymDates.add(e.date);
    else canchaByDate[e.date] = { status: e.status, type: e.type };
  });

  const monthIds = Array.from(new Set(history.map((e) => e.date.slice(0, 7)))).sort();
  const months = monthIds.map((id) => ({ id, label: monthName(id).slice(0, 3) }));
  const defaultMonth = months.length ? months[months.length - 1].id : today.slice(0, 7);
  const [mid, setMid] = useState(defaultMonth);

  const [y, mo] = mid.split('-').map((x) => parseInt(x, 10));
  const daysInMonth = new Date(y, mo, 0).getDate();
  const firstIdx = (new Date(y, mo - 1, 1).getDay() + 6) % 7; // lunes = 0

  const cells = [];
  for (let i = 0; i < firstIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  let pres = 0;
  let abs = 0;
  let gymCount = 0;
  let matchPres = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${pad2(mo)}-${pad2(d)}`;
    const cell = canchaByDate[ds];
    if (cell?.status === 'P') { pres++; if (cell.type === 'match') matchPres++; }
    else if (cell?.status === 'A') abs++;
    if (gymDates.has(ds)) gymCount++;
  }

  return (
    <Card pad={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name="calendar" size={19} color={CC.gold} sw={2.3} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 }}>Historial de asistencia</span>
      </div>

      {months.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <Segmented small value={mid} onChange={setMid} options={months} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 10.5, color: CC.faint, letterSpacing: 0.5, paddingBottom: 2 }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={'e' + i} />;
          const ds = `${y}-${pad2(mo)}-${pad2(d)}`;
          const cell = canchaByDate[ds];
          const gym = gymDates.has(ds);
          const isP = cell?.status === 'P';
          const isA = cell?.status === 'A';
          const isMatch = cell?.type === 'match';
          const gymOnly = gym && !cell;
          return (
            <div key={ds} style={{
              aspectRatio: '1 / 1', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              background: gymOnly ? CC.gold : isP ? (isMatch ? CC.navy : CC.good) : isA ? 'rgba(224,82,78,0.12)' : 'transparent',
              border: isA ? `1.5px solid ${CC.bad}` : (cell || gym) ? 'none' : `1px solid ${CC.line}`,
            }}>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13,
                color: gymOnly ? CC.navy900 : isP ? '#fff' : isA ? CC.bad : CC.faint,
              }}>{d}</span>
              {isP && <span style={{ position: 'absolute', top: 3, right: 4 }}><Icon name={isMatch ? 'trophy' : 'check'} size={9} color="rgba(255,255,255,0.85)" sw={3.4} /></span>}
              {gymOnly && <span style={{ position: 'absolute', top: 2, right: 3 }}><Icon name="weight" size={9} color={CC.navy900} sw={3} /></span>}
              {gym && cell && (
                <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: CC.gold, border: '1px solid #fff', boxSizing: 'border-box' }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${CC.line}` }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: CC.good, display: 'inline-block' }} />
          <b style={{ color: CC.ink, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15 }}>{pres}</b> presentes
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: CC.navy, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trophy" size={9} color="#fff" sw={3} /></span>
          <b style={{ color: CC.ink, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15 }}>{matchPres}</b> partidos
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(224,82,78,0.12)', border: `1.5px solid ${CC.bad}`, boxSizing: 'border-box', display: 'inline-block' }} />
          <b style={{ color: CC.ink, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15 }}>{abs}</b> ausentes
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: CC.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="weight" size={9} color={CC.navy900} sw={3} /></span>
          <b style={{ color: CC.ink, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15 }}>{gymCount}</b> gym
        </span>
      </div>
    </Card>
  );
}
