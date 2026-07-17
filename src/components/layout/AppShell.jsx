import { lazy, Suspense, useState } from 'react';
import { CC, Icon, Card } from '../../ui';
import { useAuth } from '../../features/auth/useAuth';
import { useRealtimeSync } from '../../lib/useRealtimeSync';
import { useAutoSubscribePush } from '../../lib/push';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { NotificationSettingsSheet } from '../../features/settings/NotificationSettingsSheet';
import { PlayerHome } from '../../features/home/PlayerHome';
import { AttendanceScreen } from '../../features/attendance/AttendanceScreen';
import { CalendarScreen } from '../../features/matches/CalendarScreen';
import { GymScreen } from '../../features/gym/GymScreen';
import { PlayerHealthScreen } from '../../features/health/PlayerHealthScreen';
import { ShopScreen } from '../../features/shop/ShopScreen';

// Pantallas exclusivas de admin: se cargan solo cuando un admin las visita,
// para no incluirlas en el bundle inicial que descarga cada jugador.
const AdminHome = lazy(() => import('../../features/home/AdminHome').then((m) => ({ default: m.AdminHome })));
const PlayersScreen = lazy(() => import('../../features/players/PlayersScreen').then((m) => ({ default: m.PlayersScreen })));
const MatchesScreen = lazy(() => import('../../features/matches/MatchesScreen').then((m) => ({ default: m.MatchesScreen })));
const AdminGymScreen = lazy(() => import('../../features/gym/AdminGymScreen').then((m) => ({ default: m.AdminGymScreen })));
const AdminHealthScreen = lazy(() => import('../../features/health/AdminHealthScreen').then((m) => ({ default: m.AdminHealthScreen })));
const ExportScreen = lazy(() => import('../../features/export/ExportScreen').then((m) => ({ default: m.ExportScreen })));

const ADMIN_SCREENS = {
  home: { title: 'Inicio', icon: 'home' },
  attendance: { title: 'Asistencia', icon: 'attendance' },
  players: { title: 'Jugadores', icon: 'players' },
  matches: { title: 'Partidos', icon: 'whistle' },
  gym: { title: 'Gimnasio', icon: 'weight' },
  health: { title: 'Sanidad', icon: 'medkit' },
  shop: { title: 'Shop', icon: 'bag' },
  export: { title: 'Exportar', icon: 'download' },
};

const PLAYER_SCREENS = {
  home: { title: 'Mi perfil', icon: 'user' },
  attendance: { title: 'Mi asistencia', icon: 'attendance' },
  gym: { title: 'Mi gimnasio', icon: 'weight' },
  health: { title: 'Sanidad', icon: 'medkit' },
  calendar: { title: 'Calendario', icon: 'calendar' },
  shop: { title: 'Shop', icon: 'bag' },
};

// Lee ?tab=&playerId= de la URL (link de una notificación push) y limpia la
// URL para no reaplicar el deep link en navegaciones futuras dentro de la app.
function readDeepLinkFromUrl() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  if (!params.has('tab') && !params.has('playerId')) return {};

  const tab = params.get('tab');
  const playerId = params.get('playerId');
  window.history.replaceState(null, '', window.location.pathname);
  return { tab, playerId: playerId ? Number(playerId) : null };
}

function ScreenLoading() {
  return (
    <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Cargando…
      </div>
    </div>
  );
}

function PlaceholderScreen({ title, icon }) {
  return (
    <div style={{ padding: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ color: CC.gold }}><Icon name={icon} size={24} sw={2.2} /></div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {title}
          </div>
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', color: CC.muted, fontSize: 14 }}>
          Esta pantalla todavía no está construida. Llega en la próxima etapa.
        </div>
      </Card>
    </div>
  );
}

export function AppShell() {
  const { role, player } = useAuth();
  useRealtimeSync();
  useAutoSubscribePush();
  const isAdmin = role === 'admin';
  const screens = isAdmin ? ADMIN_SCREENS : PLAYER_SCREENS;
  const [deepLink] = useState(readDeepLinkFromUrl);
  const [tab, setTab] = useState(() => (deepLink.tab && screens[deepLink.tab] ? deepLink.tab : 'home'));
  const [alertPlayerId, setAlertPlayerId] = useState(deepLink.playerId ?? null);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const screen = screens[tab] ?? screens.home;

  function openPlayerFromAlert(id) {
    setAlertPlayerId(id);
    setTab('players');
  }

  // Cualquier cambio manual de pestaña descarta el jugador pendiente de
  // abrir desde la alarma, para no reabrir su perfil en visitas futuras.
  function handleSetTab(t) {
    setAlertPlayerId(null);
    setTab(t);
  }

  let content;
  if (!isAdmin && tab === 'home') {
    content = <PlayerHome />;
  } else if (isAdmin && tab === 'home') {
    content = <AdminHome onGoToHealth={() => handleSetTab('health')} />;
  } else if (tab === 'attendance') {
    content = <AttendanceScreen />;
  } else if (isAdmin && tab === 'players') {
    content = <PlayersScreen initialOpenId={alertPlayerId} />;
  } else if (isAdmin && tab === 'matches') {
    content = <MatchesScreen />;
  } else if (!isAdmin && tab === 'calendar') {
    content = <CalendarScreen />;
  } else if (!isAdmin && tab === 'gym') {
    content = <GymScreen />;
  } else if (isAdmin && tab === 'gym') {
    content = <AdminGymScreen />;
  } else if (!isAdmin && tab === 'health') {
    content = <PlayerHealthScreen />;
  } else if (isAdmin && tab === 'health') {
    content = <AdminHealthScreen />;
  } else if (tab === 'shop') {
    content = <ShopScreen isAdmin={isAdmin} player={!isAdmin ? player : undefined} />;
  } else if (isAdmin && tab === 'export') {
    content = <ExportScreen />;
  } else {
    content = <PlaceholderScreen title={screen.title} icon={screen.icon} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: CC.paper }}>
      <AppHeader onOpenAlertPlayer={openPlayerFromAlert} onOpenSettings={() => setShowNotifSettings(true)} />
      <div style={{ flex: 1 }}>
        <Suspense fallback={<ScreenLoading />}>{content}</Suspense>
      </div>
      <BottomNav tab={tab} setTab={handleSetTab} isAdmin={isAdmin} />
      {showNotifSettings && <NotificationSettingsSheet onClose={() => setShowNotifSettings(false)} />}
    </div>
  );
}
