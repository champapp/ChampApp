// Funciones de dominio del club, portadas de design_handoff_champ_app/champ-data.js.
// A diferencia del prototipo (que mantenía todo en memoria/localStorage), estas
// funciones son puras: reciben filas tal como vienen de Supabase (snake_case) y
// devuelven valores derivados. Los datos se cargan con React Query en src/features/*.

// ── Categorías ──────────────────────────────────────────────
export const CATS = [
  { id: 'PS', label: 'PS', full: 'Plantel Superior', subs: [] },
  { id: 'M19', label: 'M19', full: 'Menores de 19', subs: ['2007', '2008'] },
  { id: 'M17', label: 'M17', full: 'Menores de 17', subs: ['2009', '2010'] },
  { id: 'M15', label: 'M15', full: 'Menores de 15', subs: ['2011', '2012'] },
  { id: 'M13', label: 'M13', full: 'Menores de 13', subs: ['2013', '2014'] },
  { id: 'M11', label: 'M11', full: 'Menores de 11', subs: ['2015', '2016'] },
  { id: 'M9', label: 'M9', full: 'Menores de 9', subs: ['2017', '2018'] },
  { id: 'M7', label: 'M7', full: 'Menores de 7', subs: ['2019', '2020'] },
];

// Categorías que registran mediciones de gimnasio.
export const GYM_CATS = ['PS', 'M19', 'M17', 'M15'];

export function catById(id) {
  return CATS.find((c) => c.id === id) || null;
}

// 15 posiciones titulares, en orden de dorsal (1 a 15).
export const POSITIONS = [
  { pos: 'Pilar izquierdo', short: 'Pilar', type: 'Forward', dorsal: 1 },
  { pos: 'Hooker', short: 'Hooker', type: 'Forward', dorsal: 2 },
  { pos: 'Pilar derecho', short: 'Pilar', type: 'Forward', dorsal: 3 },
  { pos: 'Segunda línea', short: '2da línea', type: 'Forward', dorsal: 4 },
  { pos: 'Segunda línea', short: '2da línea', type: 'Forward', dorsal: 5 },
  { pos: 'Ala', short: 'Ala', type: 'Forward', dorsal: 6 },
  { pos: 'Ala', short: 'Ala', type: 'Forward', dorsal: 7 },
  { pos: 'Octavo', short: 'Octavo', type: 'Forward', dorsal: 8 },
  { pos: 'Medio scrum', short: 'Medio scrum', type: 'Back', dorsal: 9 },
  { pos: 'Apertura', short: 'Apertura', type: 'Back', dorsal: 10 },
  { pos: 'Wing izquierdo', short: 'Wing', type: 'Back', dorsal: 11 },
  { pos: 'Centro interno', short: 'Centro', type: 'Back', dorsal: 12 },
  { pos: 'Centro externo', short: 'Centro', type: 'Back', dorsal: 13 },
  { pos: 'Wing derecho', short: 'Wing', type: 'Back', dorsal: 14 },
  { pos: 'Fullback', short: 'Fullback', type: 'Back', dorsal: 15 },
];

// dorsal libre más bajo para un grupo (cat + sub)
export function nextDorsal(players, cat, sub) {
  const used = new Set(
    players.filter((p) => p.cat === cat && p.sub === (sub || null)).map((p) => p.dorsal)
  );
  for (let d = 1; d < 60; d++) if (!used.has(d)) return d;
  return 99;
}

// ── Fechas y meses ──────────────────────────────────────────
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function inMonth(dateStr, month) {
  return month === 'all' || (dateStr || '').slice(0, 7) === month;
}

// los 12 meses del año de `today`, más la opción "Todo"
export function monthsList(today = todayISO()) {
  const year = today.slice(0, 4);
  const months = [{ id: 'all', label: 'Todo' }];
  for (let mi = 1; mi <= 12; mi++) {
    months.push({ id: `${year}-${String(mi).padStart(2, '0')}`, label: MONTH_NAMES[mi - 1] });
  }
  return months;
}

