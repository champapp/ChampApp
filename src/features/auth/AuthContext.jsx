import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { usernameToEmail, pinToPassword, emailToUsername } from '../../lib/localAuth';
import { rememberDevice, forgetDevice } from '../../lib/deviceAuth';
import { unsubscribePush } from '../../lib/push';
import { AuthContext } from './auth-context';

// Carga el rol (admin/jugador) y, si es jugador, su fila de `players`.
async function loadProfile(session) {
  if (!session) return { role: null, player: null };

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role, player_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!roleRow) return { role: null, player: null };

  if (roleRow.role === 'player' && roleRow.player_id) {
    const { data: playerRow } = await supabase
      .from('players')
      .select('*')
      .eq('id', roleRow.player_id)
      .maybeSingle();
    return { role: 'player', player: playerRow ?? null };
  }

  return { role: roleRow.role, player: null };
}

// Guarda en este dispositivo quién inició sesión (sin PIN ni tokens), para
// mostrar la pantalla de candado con su nombre/foto la próxima vez que se
// abra la app.
function rememberFromProfile(session, profile) {
  if (!session || !profile.role) return;
  rememberDevice({
    username: emailToUsername(session.user.email),
    name: profile.player ? profile.player.name : 'Administrador',
    photo_url: profile.player ? profile.player.photo_url : null,
    role: profile.role,
  });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      const profile = await loadProfile(data.session);
      if (!active) return;
      setRole(profile.role);
      setPlayer(profile.player);
      setLoading(false);
      rememberFromProfile(data.session, profile);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      const profile = await loadProfile(newSession);
      if (!active) return;
      setRole(profile.role);
      setPlayer(profile.player);
      rememberFromProfile(newSession, profile);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Login único (admin y jugador): usuario + PIN de 4 dígitos.
  const signIn = useCallback(async (username, pin) => {
    const email = usernameToEmail(username.trim().toLowerCase());
    const password = pinToPassword(pin);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await unsubscribePush();
    } catch {
      // el borrado de la suscripción push es best-effort
    }
    forgetDevice();
    await supabase.auth.signOut();
  }, []);

  // Recarga la fila de `players` del usuario actual (ej. tras editar el
  // propio perfil), sin pasar por todo el flujo de auth state change.
  const refreshPlayer = useCallback(async () => {
    const profile = await loadProfile(session);
    setPlayer(profile.player);
  }, [session]);

  const value = { session, role, player, loading, signIn, signOut, refreshPlayer };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
