import { CC } from '../../ui';

// Tarjeta de un dato físico (peso/talla), con modo edición numérica.
export function PhysCard({ label, unit, value, edit, onChange }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 16, padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 20px rgba(14,34,53,0.05)' }}>
      {edit ? (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
          style={{
            width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.gold}`, borderRadius: 8, padding: '4px 2px',
            textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.ink,
          }}
        />
      ) : (
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.ink, lineHeight: 1 }}>{value ?? '—'}</div>
      )}
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, fontWeight: 600, letterSpacing: 0.4, marginTop: 5 }}>{label} <span style={{ color: CC.faint }}>({unit})</span></div>
    </div>
  );
}
