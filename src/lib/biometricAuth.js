// Autenticación biométrica local (Face ID / huella) usando la WebAuthn API.
// Solo gestiona el candado de pantalla — no reemplaza la sesión de Supabase.

const PREFIX = 'champ_biometric_';

function credKey(username) { return PREFIX + username; }

function bufferToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuffer(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

export function hasBiometricCredential(username) {
  try { return !!localStorage.getItem(credKey(username)); } catch { return false; }
}

export function clearBiometricCredential(username) {
  try { localStorage.removeItem(credKey(username)); } catch {}
}

export async function isBiometricAvailable() {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

export async function registerBiometric(username) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(username);

  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'ChampApp' },
      user: { id: userId, name: username, displayName: username },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
    },
  });

  try { localStorage.setItem(credKey(username), bufferToB64(cred.rawId)); } catch {}
}

export async function verifyBiometric(username) {
  const stored = localStorage.getItem(credKey(username));
  if (!stored) throw Object.assign(new Error('no-credential'), { name: 'NoCredential' });

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: 'public-key', id: b64ToBuffer(stored) }],
      userVerification: 'required',
      timeout: 60000,
    },
  });
}
