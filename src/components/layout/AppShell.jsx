import { useState } from 'react';
import { CC, Icon, Card } from '../../ui';
import { useAuth } from '../../features/auth/useAuth';
import { useRealtimeSync } from '../../lib/useRealtimeSync';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { PlayerHome } from '../../features/home/PlayerHome';
import { AdminHome } from '../../features/home/AdminHome';
import { AttendanceScreen } from '../../features/attendance/AttendanceScreen';
import { PlayersScreen } from '../../features/players/PlayersScreen';
import { MatchesScreen } from '../../features/matches/MatchesScreen';
import { CalendarScreen } from '../../features/matches/CalendarScreen';
import { GymScreen } from '../../features/gym/GymScreen';
import { AdminGymScreen } from '../../features/gym/AdminGymScreen';
import { PlayerHealthScreen } from '../../features/health/PlayerHealthScreen';
import { AdminHealthScreen } from '../../features/health/AdminHealthScreen';
import { ShopScreen } from '../../features/shop/ShopScreen';
import { ExportScreen } from '../../features/export/ExportScreen';

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
  const { role } = useAuth();
  useRealtimeSync();
  const isAdmin = role === 'admin';
  const screens = isAdmin ? ADMIN_SCREENS : PLAYER_SCREENS;
  const [tab, setTab] = useState('home');
  const [alertPlayerId, setAlertPlayerId] = useState(null);
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
    content = <ShopScreen isAdmin={isAdmin} />;
  } else if (isAdmin && tab === 'export') {
    content = <ExportScreen />;
  } else {
    content = <PlaceholderScreen title={screen.title} icon={screen.icon} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: CC.paper }}>
      <AppHeader onOpenAlertPlayer={openPlayerFromAlert} />
      <div style={{ flex: 1 }}>
        {content}
      </div>
      <BottomNav tab={tab} setTab={handleSetTab} isAdmin={isAdmin} />
    </div>
  );
}
