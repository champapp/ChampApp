import { useState } from 'react';
import { Icon } from '../../ui';
import { inputStyle, labelStyle } from './authStyles';

export function PinField({ value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>PIN</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          inputMode="numeric"
          maxLength={4}
          style={{ ...inputStyle, paddingRight: 44 }}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'rgba(255,255,255,0.55)', padding: 8, display: 'flex',
          }}
          aria-label={show ? 'Ocultar' : 'Mostrar'}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={19} />
        </button>
      </div>
    </div>
  );
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return (
    <div style={{
      background: 'rgba(224,82,78,0.15)', border: '1px solid rgba(224,82,78,0.4)',
      borderRadius: 10, padding: '10px 12px', marginBottom: 14,
      fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: '#FFD7D5',
    }}>
      {children}
    </div>
  );
}
