import { CC } from './tokens';
import { monthName, fmtPct } from './format';

// Gráfico de línea / área (tendencia mensual de asistencia).
// `data` es [{ month: 'YYYY-MM', rate, total }], asume rate entre 0.4 y 1.
export function LineChart({ data, w = 320, h = 130, color = CC.gold }) {
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = 1, min = 0.4;
  const xs = data.map((_, i) => pad.l + (data.length === 1 ? iw / 2 : i / (data.length - 1) * iw));
  const ys = data.map((d) => pad.t + ih * (1 - (d.rate - min) / (max - min)));
  const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${pad.t + ih} L${xs[0].toFixed(1)},${pad.t + ih} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="champArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.5, 0.75, 1].map((g) => {
        const y = pad.t + ih * (1 - (g - min) / (max - min));
        return <line key={g} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke={CC.line} strokeWidth="1" strokeDasharray="3 4" />;
      })}
      <path d={area} fill="url(#champArea)" />
      <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="4.5" fill="#fff" stroke={color} strokeWidth="3" />
          <text x={x} y={h - 6} textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontSize="13" fontWeight="600" fill={CC.muted}>
            {monthName(data[i].month).slice(0, 3)}
          </text>
          <text x={x} y={ys[i] - 11} textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontSize="14" fontWeight="700" fill={CC.navy}>
            {fmtPct(data[i].rate)}
          </text>
        </g>
      ))}
    </svg>
  );
}
