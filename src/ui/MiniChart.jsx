import { CC } from './tokens';

// Gráfico de línea SVG minimalista para series temporales.
// data: [{date: 'YYYY-MM-DD', value: number}]
export function MiniChart({ data, unit = '', color = CC.navy, height = 72, lowerIsBetter = false }) {
  if (!data || data.length < 2) return null;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const vals = sorted.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const W = 280;
  const H = height;
  const PX = 6;
  const PY = 8;

  const pts = sorted.map((d, i) => ({
    x: PX + (i / (sorted.length - 1)) * (W - PX * 2),
    y: PY + (1 - (d.value - min) / range) * (H - PY * 2),
    ...d,
  }));

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const best = lowerIsBetter
    ? pts.reduce((m, p) => (p.value < m.value ? p : m), pts[0])
    : pts.reduce((m, p) => (p.value > m.value ? p : m), pts[0]);
  const last = pts[pts.length - 1];

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        {/* area fill */}
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={`${path} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`}
          fill={`url(#grad-${color.replace('#', '')})`}
        />
        {/* line */}
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p === best || p === last ? 4 : 2.5} fill={p === best ? '#F9B233' : color} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      {/* min/max labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: CC.faint }}>{sorted[0].date.slice(0, 7)}</span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: CC.navy, fontWeight: 700 }}>
          {last.value} <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 400, color: CC.muted }}>{unit}</span>
        </span>
        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: CC.faint }}>{sorted[sorted.length - 1].date.slice(0, 7)}</span>
      </div>
    </div>
  );
}
