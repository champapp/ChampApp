import { useState } from 'react';
import { CC, Avatar } from '../../ui';
import { useAuth } from './useAuth';
import { submitBtn } from './authStyles';
import { PinField, ErrorMsg } from './authUi';
import { NextMatchStrip } from './NextMatchStrip';

// Pantalla de "candado": el dispositivo ya recuerda quién es esta persona
// (nombre/foto), solo hace falta el PIN para volver a entrar. La sesión de
// Supabase sigue viva detrás de este candado; "entrar" simplemente
// re-valida el PIN contra Supabase.
export function PinLockScreen({ remembered, onUnlock, onForgetDevice }) {
  const { signIn, signOut } = useAuth();
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
      await signIn(remembered.username, pin);
      onUnlock();
    } catch {
      setError('PIN incorrecto.');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const forgetDevice = async () => {
    await signOut();
    onForgetDevice();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: CC.navy900 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/assets/somos-champa.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(7,36,61,0.35) 0%, rgba(7,36,61,0.55) 42%, rgba(7,36,61,0.92) 78%, ${CC.navy900} 100%)` }} />

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center', padding: '40px 26px 0' }}>
        <Avatar name={remembered.name} photo={remembered.photo_url} size={88} ring={CC.gold} />
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: '#fff', marginTop: 14 }}>
          {remembered.name}
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: 4 }}>
          Ingresá tu PIN
        </div>
      </div>

      <div style={{ position: 'relative', padding: '24px 26px 50px', color: '#fff', maxWidth: 420, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <NextMatchStrip />
        <form onSubmit={submit}>
          <PinField value={pin} onChange={setPin} />
          <ErrorMsg>{error}</ErrorMsg>
          <button type="submit" disabled={submitting} style={{ ...submitBtn, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <button
          type="button"
          onClick={forgetDevice}
          style={{
            display: 'block', margin: '16px auto 0', border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.55)', fontFamily: 'Barlow, sans-serif', fontSize: 13,
            textDecoration: 'underline', cursor: 'pointer',
          }}
        >
          No soy yo / cambiar de usuario
        </button>
      </div>
    </div>
  );
}