// los últimos `n` meses (formato 'YYYY-MM'), terminando en el mes de `today`
export function recentMonths(today = todayISO(), n = 5) {
  const [y, m] = today.slice(0, 7).split('-').map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    let yy = y;
    let mm = m - i;
    while (mm <= 0) { mm += 12; yy -= 1; }
    out.push(`${yy}-${String(mm).padStart(2, '0')}`);
  }
  return out;
}

// lunes de la semana de `iso`
export function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00');
  const back = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
}

// ── Asistencia ──────────────────────────────────────────────

// agrupa filas de `attendance` por practice_id
function groupAttendanceByPractice(attendance) {
  const map = new Map();
  attendance.forEach((a) => {
    if (!map.has(a.practice_id)) map.set(a.practice_id, []);
    map.get(a.practice_id).push(a);
  });
  return map;
}

// presencias/ausencias a PARTIDOS de un jugador, según su RSVP, para partidos ya jugados
export function matchAttEvents({ matches, rsvp, player, today = todayISO(), month = 'all' }) {
  return matches
    .filter((m) => m.cat === player.cat && (player.sub == null || !m.sub || m.sub === player.sub) && m.date <= today)
    .map((m) => {
      const answer = rsvp.find((r) => r.match_id === m.id && r.player_id === player.id)?.answer;
      if (answer !== 'yes' && answer !== 'no') return null;
      return { date: m.date, status: answer === 'yes' ? 'P' : 'A', type: 'match', match: m };
    })
    .filter((e) => e && inMonth(e.date, month));
}

// fechas (1 por día) en que un jugador marcó su check de gimnasio
export function gymAttDates({ gymChecks, playerId, month = 'all' }) {
  const seen = new Set();
  return gymChecks
    .filter((c) => c.player_id === playerId && inMonth(c.date, month))
    .map((c) => c.date)
    .filter((d) => (seen.has(d) ? false : (seen.add(d), true)));
}

// asistencia a cancha de un jugador (prácticas + partidos marcados por el
// admin). La asistencia al gimnasio se calcula por separado, ver gymAttendance.
export function playerAttendance({ practices, attendance, matches, rsvp, player, today = todayISO(), month = 'all' }) {
  let present = 0;
  let total = 0;
  const practiceById = new Map(practices.map((p) => [p.id, p]));

  attendance.forEach((a) => {
    if (a.player_id !== player.id) return;
    const pr = practiceById.get(a.practice_id);
    if (!pr || !inMonth(pr.date, month)) return;
    total++;
    if (a.status === 'P') present++;
  });

  matchAttEvents({ matches, rsvp, player, today, month }).forEach((e) => {
    total++;
    if (e.status === 'P') present++;
  });

  return { present, total, rate: total ? present / total : 0 };
}

// asistencia a cancha agregada de un grupo (cat + sub opcional)
export function groupAttendance({ practices, attendance, cat, sub, month = 'all' }) {
  let present = 0;
  let total = 0;
  let sessions = 0;
  const byPractice = groupAttendanceByPractice(attendance);

  practices.forEach((pr) => {
    if (pr.cat !== cat) return;
    if (sub != null && pr.sub !== sub) return;
    if (!inMonth(pr.date, month)) return;
    const records = byPractice.get(pr.id) || [];
    if (!records.length) return;
    sessions++;
    records.forEach((a) => {
      total++;
      if (a.status === 'P') present++;
    });
  });

  return { present, total, sessions, rate: total ? present / total : 0 };
}

// asistencia a cancha agregada de cada categoría
export function categoryAttendance({ practices, attendance, month = 'all' }) {
  return CATS.map((c) => ({
    ...c,
    ...groupAttendance({ practices, attendance, cat: c.id, sub: null, month }),
  }));
}

