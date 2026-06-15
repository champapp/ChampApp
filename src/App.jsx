import { useState } from 'react';
import { CC } from './ui';
import { useAuth } from './features/auth/useAuth';
import { Login } from './features/auth/Login';
import { PinLockScreen } from './features/auth/PinLockScreen';
import { AppShell } from './components/layout/AppShell';
import { getRememberedDevice } from './lib/deviceAuth';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CC.navy900, color: '#fff' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: 0.5 }}>
        Champ<span style={{ color: CC.gold }}>App</span>…
      </div>
    </div>
  );
}

function App() {
  const { session, role, loading } = useAuth();
  const [remembered, setRemembered] = useState(getRememberedDevice);
  const [unlocked, setUnlocked] = useState(() => !getRememberedDevice());

  if (loading) return <LoadingScreen />;
  if (remembered && !unlocked) {
    return (
      <PinLockScreen
        remembered={remembered}
        onUnlock={() => setUnlocked(true)}
        onForgetDevice={() => setRemembered(null)}
      />
    );
  }
  if (!session) return <Login />;
  // Hay sesión pero todavía no sabemos el rol/perfil (instante entre el
  // login y la respuesta de Supabase): esperar antes de mostrar la app, para
  // no renderizar AppShell sin esos datos.
  if (!role) return <LoadingScreen />;
  return <AppShell />;
}

export default App;
