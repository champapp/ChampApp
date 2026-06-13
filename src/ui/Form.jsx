import { CC } from './tokens';

export function Field({ label, children, half }) {
  return (
    <label style={{ display: 'block', flex: half ? 1 : 'none' }}>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 11, padding: '11px 12px', fontFamily: 'Barlow, sans-serif', fontSize: 15, color: CC.ink, background: '#fff' };

export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function SelectInput({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ ...inputStyle, appearance: 'none', backgroundImage: 'none', cursor: 'pointer' }}>
      {children}
    </select>
  );
}
