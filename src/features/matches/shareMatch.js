import { matchLongDate } from '../../ui';
import { matchTimeLabel } from '../../lib/domain';

// Link directo a la convocatoria de un partido: tras iniciar sesión, la app
// abre el Calendario del jugador con la encuesta de ese partido.
export function matchShareUrl(match) {
  return `${window.location.origin}/?tab=calendar&match=${match.id}`;
}

// Mensaje listo para pegar/compartir (WhatsApp, etc.), sin el link.
export function matchShareText(match) {
  const time = matchTimeLabel(match);
  const when = matchLongDate(match.date) + (time ? ' · ' + time : '');
  return `🏉 ${match.cat} ${match.home ? 'vs' : '@'} ${match.rival}\n${when}${match.place ? ' · ' + match.place : ''}\n\nConfirmá la asistencia en ChampApp 👇`;
}