// evolución de la asistencia mes a mes (últimos `months` meses)
export function monthlyTrend({ practices, attendance, cat = 'all', today = todayISO(), months = 5 }) {
  const range = recentMonths(today, months);
  const byPractice = groupAttendanceByPractice(attendance);

  return range.map((m) => {
    let present = 0;
    let total = 0;
    practices.forEach((pr) => {
      if (cat !== 'all' && pr.cat !== cat) return;
      if (pr.date.slice(0, 7) !== m) return;
      (byPractice.get(pr.id) || []).forEach((a) => {
        total++;
        if (a.status === 'P') present++;
      });
    });
    return { month: m, rate: total ? present / total : 0, total };
  });
}

// jugadores con menor % de asistencia a cancha de un grupo
export function leastAttenders({ practices, attendance, matches, rsvp, players, cat, sub, today = todayISO(), month = 'all', limit = 6 }) {
  return players
    .filter((p) => p.cat === cat && (sub == null || p.sub === sub))
    .map((p) => ({ ...p, att: playerAttendance({ practices, attendance, matches, rsvp, player: p, today, month }) }))
    .filter((p) => p.att.total > 0)
    .sort((a, b) => a.att.rate - b.att.rate)
    .slice(0, limit);
}

// historial cronológico de un jugador: [{ date, status, type }]
export function playerHistory({ practices, attendance, matches, rsvp, gymChecks, player, today = todayISO() }) {
  const practiceById = new Map(practices.map((p) => [p.id, p]));

  const prac = attendance
    .filter((a) => a.player_id === player.id)
    .map((a) => {
      const pr = practiceById.get(a.practice_id);
      return pr ? { date: pr.date, status: a.status, type: 'practice' } : null;
    })
    .filter(Boolean);

  const mt = matchAttEvents({ matches, rsvp, player, today });

  const gym = gymChecks
    .filter((c) => c.player_id === player.id)
    .map((c) => ({ date: c.date, status: 'P', type: 'gym' }));

  return prac.concat(mt).concat(gym).sort((a, b) => a.date.localeCompare(b.date));
}

// rachas de presencias: actual y mejor de la temporada (a partir de un historial)
export function playerStreak(history) {
  let best = 0;
  let run = 0;
  let current = 0;
  history.forEach((e) => {
    if (e.status === 'P') { run++; if (run > best) best = run; } else run = 0;
  });
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].status === 'P') current++; else break;
  }
  return { current, best, total: history.length };
}

// faltas consecutivas más recientes (a partir de un historial)
export function consecutiveAbsences(history) {
  let count = 0;
  let lastDate = null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].status === 'A') {
      count++;
      if (!lastDate) lastDate = history[i].date;
    } else break;
  }
  return { count, lastDate };
}

// jugadores con N+ faltas consecutivas, sin marcar como "ya contactado"
export function attendanceAlerts({ players, historyByPlayer, threshold = 3, contactedIds = new Set() }) {
  return players
    .map((p) => ({ player: p, ...consecutiveAbsences(historyByPlayer.get(p.id) || []) }))
    .filter((a) => a.count >= threshold && !contactedIds.has(a.player.id))
    .sort((a, b) => b.count - a.count || a.player.name.localeCompare(b.player.name));
}

// asistencia general del club (todas las prácticas con registros, en el mes dado)
export function overall({ practices, attendance, players, month = 'all' }) {
  let present = 0;
  let total = 0;
  const sessionSet = new Set();
  const byPractice = groupAttendanceByPractice(attendance);

  practices.forEach((pr) => {
    if (!inMonth(pr.date, month)) return;
    const records = byPractice.get(pr.id) || [];
    if (!records.length) return;
    sessionSet.add(pr.id);
    records.forEach((a) => {
      total++;
      if (a.status === 'P') present++;
    });
  });

  return { rate: total ? present / total : 0, players: players.length, sessions: sessionSet.size, present, absent: total - present };
}

