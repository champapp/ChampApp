import { useState } from 'react';
import { PlayersListScreen } from './PlayersListScreen';
import { PlayerProfileScreen } from './PlayerProfileScreen';

// Pestaña "Jugadores" del admin: lista del plantel con búsqueda/filtro,
// que abre el perfil de un jugador al tocarlo.
// `initialOpenId` permite abrir directamente el perfil de un jugador (p.ej.
// desde la alarma de inasistencias del header).
export function PlayersScreen({ initialOpenId }) {
  const [openId, setOpenId] = useState(initialOpenId ?? null);

  if (openId != null) {
    return <PlayerProfileScreen playerId={openId} onBack={() => setOpenId(null)} />;
  }
  return <PlayersListScreen onOpenPlayer={setOpenId} />;
}
