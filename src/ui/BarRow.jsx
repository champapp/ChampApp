import { CC } from './tokens';
import { fmtPct } from './format';

// Barra horizontal con etiqueta y porcentaje, para rankings/comparativas.
export function BarRow({ label, value, color, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 38, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.navy }}>{label}</div>
      <div style={{ flex: 1, height: 22, background: 'rgba(14,58,92,0.07)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: value * 100 + '%', height: '100%', borderRadius: 6,
          background: color || `linear-gradient(90deg, ${CC.navy700}, ${CC.navy})`,
          transition: 'width .6s cubic-bezier(.2,.8,.2,1)',
        }} />
      </div>
      <div style={{ width: 44, textAlign: 'right', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink }}>{fmtPct(value)}</div>
    </div>
  );
}