// última marca registrada de cada ejercicio, para un jugador
export function latestGymMarks(gymMarks, playerId) {
  const out = {};
  gymMarks
    .filter((g) => g.player_id === playerId)
    .forEach((g) => {
      const cur = out[g.exercise];
      if (!cur || g.date > cur.date) out[g.exercise] = g;
    });
  return out;
}

// historial completo de marcas de un jugador, agrupado por ejercicio (de
// más reciente a más antigua), con la mejor marca de cada uno destacada
// como RÉCORD: en 'seg' (tiempo) menor es mejor, en el resto mayor es mejor.
export function gymMarksHistory(gymMarks, playerId) {
  const byExercise = {};
  gymMarks
    .filter((g) => g.player_id === playerId)
    .forEach((g) => {
      if (!byExercise[g.exercise]) byExercise[g.exercise] = [];
      byExercise[g.exercise].push(g);
    });
  return Object.entries(byExercise).map(([exercise, marks]) => {
    const sorted = [...marks].sort((a, b) => b.date.localeCompare(a.date));
    const unit = sorted[0].unit;
    const isBetter = unit === 'seg' ? (a, b) => a.value < b.value : (a, b) => a.value > b.value;
    const best = sorted.reduce((m, x) => (isBetter(x, m) ? x : m), sorted[0]);
    return { exercise, unit, marks: sorted, best };
  });
}

// promedios de un grupo (asistencia a cancha, físico, marcas de gimnasio) para comparativas
export function categoryAverages({ practices, attendance, players, gymMarks, cat, sub, month = 'all' }) {
  const roster = players.filter((p) => p.cat === cat && (sub == null || p.sub === sub));
  const rate = groupAttendance({ practices, attendance, cat, sub, month }).rate;

  let peso = 0;
  let talla = 0;
  let imc = 0;
  roster.forEach((p) => {
    peso += Number(p.peso) || 0;
    talla += Number(p.talla) || 0;
    imc += Number(p.imc) || 0;
  });
  const n = roster.length;

  const gym = {};
  const gymRoster = roster.filter((p) => GYM_CATS.includes(p.cat));
  if (gymRoster.length) {
    const marksByPlayer = gymRoster.map((p) => latestGymMarks(gymMarks, p.id));
    const exercises = new Set();
    marksByPlayer.forEach((m) => Object.keys(m).forEach((ex) => exercises.add(ex)));
    exercises.forEach((ex) => {
      let sum = 0;
      let count = 0;
      marksByPlayer.forEach((m) => {
        if (m[ex]) { sum += Number(m[ex].value) || 0; count++; }
      });
      gym[ex] = count ? sum / count : 0;
    });
  }

  return { rate, peso: n ? peso / n : 0, talla: n ? talla / n : 0, imc: n ? imc / n : 0, gym, rosterSize: n };
}

// insignias / logros de un jugador, a partir de sus métricas ya calculadas
export function playerBadges({ attendance, streak, categoryAvg, gymMarks = [] }) {
  const out = [];

  if (attendance.total > 0 && attendance.rate >= 0.95) {
    out.push({ id: 'top', icon: 'trophy', label: 'Asistencia top', detail: '95%+ de presencias', tone: 'gold' });
  } else if (attendance.rate >= 0.85) {
    out.push({ id: 'constante', icon: 'check', label: 'Constante', detail: '85%+ de asistencia', tone: 'good' });
  }

  if (streak.current >= 4) {
    out.push({ id: 'racha', icon: 'flame', label: `Racha x${streak.current}`, detail: 'prácticas seguidas', tone: 'gold' });
  } else if (streak.best >= 5) {
    out.push({ id: 'rachaBest', icon: 'flame', label: 'Mejor racha', detail: `x${streak.best} en la temporada`, tone: 'navy' });
  }

  if (attendance.total > 0 && attendance.rate > categoryAvg.rate + 0.05) {
    out.push({
      id: 'sobre', icon: 'arrowUp', label: 'Sobre promedio',
      detail: `+${Math.round((attendance.rate - categoryAvg.rate) * 100)}% vs categoría`, tone: 'good',
    });
  }

  if (gymMarks.length) {
    const byExercise = new Map();
    gymMarks.forEach((g) => {
      if (!byExercise.has(g.exercise)) byExercise.set(g.exercise, []);
      byExercise.get(g.exercise).push(g);
    });
    let bestExercise = null;
    let bestPct = 0;
    let bestDelta = 0;
    let bestUnit = '';
    byExercise.forEach((series, exercise) => {
      const sorted = series.slice().sort((a, b) => a.date.localeCompare(b.date));
      const delta = sorted[sorted.length - 1].value - sorted[0].value;
      const pct = sorted[0].value ? delta / sorted[0].value : 0;
      if (pct > bestPct) { bestPct = pct; bestExercise = exercise; bestDelta = delta; bestUnit = sorted[sorted.length - 1].unit; }
    });
    if (bestExercise && bestDelta > 0) {
      out.push({ id: 'gym', icon: 'weight', label: `+${bestDelta} ${bestUnit}`, detail: `en ${bestExercise}`, tone: 'navy' });
    }
  }

  return out;
}

