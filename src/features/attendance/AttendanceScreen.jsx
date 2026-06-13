import { useState } from 'react';
import {
  CC, Icon, Card, Chip, Empty, Ring, Avatar, SectionTitle, Toast, fmtDate, fmtPct, rateColor,
} from '../../ui';
import { useAuth } from '../auth/useAuth';
import {
  usePlayers, usePractices, useAttendance, useMatches, useRsvp, useGymChecks, useRoutines,
  useActiveInjuries, useSaveAttendance,
} from '../../lib/queries';
import {
  CATS, catById, todayISO, ageFromBirth, playerAttendance, playerHistory, playerStreak,
  groupAttendance, gymAttendance, categoryGymAttendance,
} from '../../lib/domain';
import { InjuryDot } from '../../components/player/InjuryDot';
import { CompareCard } from '../../components/player/CompareCard';
import { AttendanceCalendar } from '../../components/player/AttendanceCalendar';
import { useToast } from '../../lib/useToast';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function groupPracticesFor(practices, catId, sub, today) {
  const all = practices.filter((p) => p.cat === catId && (p.sub ?? null) === (sub ?? null));
  const up = all.filter((p) => p.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = all.filter((p) => p.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return up.concat(past);
}

function nearestPractice(list, today) {
  if (!list.length) return null;
  let best = list[0];
  let bestDiff = Infinity;
  list.forEach((pr) => {
    const diff = Math.abs(new Date(pr.date + 'T12:00') - new Date(today + 'T12:00'));
    if (diff < bestDiff) { bestDiff = diff; best = pr; }
  });
  return best;
}

// resumen de asistencia del jugador: anillo de % a cancha + "cuadro" de racha
// (racha actual y mejor racha de la temporada)
function MyAttendanceSummary({ att, streak }) {
  return (
    <Card pad={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Ring value={att.rate} size={76} stroke={10} color={rateColor(att.rate)} track="rgba(14,58,92,0.08)">
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink }}>{fmtPct(att.rate)}</div>
        </Ring>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>{att.present} de {att.total}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 1 }}>prácticas y partidos presente</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${CC.line}` }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(249,178,51,0.1)', borderRadius: 12, padding: '10px 0' }}>
          <Icon name="flame" size={20} color={CC.goldDeep} sw={2.2} />
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.ink, lineHeight: 1 }}>{streak.current}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Racha actual</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: CC.paper, borderRadius: 12, padding: '10px 0' }}>
          <Icon name="trophy" size={20} color={CC.navy} sw={2.2} />
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.ink, lineHeight: 1 }}>{streak.best}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Mejor racha</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AttendanceLoading() {
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>
      Cargando…
    </div>
  );
}

export function AttendanceScreen() {
  const { role, player } = useAuth();
  const isAdmin = role === 'admin';
  const [toast, showToast] = useToast();

  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymChecksQ = useGymChecks();
  const routinesQ = useRoutines();
  const injuriesQ = useActiveInjuries();
  const saveMutation = useSaveAttendance();

  const [catId, setCatId] = useState(player ? player.cat : 'M15');
  const [sub, setSub] = useState(() => {
    if (player) return player.sub ?? null;
    const c = catById('M15');
    return c?.subs[0] ?? null;
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [draft, setDraft] = useState(null);
  const [showDateInput, setShowDateInput] = useState(false);
  const [newDate, setNewDate] = useState(todayISO());

  const queries = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymChecksQ, routinesQ, injuriesQ];
  if (queries.some((q) => q.isLoading)) return <AttendanceLoading />;

  const players = playersQ.data ?? [];
  const practices = practicesQ.data ?? [];
  const attendance = attendanceQ.data ?? [];
  const matches = matchesQ.data ?? [];
  const rsvp = rsvpQ.data ?? [];
  const gymChecks = gymChecksQ.data ?? [];
  const routines = routinesQ.data ?? [];
  const injuries = injuriesQ.data ?? [];
  const today = todayISO();

  // ── jugador: pantalla personal con calendario, racha y comparativa
  // (sin ver al resto del plantel) ──────────────────────────────────
  if (player) {
    const att = playerAttendance({ practices, attendance, matches, rsvp, player, today });
    const history = playerHistory({ practices, attendance, matches, rsvp, gymChecks, player, today });
    const streak = playerStreak(history.filter((e) => e.type !== 'gym'));
    const categoryAvg = groupAttendance({ practices, attendance, cat: player.cat, sub: player.sub });
    const gymAtt = gymAttendance({ gymChecks, routines, player, today });
    const categoryGymAvg = categoryGymAttendance({ gymChecks, routines, players, cat: player.cat, sub: player.sub, today });

    return (
      <div style={{ padding: '4px 16px 20px' }}>
        <SectionTitle icon="attendance">Mi asistencia · {player.cat}{player.sub ? ' ' + player.sub : ''}</SectionTitle>
        <MyAttendanceSummary att={att} streak={streak} />
        <CompareCard player={player} attendance={att} categoryAvg={categoryAvg} gymAtt={gymAtt} categoryGymAvg={categoryGymAvg} />
        <AttendanceCalendar history={history} />
        <Toast msg={toast} />
      </div>
    );
  }

  const injuryByPlayer = new Map(injuries.map((i) => [i.player_id, i]));
  const cat = catById(catId) || CATS[0];

  const groupPractices = groupPracticesFor(practices, catId, sub, today);

  const current = (selectedDate != null ? groupPractices.find((p) => p.date === selectedDate) : null)
    ?? nearestPractice(groupPractices, today);

  const roster = players
    .filter((p) => p.cat === catId && (p.sub ?? null) === (sub ?? null))
    .slice()
    .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || '') || (a.nombre || '').localeCompare(b.nombre || ''));

  const editing = draft != null;
  const records = editing
    ? draft.records
    : (() => {
        const map = {};
        if (current) attendance.forEach((a) => { if (a.practice_id === current.id) map[a.player_id] = a.status; });
        return map;
      })();

  const present = roster.filter((p) => records[p.id] === 'P').length;
  const absent = roster.filter((p) => records[p.id] === 'A').length;
  const marked = present + absent;
  const rate = marked ? present / marked : 0;
  const unmarked = !editing && current && marked === 0;

  function selectCat(id) {
    const c = catById(id) || CATS[0];
    setCatId(id);
    setSub(c.subs[0] ?? null);
    setSelectedDate(null);
    setDraft(null);
  }
  function selectSub(s) {
    setSub(s);
    setSelectedDate(null);
    setDraft(null);
  }
  function selectDate(pr) {
    setSelectedDate(pr.date);
    setDraft(null);
  }
  function startEdit() {
    if (!current) return;
    const recs = {};
    attendance.forEach((a) => { if (a.practice_id === current.id) recs[a.player_id] = a.status; });
    if (!Object.keys(recs).length) roster.forEach((p) => { recs[p.id] = 'P'; });
    setDraft({ practiceId: current.id, isNew: false, date: current.date, records: recs });
  }
  function startNew(dateStr) {
    const recs = {};
    roster.forEach((p) => { recs[p.id] = 'P'; });
    setDraft({ practiceId: null, isNew: true, date: dateStr, records: recs });
  }
  function toggle(pid) {
    if (!editing) return;
    setDraft((d) => ({ ...d, records: { ...d.records, [pid]: d.records[pid] === 'P' ? 'A' : 'P' } }));
  }
  function allPresent() {
    if (!editing) return;
    setDraft((d) => {
      const r = {};
      roster.forEach((p) => { r[p.id] = 'P'; });
      return { ...d, records: r };
    });
  }
  function save() {
    saveMutation.mutate(
      { practiceId: draft.practiceId, isNew: draft.isNew, cat: catId, sub, date: draft.date, records: draft.records },
      {
        onSuccess: () => {
          setSelectedDate(draft.date);
          setDraft(null);
          showToast('Asistencia guardada · visible para los jugadores ✓');
        },
        onError: () => showToast('No se pudo guardar. Probá de nuevo.'),
      },
    );
  }

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="attendance">Tomar asistencia</SectionTitle>

      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 7 }}>Categoría</div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {CATS.map((c) => <Chip key={c.id} active={c.id === catId} onClick={() => selectCat(c.id)}>{c.id}</Chip>)}
      </div>

      {cat.subs.length > 0 && (
        <>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 7 }}>Subcategoría · año</div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
            {cat.subs.map((s) => <Chip key={s} active={s === sub} onClick={() => selectSub(s)}>{s}</Chip>)}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Fecha de la práctica</div>
        {isAdmin && !editing && (
          <button onClick={() => setShowDateInput((v) => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'rgba(249,178,51,0.18)',
            color: CC.goldDeep, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
          }}><Icon name="plus" size={15} sw={2.6} />Nueva práctica</button>
        )}
      </div>

      {showDateInput && isAdmin && !editing && (
        <Card pad={12} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{
              flex: 1, border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '9px 12px',
              fontFamily: 'Barlow, sans-serif', fontSize: 15, color: CC.ink,
            }} />
            <button onClick={() => { if (newDate) { startNew(newDate); setShowDateInput(false); } }} style={{
              border: 'none', background: CC.navy, color: '#fff', padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.4,
            }}>Crear</button>
          </div>
        </Card>
      )}

      {!editing && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
          {groupPractices.length === 0 && <Empty t="Sin prácticas registradas" />}
          {groupPractices.map((pr) => {
            const active = current && pr.id === current.id;
            return (
              <button key={pr.id} onClick={() => selectDate(pr)} style={{
                border: active ? 'none' : `1.5px solid ${CC.line}`, cursor: 'pointer',
                background: active ? CC.navy : '#fff', color: active ? '#fff' : CC.ink,
                borderRadius: 12, padding: '8px 12px', whiteSpace: 'nowrap', textAlign: 'center', flexShrink: 0,
              }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, lineHeight: 1 }}>{fmtDate(pr.date)}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: active ? 'rgba(255,255,255,0.7)' : CC.faint, marginTop: 2 }}>
                  {WEEKDAYS[new Date(pr.date + 'T12:00').getDay()]}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {editing && (
        <Card pad={12} style={{ marginBottom: 12, background: 'rgba(249,178,51,0.1)', border: `1.5px solid ${CC.gold}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="edit" size={18} color={CC.goldDeep} />
            <div style={{ flex: 1, fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: CC.ink }}>
              Editando práctica del {fmtDate(draft.date)}{draft.isNew ? ' (nueva)' : ''}
            </div>
            <button onClick={allPresent} style={{ border: 'none', background: '#fff', color: CC.navy, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>Todos presentes</button>
          </div>
        </Card>
      )}

      {unmarked && (
        <Card pad={16} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(249,178,51,0.08)', border: `1.5px solid ${CC.gold}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(249,178,51,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="clock" size={21} color={CC.goldDeep} sw={2.2} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>Práctica sin tomar</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 3 }}>{isAdmin ? 'Tocá “Editar asistencia” para registrarla.' : 'Aún no se registró la asistencia.'}</div>
          </div>
        </Card>
      )}
      {(current || editing) && !unmarked && (
        <Card pad={14} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Ring value={rate} size={70} stroke={9} color={rateColor(rate)} track="rgba(14,58,92,0.08)">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink }}>{fmtPct(rate)}</div>
          </Ring>
          <div style={{ flex: 1, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'rgba(30,158,106,0.1)', borderRadius: 12, padding: '10px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.good }}>{present}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, color: CC.good, letterSpacing: 0.4 }}>PRESENTES</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(224,82,78,0.09)', borderRadius: 12, padding: '10px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.bad }}>{absent}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, color: CC.bad, letterSpacing: 0.4 }}>AUSENTES</div>
            </div>
          </div>
        </Card>
      )}

      {isAdmin && current && !editing && (
        <button onClick={startEdit} style={{
          width: '100%', border: 'none', background: CC.navy, color: '#fff', padding: '13px', borderRadius: 14, cursor: 'pointer',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.5, marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}><Icon name="edit" size={18} />Editar asistencia</button>
      )}
      {isAdmin && editing && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button onClick={() => setDraft(null)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.muted, padding: '13px', borderRadius: 14, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Cancelar</button>
          <button onClick={save} disabled={saveMutation.isPending} style={{ flex: 2, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 14, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saveMutation.isPending ? 0.7 : 1 }}><Icon name="check" size={18} sw={2.6} />{saveMutation.isPending ? 'Guardando…' : 'Guardar'}</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {roster.map((p) => {
          const st = records[p.id];
          const pres = st === 'P';
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 14, padding: '9px 12px',
              boxShadow: '0 1px 2px rgba(14,34,53,0.04)',
              border: editing ? `1.5px solid ${pres ? 'rgba(30,158,106,0.3)' : 'rgba(224,82,78,0.3)'}` : '1.5px solid transparent',
            }}>
              <Avatar name={p.name} photo={p.photo_url} size={40} ring={player && p.id === player.id ? CC.gold : null} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}{player && p.id === player.id ? ' (vos)' : ''}</span>
                  <InjuryDot injury={injuryByPlayer.get(p.id)} />
                </div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.faint }}>{ageFromBirth(p)} años</div>
              </div>
              {editing ? (
                <button onClick={() => toggle(p.id)} style={{
                  border: 'none', cursor: 'pointer', minWidth: 104, padding: '8px 0', borderRadius: 10,
                  background: pres ? CC.good : CC.bad, color: '#fff',
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}><Icon name={pres ? 'check' : 'x'} size={15} sw={2.8} />{pres ? 'PRESENTE' : 'AUSENTE'}</button>
              ) : (
                <span style={{
                  minWidth: 104, padding: '8px 0', borderRadius: 10, textAlign: 'center',
                  background: pres ? 'rgba(30,158,106,0.12)' : (st === 'A' ? 'rgba(224,82,78,0.1)' : 'rgba(14,58,92,0.05)'),
                  color: pres ? CC.good : (st === 'A' ? CC.bad : CC.faint),
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>{st ? (<><Icon name={pres ? 'check' : 'x'} size={14} sw={2.8} />{pres ? 'PRESENTE' : 'AUSENTE'}</>) : '—'}</span>
              )}
            </div>
          );
        })}
      </div>

      <Toast msg={toast} />
    </div>
  );
}
