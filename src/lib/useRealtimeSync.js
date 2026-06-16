import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';

// Tablas "compartidas" donde un usuario suele ver cambios hechos por otro
// (admin toma asistencia, jugadores responden RSVP, se publica un
// comunicado o una alineación, etc.). Cuando llega un cambio, se invalida
// la query de React Query correspondiente para que se vuelva a pedir.
const REALTIME_TABLES = [
  { table: 'attendance', queryKey: ['attendance'] },
  { table: 'rsvp', queryKey: ['rsvp'] },
  { table: 'messages', queryKey: ['messages'] },
  { table: 'lineups', queryKey: ['lineups'] },
  { table: 'fisio_bookings', queryKey: ['fisio_bookings'] },
  { table: 'matches', queryKey: ['matches'] },
  { table: 'polls', queryKey: ['polls'] },
  { table: 'poll_votes', queryKey: ['poll_votes'] },
];

// Suscribe un canal de Supabase Realtime a las tablas de REALTIME_TABLES
// mientras haya una sesión activa. Se monta una sola vez en AppShell.
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('champ-realtime');
    for (const { table, queryKey } of REALTIME_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        queryClient.invalidateQueries({ queryKey });
      });
    }
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}