// ── Lesiones ────────────────────────────────────────────────

// estado de una lesión activa (o null si ya retornó / no hay lesión)
export function injuryStatus(injury, today = todayISO()) {
  if (!injury || !injury.return_date) return null;
  if (injury.return_date < today) return null;
  const days = Math.max(0, Math.ceil((new Date(injury.return_date + 'T12:00') - new Date(today + 'T12:00')) / 86400000));
  return {
    days,
    returnDate: injury.return_date,
    reason: injury.reason || '',
    color: days > 7 ? 'red' : 'yellow',
    since: injury.since || null,
  };
}

// jugadores actualmente lesionados, ordenados por categoría y nombre
export function injuredPlayers({ players, injuryByPlayer, today = todayISO() }) {
  const order = new Map(CATS.map((c, i) => [c.id, i]));
  return players
    .filter((p) => injuryStatus(injuryByPlayer.get(p.id), today))
    .sort((a, b) => (order.get(a.cat) - order.get(b.cat)) || (a.sub || '').localeCompare(b.sub || '') || a.name.localeCompare(b.name));
}

// protocolos de recuperación de una lesión, del más reciente al más antiguo
export function protocolsForInjury(protocols, injuryId) {
  return (protocols || [])
    .filter((pr) => pr.injury_id === injuryId)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
}

// ── Documentación administrativa ───────────────────────────
export const ADMIN_DOC_TYPES = ['Ficha médica', 'Curso Conmoción', 'Rugby Ready', 'Antidoping'];

export function adminDocStatus(doc, today = todayISO()) {
  if (!doc || !doc.type || !doc.expiry) return null;
  const days = Math.ceil((new Date(doc.expiry + 'T12:00') - new Date(today + 'T12:00')) / 86400000);
  if (days < 0) return { days, level: 'expired' };
  if (days <= 31) return { days, level: 'warn' };
  return { days, level: 'ok' };
}

// documentos vencidos o por vencer (≤1 mes) de un jugador
export function adminDocAlerts(docs, today = todayISO()) {
  return (docs || [])
    .map((doc) => ({ doc, status: adminDocStatus(doc, today) }))
    .filter((x) => x.status && (x.status.level === 'expired' || x.status.level === 'warn'));
}

// ── Partidos y RSVP ─────────────────────────────────────────

// cancha local del club, valor por defecto al crear un partido de local
export const HOME_PLACE = 'RCU - Cancha 1';

// divisiones del Plantel Superior y sus columnas de horario en `matches`
export const PS_DIVS = [
  { key: 'time_primera', citeKey: 'cite_primera', label: 'Primera' },
  { key: 'time_intermedia', citeKey: 'cite_intermedia', label: 'Intermedia' },
  { key: 'time_preintermedia', citeKey: 'cite_preintermedia', label: 'Pre-Intermedia' },
];

