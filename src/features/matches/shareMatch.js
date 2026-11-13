import { matchLongDate } from '../../ui';
import { matchTimeLabel } from '../../lib/domain';

// Link directo a la convocatoria de un partido: tras iniciar sesión, la app
// abre el Calendario del jugador con la encuesta de ese partido.
export function matchShareUrl(match) {
  return `${window.location.origin}/?tab=calendar&match=${match.id}`;
}

// Resumen de la convocatoria en texto simple para WhatsApp: asistirán / no
// asisten / falta responder, con los nombres en orden alfabético. `list` es
// el de matchRsvpStats ({ player, val }).
export function matchRsvpListText(match, stats) {
  const time = matchTimeLabel(match);
  const names = (val) => stats.list
    .filter((x) => x.val === val)
    .map((x) => x.player.name)
    .sort((a, b) => a.localeCompare(b));
  const section = (icon, title, arr) => (arr.length ? `${icon} *${title} (${arr.length})*\n${arr.map((n) => `• ${n}`).join('\n')}` : null);
  const parts = [
    `🏉 *Convocatoria ${match.cat}* ${match.home ? 'vs' : '@'} ${match.rival}`,
    matchLongDate(match.date) + (time ? ' · ' + time : ''),
    section('✅', 'Asistirán', names('yes')),
    section('❌', 'No asisten', names('no')),
    section('🤔', 'Duda', names('doubt')),
    section('⏳', 'Falta responder', names(null)),
  ];
  return parts.filter(Boolean).join('\n\n');
}

// Mensaje listo para pegar/compartir (WhatsApp, etc.), sin el link.
export function matchShareText(match) {
  const time = matchTimeLabel(match);
  const when = matchLongDate(match.date) + (time ? ' · ' + time : '');
  return `🏉 ${match.cat} ${match.home ? 'vs' : '@'} ${match.rival}\n${when}${match.place ? ' · ' + match.place : ''}\n\nConfirmá la asistencia en ChampApp 👇`;
}
