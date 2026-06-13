import { CC } from '../../ui';
import { playerAttendance, playerHistory, playerStreak, categoryAverages, playerBadges, nextMatch } from '../../lib/domain';

// Métricas derivadas del jugador para la pantalla de Inicio (no es un hook de
// React: es una función pura sobre los datos ya cargados con React Query).
export function computeMyData(player, { players, practices, attendance, matches, rsvp, gymChecks, gymMarks }) {
  const att = playerAttendance({ practices, attendance, matches, rsvp, player });
  const history = playerHistory({ practices, attendance, matches, rsvp, gymChecks, player });
  const streak = playerStreak(history.filter((e) => e.type !== 'gym'));
  const avg = categoryAverages({ practices, attendance, players, gymMarks, cat: player.cat, sub: player.sub });
  const upcomingMatch = nextMatch({ matches, cat: player.cat, sub: player.sub });

  const peso = player.peso != null ? Number(player.peso) : null;
  const talla = player.talla != null ? Number(player.talla) : null;
  const imc = (peso && talla)
    ? Math.round((peso / Math.pow(talla / 100, 2)) * 10) / 10
    : (player.imc != null ? Number(player.imc) : null);
  const imcCat = imc == null ? null : imc < 18.5 ? 'Bajo' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Alto';
  const imcColor = imc != null && imc >= 18.5 && imc < 27 ? CC.good : CC.gold;
  const diff = att.rate - avg.rate;

  const myGymMarks = gymMarks.filter((g) => g.player_id === player.id);
  const gymByExercise = {};
  myGymMarks.forEach((g) => {
    if (!gymByExercise[g.exercise]) gymByExercise[g.exercise] = [];
    gymByExercise[g.exercise].push(g);
  });
  Object.values(gymByExercise).forEach((arr) => arr.sort((a, b) => a.date.localeCompare(b.date)));

  const badges = playerBadges({ attendance: att, streak, categoryAvg: avg, gymMarks: myGymMarks });

  return { att, streak, avg, imc, imcCat, imcColor, diff, gymByExercise, badges, nextMatch: upcomingMatch };
}