// divisiones de M17 y sus columnas de horario en `matches`
export const M17_DIVS = [
  { key: 'time_m17', citeKey: 'cite_m17', label: 'M17' },
  { key: 'time_m16', citeKey: 'cite_m16', label: 'M16' },
];

// labels de division para jugadores de Plantel Superior (players.division)
export const PS_DIVISIONS = PS_DIVS.map((d) => d.label);

// horarios de kick off (y citación) cargados para un partido de PS, por división
export function psMatchTimes(m) {
  return PS_DIVS.filter((d) => m[d.key]).map((d) => ({ label: d.label, time: m[d.key], cite: m[d.citeKey] || null }));
}

// horarios de kick off (y citación) cargados para un partido de M17, por división
export function m17MatchTimes(m) {
  return M17_DIVS.filter((d) => m[d.key]).map((d) => ({ label: d.label, time: m[d.key], cite: m[d.citeKey] || null }));
}

// texto de horario(s) de kick off de un partido, para mostrar en listas/encuestas
export function matchTimeLabel(m) {
  if (m.cat === 'PS') {
    const times = psMatchTimes(m);
    return times.length ? times.map((t) => t.label + ' ' + t.time).join(' · ') + ' hs' : '';
  }
  if (m.cat === 'M17') {
    const times = m17MatchTimes(m);
    if (times.length) return times.map((t) => t.label + ' ' + t.time).join(' · ') + ' hs';
  }
  return m.time ? m.time + ' hs' : '';
}

// próximo partido de una categoría (a partir de hoy)
export function nextMatch({ matches, cat, sub, today = todayISO() }) {
  const list = matches
    .filter((m) => m.cat === cat && (sub == null || !m.sub || m.sub === sub) && m.date >= today)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  return list[0] || null;
}

// todos los partidos de una categoría (o de todas, con cat = 'all'), ordenados
export function matchesForCat(matches, cat) {
  return matches
    .filter((m) => cat === 'all' || m.cat === cat)
    .slice()
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}

// la encuesta de un partido está activa desde el lunes de su semana hasta el día del partido
export function isSurveyActive(match, today = todayISO()) {
  if (!match) return false;
  return today >= mondayOf(match.date) && today <= match.date;
}

// partido cuya encuesta RSVP está activa para una categoría, si lo hay
export function surveyMatch({ matches, cat, sub, today = todayISO() }) {
  const m = nextMatch({ matches, cat, sub, today });
  return m && isSurveyActive(m, today) ? m : null;
}

// estadística de RSVP de un partido sobre el plantel de su categoría
export function matchRsvpStats({ players, rsvp, matchId, cat, sub }) {
  const roster = players.filter((p) => p.cat === cat && (sub == null || p.sub === sub));
  const rank = { yes: 0, doubt: 1, no: 2 };
  let yes = 0;
  let no = 0;
  let doubt = 0;

  const list = roster.map((p) => {
    const val = rsvp.find((r) => r.match_id === matchId && r.player_id === p.id)?.answer ?? null;
    if (val === 'yes') yes++;
    else if (val === 'no') no++;
    else if (val === 'doubt') doubt++;
    return { player: p, val };
  });

  list.sort((a, b) => ((rank[a.val] ?? 3) - (rank[b.val] ?? 3)) || a.player.name.localeCompare(b.player.name));

  return { yes, no, doubt, pending: roster.length - yes - no - doubt, total: roster.length, list };
}

// jugador por id
export function playerById(players, id) {
  return players.find((p) => p.id === id) || null;
}

// alineaciones de una categoría cuyo partido todavía no se jugó
export function lineupsForCat({ lineups, matches, cat, today = todayISO() }) {
  return lineups
    .filter((l) => l.cat === cat)
    .filter((l) => {
      const m = matches.find((x) => x.id === l.match_id);
      return m && m.date >= today;
    });
}

