import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { useAuth } from './useAuth';

function roleBtn(primary) {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
    background: primary ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
    border: `1.5px solid ${primary ? 'rgba(249,178,51,0.5)' : 'rgba(255,255,255,0.16)'}`,
    borderRadius: 18, padding: '14px 16px', color: '#fff', backdropFilter: 'blur(6px)',
  };
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', border: '1.5px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px',
  color: '#fff', fontFamily: 'Barlow, sans-serif', fontSize: 16,
};

const labelStyle = {
  fontFamily: 'Barlow, sans-serif', fontSize: 12.5, letterSpacing: 0.5,
  color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 600,
  marginBottom: 6, display: 'block',
};

const submitBtn = {
  width: '100%', cursor: 'pointer', border: 'none', borderRadius: 12,
  background: CC.gold, color: CC.navy900, padding: '13px 16px',
  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.4,
};

const backBtn = {
  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none',
  background: 'transparent', color: 'rgba(255,255,255,0.7)', padding: '6px 0', marginBottom: 14,
  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
};

function PinField({ value, onChange }) {
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

function ErrorMsg({ children }) {
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

// Login con usuario + PIN de 4 dígitos. Sirve tanto para administradores
// como para jugadores: el rol se determina del lado del servidor según
// las credenciales, no según el botón que se haya elegido en la pantalla anterior.
function CredentialsForm({ onBack, usernamePlaceholder }) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pin.length !== 4) {
      setError('El PIN tiene 4 dígitos.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(username, pin);
    } catch {
      setError('Usuario o PIN incorrectos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <button type="button" onClick={onBack} style={backBtn}>
        <Icon name="back" size={16} /> Volver
      </button>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Usuario</label>
        <input
          type="text" value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder={usernamePlaceholder} style={inputStyle} autoCapitalize="none" autoComplete="username" required
        />
      </div>
      <PinField value={pin} onChange={setPin} />
      <ErrorMsg>{error}</ErrorMsg>
      <button type="submit" disabled={submitting} style={{ ...submitBtn, opacity: submitting ? 0.7 : 1 }}>
        {submitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}

export function Login() {
  const [step, setStep] = useState('pick');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: CC.navy900 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/assets/somos-champa.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(7,36,61,0.35) 0%, rgba(7,36,61,0.55) 42%, rgba(7,36,61,0.92) 78%, ${CC.navy900} 100%)` }} />

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center', padding: '40px 26px 0' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 44, letterSpacing: 1, lineHeight: 1, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.5)' }}>
          Champ<span style={{ color: CC.gold }}>App</span>
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, letterSpacing: 2.5, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', marginTop: 7, fontWeight: 600 }}>
          Champagnat Club · Rugby
        </div>
      </div>

      <div style={{ position: 'relative', padding: '24px 26px 50px', color: '#fff', maxWidth: 420, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {step === 'pick' && (
          <>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, letterSpacing: 0.5, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
              Ingresá como
            </div>
            <button onClick={() => setStep('admin')} style={roleBtn(true)}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: CC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="shield" size={24} color={CC.navy900} sw={2.2} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, letterSpacing: 0.4 }}>Administrador</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Cargar asistencia, perfiles y mediciones</div>
              </div>
              <Icon name="chevron" size={20} color="rgba(255,255,255,0.5)" />
            </button>
            <div style={{ height: 12 }} />
            <button onClick={() => setStep('player')} style={roleBtn(false)}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="user" size={23} color="#fff" sw={2.2} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, letterSpacing: 0.4 }}>Jugador</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Tu usuario y PIN de 4 dígitos</div>
              </div>
              <Icon name="chevron" size={20} color="rgba(255,255,255,0.5)" />
            </button>
          </>
        )}
        {step === 'admin' && <CredentialsForm onBack={() => setStep('pick')} usernamePlaceholder="ej: c.champagnat" />}
        {step === 'player' && <CredentialsForm onBack={() => setStep('pick')} usernamePlaceholder="ej: b.incerti" />}
      </div>
    </div>
  );
}
