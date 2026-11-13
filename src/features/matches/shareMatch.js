import { matchLongDate } from '../../ui';
import { matchTimeLabel, PS_DIVS, M17_DIVS } from '../../lib/domain';

// Horario(s) de citación de un partido (PS y M17 la cargan por división), o ''
// si no hay ninguno cargado.
function matchCiteLabel(m) {
  const divs = m.cat === 'PS' ? PS_DIVS : m.cat === 'M17' ? M17_DIVS : null;
  if (divs) {
    const withCite = divs.filter((d) => m[d.citeKey]);
    return withCite.length ? withCite.map((d) => d.label + ' ' + m[d.citeKey]).join(' · ') + ' hs' : '';
  }
  return m.cite ? m.cite + ' hs' : '';
}

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
  const cite = matchCiteLabel(match);
  const names = (val) => stats.list
    .filter((x) => x.val === val)
    .map((x) => x.player.name)
    .sort((a, b) => a.localeCompare(b));
  const section = (icon, title, arr) => (arr.length ? `${icon} *${title} (${arr.length})*\n${arr.map((n) => `• ${n}`).join('\n')}` : null);
  const parts = [
    `🏉 *Convocatoria ${match.cat}* ${match.home ? 'vs' : '@'} ${match.rival}`,
    matchLongDate(match.date) + (time ? ' · ' + time : '') + (cite ? `\nCitación: ${cite}` : ''),
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
