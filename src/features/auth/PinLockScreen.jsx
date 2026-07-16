import { useState, useEffect } from 'react';
import { CC, Avatar } from '../../ui';
import { useAuth } from './useAuth';
import { submitBtn } from './authStyles';
import { PinField, ErrorMsg } from './authUi';
import { NextMatchStrip } from './NextMatchStrip';
import {
  isBiometricAvailable,
  hasBiometricCredential,
  registerBiometric,
  verifyBiometric,
  clearBiometricCredential,
} from '../../lib/biometricAuth';

function FaceIdIcon({ size = 28, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M4 9V5a1 1 0 011-1h4"         stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M19 4h4a1 1 0 011 1v4"        stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 19v4a1 1 0 01-1 1h-4"     stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 24H5a1 1 0 01-1-1v-4"      stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="10.5" cy="12" r="1.5" fill={color}/>
      <circle cx="17.5" cy="12" r="1.5" fill={color}/>
      <path d="M14 13.5v2"                    stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10.5 18.5c0 0 1.5 1.5 3.5 1.5s3.5-1.5 3.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// Pantalla de "candado": el dispositivo ya recuerda quién es esta persona
// (nombre/foto), solo hace falta el PIN para volver a entrar. La sesión de
// Supabase sigue viva detrás de este candado; "entrar" simplemente
// re-valida el PIN contra Supabase.
export function PinLockScreen({ remembered, onUnlock, onForgetDevice }) {
  const { signIn, signOut } = useAuth();
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  // biometría
  const [bioAvail, setBioAvail]   = useState(false);
  const [hasCred, setHasCred]     = useState(false);
  const [showPin, setShowPin]     = useState(false);   // fallback: mostrar PIN en lugar de Face ID
  const [bioPending, setBioPending] = useState(false);
  const [bioError, setBioError]   = useState('');
  const [offerBio, setOfferBio]   = useState(false);  // tras PIN ok, ofrecer activar biometría

  useEffect(() => {
    isBiometricAvailable().then((avail) => {
      setBioAvail(avail);
      if (avail) setHasCred(hasBiometricCredential(remembered.username));
    });
  }, [remembered.username]);

  // --- biometría ---

  const tryBiometric = async () => {
    setBioError('');
    setBioPending(true);
    try {
      await verifyBiometric(remembered.username);
      onUnlock();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setBioError('Face ID cancelado.');
      } else {
        // Credencial inválida o expirada — la limpiamos y mostramos PIN
        clearBiometricCredential(remembered.username);
        setHasCred(false);
        setShowPin(true);
        setBioError('Face ID no disponible. Ingresá tu PIN.');
      }
    } finally {
      setBioPending(false);
    }
  };

  const activateBiometric = async () => {
    try {
      await registerBiometric(remembered.username);
    } catch {
      // cancelado o no disponible — entrar igual sin biometría
    }
    onUnlock();
  };

  // --- PIN ---

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pin.length !== 4) { setError('El PIN tiene 4 dígitos.'); return; }
    setSubmitting(true);
    try {
      await signIn(remembered.username, pin);
      // Si el dispositivo soporta biometría y todavía no está registrada, ofrecemos activarla
      if (bioAvail && !hasCred) {
        setOfferBio(true);
      } else {
        onUnlock();
      }
    } catch {
      setError('PIN incorrecto.');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  // --- olvidar dispositivo ---

  const forgetDevice = async () => {
    clearBiometricCredential(remembered.username);
    await signOut();
    onForgetDevice();
  };

  // --- estilos reutilizados ---

  const linkBtn = {
    display: 'block', margin: '14px auto 0', border: 'none', background: 'transparent',
    color: 'rgba(255,255,255,0.55)', fontFamily: 'Barlow, sans-serif', fontSize: 13,
    textDecoration: 'underline', cursor: 'pointer',
  };

  const showBioUI = hasCred && !showPin;

  const subtitle = offerBio ? '¡Listo!' : showBioUI ? 'Verificá tu identidad' : 'Ingresá tu PIN';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: CC.navy900 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/assets/somos-champa.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(7,36,61,0.35) 0%, rgba(7,36,61,0.55) 42%, rgba(7,36,61,0.92) 78%, ${CC.navy900} 100%)` }} />

      {/* Avatar + nombre */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center', padding: '40px 26px 0' }}>
        <Avatar name={remembered.name} photo={remembered.photo_url} size={88} ring={CC.gold} />
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: '#fff', marginTop: 14 }}>
          {remembered.name}
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: 4 }}>
          {subtitle}
        </div>
      </div>

      {/* Panel inferior */}
      <div style={{ position: 'relative', padding: '24px 26px 50px', color: '#fff', maxWidth: 420, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <NextMatchStrip />

        {/* ── Oferta de activar Face ID (tras PIN correcto) ── */}
        {offerBio && (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <FaceIdIcon size={52} color={CC.gold} />
            <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', margin: '14px 0 6px' }}>
              ¿Activar Face ID / Huella?
            </p>
            <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 22px' }}>
              La próxima vez podés entrar sin escribir el PIN.
            </p>
            <button onClick={activateBiometric} style={submitBtn}>
              Activar
            </button>
            <button onClick={onUnlock} style={linkBtn}>
              Ahora no
            </button>
          </div>
        )}

        {/* ── Botón de Face ID ── */}
        {!offerBio && showBioUI && (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <button
              onClick={tryBiometric}
              disabled={bioPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
                background: CC.gold, color: CC.navy900,
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18,
                letterSpacing: 0.5, cursor: bioPending ? 'default' : 'pointer',
                opacity: bioPending ? 0.7 : 1, marginTop: 8,
              }}
            >
              <FaceIdIcon size={22} color={CC.navy900} />
              {bioPending ? 'Verificando…' : 'Desbloquear con Face ID'}
            </button>
            {bioError && (
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#FF6B6B', margin: '8px 0 0' }}>
                {bioError}
              </p>
            )}
            <button type="button" onClick={() => { setShowPin(true); setBioError(''); }} style={linkBtn}>
              Usar PIN en su lugar
            </button>
          </div>
        )}

        {/* ── Formulario de PIN ── */}
        {!offerBio && !showBioUI && (
          <form onSubmit={submit}>
            <PinField value={pin} onChange={setPin} />
            <ErrorMsg>{error}</ErrorMsg>
            <button type="submit" disabled={submitting} style={{ ...submitBtn, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
            {hasCred && (
              <button
                type="button"
                onClick={() => { setShowPin(false); setBioError(''); setPin(''); setError(''); }}
                style={linkBtn}
              >
                Volver a Face ID
              </button>
            )}
          </form>
        )}

        <button type="button" onClick={forgetDevice} style={{ ...linkBtn, marginTop: 20 }}>
          No soy yo / cambiar de usuario
        </button>
      </div>
    </div>
  );
}