// ── Cumpleaños ──────────────────────────────────────────────
export function birthdaysToday({ players, cat, today = todayISO() }) {
  const mmdd = today.slice(5);
  return players.filter((p) => {
    if (cat && p.cat !== cat) return false;
    if (!p.birth_date) return false;
    return p.birth_date.slice(5) === mmdd;
  });
}

export function ageFromBirth(player, today = todayISO()) {
  const year = Number(today.slice(0, 4));
  if (player.birth_date) {
    const y = parseInt(player.birth_date.slice(0, 4), 10);
    if (y) return year - y;
  }
  if (player.birth_year) return year - player.birth_year;
  return null;
}

// ── Rutinas de gimnasio ─────────────────────────────────────

// secciones posibles de un ejercicio dentro de un bloque de rutina
export const ROUTINE_SECTIONS = ['CALENTAMIENTO', 'POTENCIA', 'HIPERTROFIA', 'FÍSICO', 'CONDICIONER', 'FUERZA SUBMÁXIMA', 'FUERZA MÁXIMA', 'FUERZA SUBMÁXIMA REPETIDA'];

// unidades posibles para una marca de gimnasio
export const GYM_UNITS = ['kg', 'reps', 'cm', 'seg', 'm'];

// ejercicios sugeridos para registrar marcas de gimnasio
export const GYM_PRESETS = [
  { name: 'PESO MUERTO', unit: 'kg' },
  { name: 'SENTADILLA', unit: 'kg' },
  { name: 'PRESS BANCA', unit: 'kg' },
  { name: 'DOMINADAS', unit: 'reps' },
  { name: 'BRONCO TEST', unit: 'seg' },
  { name: 'SALTO LARGO', unit: 'cm' },
];

// categorías destino de una rutina (cats: [] vacío o ausente = todas)
export function routineCats(routine) {
  if (Array.isArray(routine.cats) && routine.cats.length) return routine.cats;
  return ['all'];
}

// bloques (días) ya completados de una rutina por un jugador
export function gymBlocksDone(gymChecks, playerId, routineId) {
  const done = {};
  gymChecks.forEach((c) => {
    if (c.player_id !== playerId || c.routine_id !== routineId) return;
    if (c.block == null) done.all = true; else done[c.block] = true;
  });
  return done;
}

// rutinas vigentes para un jugador (de su categoría, con días pendientes)
export function routinesForPlayer({ routines, gymChecks, player }) {
  return routines.filter((r) => {
    const cats = routineCats(r);
    if (!cats.includes('all') && !cats.includes(player.cat)) return false;
    const done = gymBlocksDone(gymChecks, player.id, r.id);
    if (done.all) return false;
    const blocks = Array.isArray(r.blocks) ? r.blocks : [];
    if (!blocks.length) return true;
    for (let i = 0; i < blocks.length; i++) if (!done[i]) return true;
    return false;
  });
}

// días de rutina por semana de un jugador: suma de los bloques (días) de las
// rutinas vigentes para su categoría
export function routineDaysPerWeek(routines, player) {
  return routines
    .filter((r) => {
      const cats = routineCats(r);
      return cats.includes('all') || cats.includes(player.cat);
    })
    .reduce((sum, r) => sum + (Array.isArray(r.blocks) ? r.blocks.length : 0), 0);
}

// asistencia al gimnasio de la semana actual (lunes a hoy): días de rutina
// marcados como hechos sobre el total de días de rutina por semana
export function gymAttendance({ gymChecks, routines, player, today = todayISO() }) {
  const monday = mondayOf(today);
  const total = routineDaysPerWeek(routines, player);
  const present = gymAttDates({ gymChecks, playerId: player.id })
    .filter((d) => d >= monday && d <= today).length;
  return { present, total, rate: total ? Math.min(present / total, 1) : 0 };
}

// asistencia al gimnasio de la semana actual, agregada para un grupo (cat + sub opcional)
export function categoryGymAttendance({ gymChecks, routines, players, cat, sub, today = todayISO() }) {
  const roster = players.filter((p) => p.cat === cat && (sub == null || p.sub === sub));
  let present = 0;
  let total = 0;
  roster.forEach((p) => {
    const g = gymAttendance({ gymChecks, routines, player: p, today });
    present += g.present;
    total += g.total;
  });
  return { present, total, rate: total ? Math.min(present / total, 1) : 0, rosterSize: roster.length };
}

