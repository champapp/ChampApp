import { useState, useEffect } from 'react';
import { CC, Icon } from '../../ui';
import { useAuth } from './useAuth';
import { supabase } from '../../lib/supabaseClient';
import { inputStyle, labelStyle, submitBtn } from './authStyles';
import { PinField, ErrorMsg } from './authUi';

function roleBtn(primary) {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
    background: primary ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
    border: `1.5px solid ${primary ? 'rgba(249,178,51,0.5)' : 'rgba(255,255,255,0.16)'}`,
    borderRadius: 18, padding: '14px 16px', color: '#fff', backdropFilter: 'blur(6px)',
  };
}

const backBtn = {
  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none',
  background: 'transparent', color: 'rgba(255,255,255,0.7)', padding: '6px 0', marginBottom: 14,
  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
};

// Login con usuario + PIN de 4 dígitos. Sirve tanto para administradores
// como para jugadores: el rol se determina del lado del servidor según
// las credenciales, no según el botón que se haya elegido en la pantalla anterior.
function CredentialsForm({ onBack, usernamePlaceholder }) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [usernames, setUsernames] = useState([]);

  useEffect(() => {
    supabase.from('players').select('username').then(({ data }) => {
      if (data) setUsernames(data.map((p) => p.username).filter(Boolean).sort());
    });
  }, []);

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
          placeholder={usernamePlaceholder} style={inputStyle} autoCapitalize="none"
          autoComplete="off" list="champ-usernames" required
        />
        <datalist id="champ-usernames">
          {usernames.map((u) => <option key={u} value={u} />)}
        </datalist>
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
