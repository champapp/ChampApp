import { CC } from './tokens';
import { todayISO } from '../lib/domain';

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const fmtPct = (r) => Math.round((r || 0) * 100) + '%';

// `m` viene en formato 'YYYY-MM'
export const monthName = (m) => MONTH_FULL[parseInt(m.slice(5, 7), 10) - 1] || m;

export const fmtDate = (iso) => {
  const [, m, d] = iso.split('-');
  return parseInt(d, 10) + ' ' + (MONTH_SHORT[parseInt(m, 10) - 1] || m);
};

// 'Lunes 12 de junio'
export const matchLongDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return DOW[d.getDay()] + ' ' + d.getDate() + ' de ' + MONTH_FULL[d.getMonth()].toLowerCase();
};

// 'vs Rival' o '@ Rival' según localía
export const matchLabelShort = (m) => (m ? (m.home ? 'vs ' : '@ ') + m.rival : '');

// días entre hoy y `iso` (positivo = en el futuro)
export const daysUntil = (iso, today = todayISO()) => {
  const a = new Date(today + 'T00:00:00');
  const b = new Date(iso + 'T00:00:00');
  return Math.round((b - a) / 86400000);
};

export const rateColor = (r) => (r >= 0.85 ? CC.good : r >= 0.7 ? CC.gold : CC.bad);
