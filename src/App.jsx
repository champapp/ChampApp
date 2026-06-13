import { CC } from './ui';
import { useAuth } from './features/auth/useAuth';
import { Login } from './features/auth/Login';
import { AppShell } from './components/layout/AppShell';

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
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Login />;
  return <AppShell />;
}

export default App;