// ── Agenda de fisioterapia (lunes y miércoles, 17:00–20:00 cada 20') ──────
const FISIO_DAYS = [1, 3];
const FISIO_DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const FISIO_MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// 'Lunes 12 jun', para fechas de turnos de fisio
export function fisioDateLabel(iso) {
  const d = new Date(iso + 'T12:00');
  return FISIO_DOW[d.getDay()] + ' ' + d.getDate() + ' ' + FISIO_MONTH_SHORT[d.getMonth()];
}

export function fisioSlotTimes() {
  const out = [];
  for (let h = 17; h < 20; h++) {
    for (let m = 0; m < 60; m += 20) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
}

export function isFisioDay(iso) {
  return FISIO_DAYS.includes(new Date(iso + 'T12:00').getDay());
}

// próximas `n` fechas hábiles de fisio desde `today`
export function fisioUpcomingDates(today = todayISO(), n = 6) {
  const out = [];
  const d = new Date(today + 'T12:00');
  for (let i = 0; i < 120 && out.length < n; i++) {
    const iso = d.toISOString().slice(0, 10);
    if (FISIO_DAYS.includes(d.getDay())) out.push(iso);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function fisioBookingAt(bookings, date, time) {
  return bookings.find((b) => b.date === date && b.time === time && !b.wait) || null;
}

export function fisioWaitlist(bookings, date) {
  return bookings
    .filter((b) => b.date === date && b.wait)
    .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
}

export function fisioForPlayer(bookings, playerId, today = todayISO()) {
  return bookings
    .filter((b) => b.player_id === playerId && b.date >= today)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}

// ── Comunicados ─────────────────────────────────────────────

// Compara un jugador contra un token de categoría dentro de `cats`. El token
// puede ser una categoría simple ('M19') o, para Plantel Superior, una
// combinación categoría:división ('PS:Primera').
export function playerMatchesCatToken(player, token) {
  if (token.includes(':')) {
    const [cat, division] = token.split(':');
    return player.cat === cat && player.division === division;
  }
  return player.cat === token;
}

// 'PS:Primera' -> 'PS · Primera' (para mostrar la audiencia de un comunicado)
export function catTokenLabel(token) {
  return token.includes(':') ? token.replace(':', ' · ') : token;
}

// `message.cats` guarda la audiencia: { type: 'all' | 'player' | 'cat' | 'cats', ... }
export function msgAudienceMatch(message, player) {
  const a = message.cats || { type: 'all' };
  if (a.type === 'all') return true;
  if (a.type === 'player') return a.playerId === player.id;
  if (a.type === 'cat') return a.cat === player.cat && (!a.sub || a.sub === player.sub);
  if (a.type === 'cats') return (a.cats || []).some((t) => playerMatchesCatToken(player, t));
  return false;
}

export function activeMessagesFor({ messages, player, today = todayISO() }) {
  return messages
    .filter((m) => (!m.start_date || today >= m.start_date) && (!m.end_date || today <= m.end_date) && msgAudienceMatch(m, player))
    .sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
}

export function messageStatus(message, today = todayISO()) {
  if (message.start_date && today < message.start_date) return 'programado';
  if (message.end_date && today > message.end_date) return 'finalizado';
  return 'activo';
}

// ── Champa Shop ─────────────────────────────────────────────
export const SHOP_CATEGORIES = ['Equipo de juego', 'Off field', 'Training', 'Otros'];

export function shopCatOf(item) {
  return (item && item.category && SHOP_CATEGORIES.includes(item.category)) ? item.category : 'Otros';
}

export function shopTotalStock(item) {
  return (item.sizes || []).reduce((a, s) => a + (s.stock || 0), 0);
}
