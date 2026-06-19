// Hooks de React Query para leer datos de Supabase.
// Las tablas del club son de lectura amplia (RLS: cualquier usuario autenticado
// puede hacer SELECT), así que estos hooks no filtran por rol.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { pinToPassword } from './localAuth';
import { sendPush } from './push';

// Convierte la audiencia de un comunicado (message.cats, ver domain.js
// msgAudienceMatch) al formato de audiencia de la Edge Function send-push.
function messageAudienceToPush(cats) {
  const a = cats || { type: 'all' };
  if (a.type === 'player') return { type: 'players', playerIds: [a.playerId] };
  if (a.type === 'cat') return { type: 'cats', cats: [a.cat] };
  if (a.type === 'cats') return { type: 'cats', cats: a.cats || [] };
  return { type: 'all' };
}

async function selectAll(table, columns = '*') {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw error;
  return data ?? [];
}

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase.from('players').select('*').is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Jugadores archivados (baja lógica), para la pestaña "Archivados" del admin.
export function usePlayersArchived() {
  return useQuery({
    queryKey: ['players', 'archived'],
    queryFn: async () => {
      const { data, error } = await supabase.from('players').select('*').not('deleted_at', 'is', null);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePractices() {
  return useQuery({ queryKey: ['practices'], queryFn: () => selectAll('practices') });
}

export function useAttendance() {
  return useQuery({ queryKey: ['attendance'], queryFn: () => selectAll('attendance') });
}

export function useMatches() {
  return useQuery({ queryKey: ['matches'], queryFn: () => selectAll('matches') });
}

export function useRsvp() {
  return useQuery({ queryKey: ['rsvp'], queryFn: () => selectAll('rsvp') });
}

export function useGymChecks() {
  return useQuery({ queryKey: ['gym_checks'], queryFn: () => selectAll('gym_checks') });
}

export function useGymMarks() {
  return useQuery({ queryKey: ['gym_marks'], queryFn: () => selectAll('gym_marks') });
}

export function useRoutines() {
  return useQuery({ queryKey: ['routines'], queryFn: () => selectAll('routines') });
}

export function useLineups() {
  return useQuery({ queryKey: ['lineups'], queryFn: () => selectAll('lineups') });
}

// Lesión activa de un jugador (closed_at IS NULL), si tiene.
export function usePlayerInjury(playerId) {
  return useQuery({
    queryKey: ['injuries', 'active', playerId],
    enabled: playerId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('injuries')
        .select('*')
        .eq('player_id', playerId)
        .is('closed_at', null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

// Lesiones activas (closed_at IS NULL) de todos los jugadores, para mostrar
// el InjuryDot en los listados de roster.
export function useActiveInjuries() {
  return useQuery({
    queryKey: ['injuries', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('injuries').select('*').is('closed_at', null);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Todos los protocolos de recuperación cargados (Sanidad admin + fichas de jugador).
export function useInjuryProtocols() {
  return useQuery({ queryKey: ['injury_protocols'], queryFn: () => selectAll('injury_protocols') });
}

// Todas las lesiones (abiertas y cerradas) de todos los jugadores, para el
// export de "Historial de lesiones".
export function useAllInjuries() {
  return useQuery({ queryKey: ['injuries', 'all'], queryFn: () => selectAll('injuries') });
}

// Crea o actualiza una lesión (admin): sin `id` crea una nueva lesión activa,
// con `id` actualiza diagnóstico/retorno de la existente.
export function useSetInjury() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }) => {
      if (id) {
        const { error } = await supabase.from('injuries').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('injuries').insert(rest).select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['injuries'] }),
  });
}

// Da de alta a un jugador (admin): cierra su lesión activa.
export function useCloseInjury() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('injuries').update({ closed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['injuries'] }),
  });
}

// Agrega un protocolo de recuperación a una lesión (admin).
export function useAddInjuryProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ injuryId, text }) => {
      const { error } = await supabase.from('injury_protocols').insert({ injury_id: injuryId, text, by: 'Fisioterapia' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['injury_protocols'] }),
  });
}

// Elimina un protocolo de recuperación (admin).
export function useDeleteInjuryProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('injury_protocols').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['injury_protocols'] }),
  });
}

// Turnos de fisioterapia (todos), para la agenda admin/jugador.
export function useFisioBookings() {
  return useQuery({ queryKey: ['fisio_bookings'], queryFn: () => selectAll('fisio_bookings') });
}

// Reserva un turno de fisio, o se anota en lista de espera si `wait` es true.
export function useBookFisio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, date, time, reason, wait }) => {
      const { error } = await supabase
        .from('fisio_bookings')
        .insert({ player_id: playerId, date, time: wait ? null : time, reason, wait: !!wait });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fisio_bookings'] }),
  });
}

// Cancela (jugador) o libera (admin) un turno de fisio.
export function useCancelFisio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('fisio_bookings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fisio_bookings'] }),
  });
}

// Actualiza columnas de un jugador (alta de perfil / baja lógica por admin).
export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, oldUsername }) => {
      if (patch.username !== undefined && patch.username !== oldUsername) {
        const { data, error: authErr } = await supabase.functions.invoke('update-player-auth', {
          body: { playerId: id, newUsername: patch.username },
        });
        if (authErr) throw authErr;
        if (data?.error) throw new Error(data.error);
      }
      const { error } = await supabase.from('players').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

// Sube la foto de perfil de un jugador (archivo o cámara) al bucket
// `player-photos` y devuelve su URL pública. Se guarda dentro de una carpeta
// "<player_id>/..." porque las políticas de Storage usan esa carpeta para
// permitir que cada jugador suba/cambie su propia foto.
export function useUploadPlayerPhoto() {
  return useMutation({
    mutationFn: async ({ playerId, file }) => {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${playerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('player-photos').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('player-photos').getPublicUrl(path);
      return data.publicUrl;
    },
  });
}

// Sube una foto al álbum de un jugador (bucket `player-photos`, carpeta `gallery/<id>/`).
export function useUploadGalleryPhoto() {
  return useMutation({
    mutationFn: async ({ playerId, file }) => {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `gallery/${playerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('player-photos').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('player-photos').getPublicUrl(path);
      return data.publicUrl;
    },
  });
}

// Guarda el array de URLs del álbum de fotos de un jugador (admin only).
export function useSavePlayerGallery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, photos }) => {
      const { error } = await supabase
        .from('players')
        .update({ gallery_photos: photos })
        .eq('id', playerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });
}

// PIN de acceso actual de un jugador. La política de `player_pins` solo deja
// leerlo al propio jugador o a un admin (los demás reciben null).
export function usePlayerPin(playerId) {
  return useQuery({
    queryKey: ['player_pin', playerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('player_pins').select('pin').eq('player_id', playerId).maybeSingle();
      if (error) throw error;
      return data?.pin ?? null;
    },
    enabled: !!playerId,
  });
}

// Cambia el PIN de acceso del jugador autenticado: actualiza la contraseña
// real en Supabase Auth y la copia legible en `player_pins`.
export function useChangePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, pin }) => {
      const { error: authError } = await supabase.auth.updateUser({ password: pinToPassword(pin) });
      if (authError) throw authError;
      const { error } = await supabase.from('player_pins').upsert({ player_id: playerId, pin, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['player_pin', vars.playerId] }),
  });
}

// Crea o actualiza un partido (admin).
export function useUpsertMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }) => {
      if (id) {
        const { error } = await supabase.from('matches').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('matches').insert(rest).select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      const rivalTxt = variables.rival ? ` vs ${variables.rival}` : '';
      sendPush({
        audience: { type: 'cats', cats: [variables.cat] },
        title: variables.id ? 'Partido actualizado' : 'Partido nuevo',
        body: `${variables.cat}${rivalTxt} — ${variables.date}`,
        url: '/?tab=calendar',
      });
    },
  });
}

// Elimina un partido (admin) — su RSVP y alineaciones caen en cascada.
export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['rsvp'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });
}

// Marca/cambia la respuesta de RSVP de un jugador para un partido.
// `answer` puede ser 'yes' | 'no' | 'doubt' | null.
export function useSetRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, playerId, answer }) => {
      const { error } = await supabase
        .from('rsvp')
        .upsert({ match_id: matchId, player_id: playerId, answer }, { onConflict: 'match_id,player_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rsvp'] }),
  });
}

// Crea o actualiza una alineación (admin). `positions` es { [dorsal]: playerId }.
export function useUpsertLineup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, cat, matchId, positions }) => {
      const row = { name, cat, match_id: matchId, positions };
      if (id) {
        const { error } = await supabase.from('lineups').update(row).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('lineups').insert(row).select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
      const playerIds = Object.values(variables.positions || {}).filter(Boolean).map(Number);
      sendPush({
        audience: { type: 'players', playerIds },
        title: 'Alineación publicada',
        body: variables.name ? `Ya está la alineación: ${variables.name}` : 'Ya está la alineación del partido.',
        url: '/?tab=home',
      });
    },
  });
}

export function useDeleteLineup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('lineups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lineups'] }),
  });
}

// Guarda una práctica (nueva o existente) y la asistencia tomada.
// `records` es { [playerId]: 'P' | 'A' }.
export function useSaveAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ practiceId, isNew, cat, sub, date, records }) => {
      let id = practiceId;
      if (isNew) {
        const { data, error } = await supabase
          .from('practices')
          .insert({ cat, sub: sub ?? null, date })
          .select('id')
          .single();
        if (error) throw error;
        id = data.id;
      }
      const rows = Object.entries(records).map(([playerId, status]) => ({
        practice_id: id, player_id: Number(playerId), status,
      }));
      const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'practice_id,player_id' });
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practices'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// Elimina una práctica (y su asistencia en cascada) — solo admins.
export function useDeletePractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error: attErr } = await supabase.from('attendance').delete().eq('practice_id', id);
      if (attErr) throw attErr;
      const { error } = await supabase.from('practices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practices'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// Crea o actualiza una rutina de gimnasio (admin).
export function useUpsertRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }) => {
      if (id) {
        const { error } = await supabase.from('routines').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('routines').insert(rest).select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });
}

// Elimina una rutina (admin) — sus checks de gimnasio caen en cascada.
export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['gym_checks'] });
    },
  });
}

// Marca un bloque de rutina como completado hoy (asistencia al gimnasio).
// Máximo 1 check por jugador por día: pisa el del día si ya había uno.
export function useAddGymCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, routineId, block, date }) => {
      const { error } = await supabase
        .from('gym_checks')
        .upsert({ player_id: playerId, routine_id: routineId, block, date }, { onConflict: 'player_id,date' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gym_checks'] }),
  });
}

// Comunicados del club (mensajes del admin a los jugadores).
export function useMessages() {
  return useQuery({ queryKey: ['messages'], queryFn: () => selectAll('messages') });
}

// Crea o actualiza un comunicado (admin).
export function useUpsertMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }) => {
      if (id) {
        const { error } = await supabase.from('messages').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('messages').insert(rest).select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      sendPush({
        audience: messageAudienceToPush(variables.cats),
        title: variables.title,
        body: variables.body,
        url: '/?tab=home',
      });
    },
  });
}

// Elimina un comunicado (admin).
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });
}

// ── Champa Shop ──────────────────────────────────────────────────

// Catálogo de productos de la Champa Shop.
export function useShopItems() {
  return useQuery({
    queryKey: ['shop_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shop_items').select('*').order('sort', { ascending: true }).order('id', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Crea o actualiza un producto (admin).
export function useUpsertShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }) => {
      if (id) {
        const { error } = await supabase.from('shop_items').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('shop_items').insert(rest).select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop_items'] }),
  });
}

// Elimina un producto (admin).
export function useDeleteShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('shop_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop_items'] }),
  });
}

// Intercambia el orden de dos productos (subir/bajar en la grilla).
export function useSwapShopSort() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ a, b }) => {
      const { error: e1 } = await supabase.from('shop_items').update({ sort: b.sort }).eq('id', a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('shop_items').update({ sort: a.sort }).eq('id', b.id);
      if (e2) throw e2;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop_items'] }),
  });
}

// Registra una venta: descuenta stock del talle, suma al contador vendido,
// y guarda la fila en shop_sales para el historial/exportes.
export function useSellShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item, size, qty = 1 }) => {
      const sizes = (item.sizes || []).map((s) => s.size === size ? { ...s, stock: Math.max(0, (s.stock || 0) - qty) } : s);
      const { error } = await supabase.from('shop_items').update({ sizes, sold: (item.sold || 0) + qty }).eq('id', item.id);
      if (error) throw error;
      const { error: error2 } = await supabase.from('shop_sales').insert({ item_id: item.id, size, qty });
      if (error2) throw error2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop_items'] });
      queryClient.invalidateQueries({ queryKey: ['shop_sales'] });
    },
  });
}

// Repone stock de un talle.
export function useRestockShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item, size, qty = 1 }) => {
      const sizes = (item.sizes || []).map((s) => s.size === size ? { ...s, stock: (s.stock || 0) + qty } : s);
      const { error } = await supabase.from('shop_items').update({ sizes }).eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop_items'] }),
  });
}

// Sube una foto de producto (archivo o foto de cámara) al bucket
// `shop-photos` y devuelve su URL pública.
export function useUploadShopPhoto() {
  return useMutation({
    mutationFn: async (file) => {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('shop-photos').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || 'image/jpeg',
      });
      if (error) throw error;
      const { data } = supabase.storage.from('shop-photos').getPublicUrl(path);
      return data.publicUrl;
    },
  });
}

// Guarda las mediciones de gimnasio de un jugador (admin): inserta nuevas,
// actualiza existentes y elimina las quitadas.
export function useSaveGymMarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, inserts = [], updates = [], deleteIds = [] }) => {
      if (deleteIds.length) {
        const { error } = await supabase.from('gym_marks').delete().in('id', deleteIds);
        if (error) throw error;
      }
      for (const { id, ...rest } of updates) {
        const { error } = await supabase.from('gym_marks').update(rest).eq('id', id);
        if (error) throw error;
      }
      if (inserts.length) {
        const rows = inserts.map((r) => ({ ...r, player_id: playerId }));
        const { error } = await supabase.from('gym_marks').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gym_marks'] }),
  });
}

// Documentación administrativa (ficha médica, Rugby Ready, etc) de un jugador.
export function useAdminDocs(playerId) {
  return useQuery({
    queryKey: ['admin_docs', playerId],
    enabled: playerId != null,
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_docs').select('*').eq('player_id', playerId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Crea o actualiza la fecha de vencimiento de un documento. El jugador puede
// editar los propios (RLS) y el admin los de cualquiera.
export function useUpsertAdminDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ player_id, type, expiry }) => {
      const { error } = await supabase.from('admin_docs')
        .upsert({ player_id, type, expiry: expiry || null }, { onConflict: 'player_id,type' });
      if (error) throw error;
    },
    onSuccess: (_, { player_id }) => queryClient.invalidateQueries({ queryKey: ['admin_docs', player_id] }),
  });
}

// ── Marcadores de partido ─────────────────────────────────────

export function useSetMatchScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, score_us, score_them }) => {
      const { error } = await supabase.from('matches').update({ score_us, score_them }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });
}

// ── Canchas de rivales ────────────────────────────────────────

export function useVenues() {
  return useQuery({ queryKey: ['venues'], queryFn: () => selectAll('venues') });
}

export function useUpsertVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, maps_url }) => {
      if (id) {
        const { error } = await supabase.from('venues').update({ name, maps_url }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('venues').insert({ name, maps_url });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venues'] }),
  });
}

// ── Mediciones físicas por jugador ────────────────────────────

export function usePlayerMeasurements(playerId) {
  return useQuery({
    queryKey: ['measurements', playerId],
    enabled: playerId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_measurements').select('*').eq('player_id', playerId).order('date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, player_id, date, peso, talla }) => {
      const imcVal = (peso && talla) ? (Number(peso) / ((Number(talla) / 100) ** 2)).toFixed(1) : null;
      const row = { player_id, date, peso: peso || null, talla: talla || null, imc: imcVal };
      if (id) {
        const { error } = await supabase.from('player_measurements').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('player_measurements').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: (_, { player_id }) => queryClient.invalidateQueries({ queryKey: ['measurements', player_id] }),
  });
}

export function useDeleteMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('player_measurements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { player_id }) => queryClient.invalidateQueries({ queryKey: ['measurements', player_id] }),
  });
}

// ── Encuestas rápidas ─────────────────────────────────────────

export function usePolls() {
  return useQuery({ queryKey: ['polls'], queryFn: () => selectAll('polls') });
}

export function useAllPollVotes() {
  return useQuery({ queryKey: ['poll_votes'], queryFn: () => selectAll('poll_votes') });
}

export function useUpsertPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, question, options, cats }) => {
      if (id) {
        const { error } = await supabase.from('polls').update({ question, options, cats }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('polls').insert({ question, options, cats });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });
}

export function useDeletePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('polls').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['poll_votes'] });
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poll_id, player_id, option_idx }) => {
      const { error } = await supabase.from('poll_votes')
        .upsert({ poll_id, player_id, option_idx }, { onConflict: 'poll_id,player_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poll_votes'] }),
  });
}

// ── Acuse de lectura de comunicados ──────────────────────────

export function useAllMessageReads() {
  return useQuery({
    queryKey: ['message_reads'],
    queryFn: () => selectAll('message_reads'),
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, playerId }) => {
      const { error } = await supabase
        .from('message_reads')
        .upsert({ message_id: messageId, player_id: playerId }, { onConflict: 'message_id,player_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['message_reads'] }),
  });
}

// ── Adjuntos de comunicados ───────────────────────────────────

export function useUploadMessageFile() {
  return useMutation({
    mutationFn: async (file) => {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('message-files').upload(path, file, {
        cacheControl: '3600', contentType: file.type || 'application/octet-stream',
      });
      if (error) throw error;
      const { data } = supabase.storage.from('message-files').getPublicUrl(path);
      return { url: data.publicUrl, name: file.name, type: file.type || 'application/octet-stream' };
    },
  });
}

// ── Reservas Champa Shop ─────────────────────────────────────────────

export function useReservations() {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, shop_items(name, photos)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyReservations(playerId) {
  return useQuery({
    queryKey: ['reservations', 'my', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, shop_items(name, photos)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item, playerId, size, quantity, contactName, contactPhone, paymentMethod, notes }) => {
      // Descontar stock al momento de reservar
      const sizes = (item.sizes || []).map((s) =>
        s.size === size ? { ...s, stock: Math.max(0, (s.stock || 0) - quantity) } : s
      );
      const { error: stockErr } = await supabase.from('shop_items').update({ sizes }).eq('id', item.id);
      if (stockErr) throw stockErr;
      const { error } = await supabase.from('reservations').insert({
        item_id: item.id, player_id: playerId, size, quantity,
        contact_name: contactName, contact_phone: contactPhone,
        payment_method: paymentMethod, notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['shop_items'] });
    },
  });
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

// El stock ya fue descontado al reservar. Al entregar solo cambia el estado
// y suma al contador de vendidos para estadísticas.
export function useDeliverReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reservation, items }) => {
      const item = items.find((it) => it.id === reservation.item_id);
      if (item) {
        const { error: soldErr } = await supabase
          .from('shop_items')
          .update({ sold: (item.sold || 0) + reservation.quantity })
          .eq('id', item.id);
        if (soldErr) throw soldErr;
      }
      const { error } = await supabase.from('reservations').update({ status: 'entregado' }).eq('id', reservation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['shop_items'] });
    },
  });
}

// Cancela una reserva y restaura el stock descontado al momento de reservar.
export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reservation, items }) => {
      const item = items.find((it) => it.id === reservation.item_id);
      if (item) {
        const sizes = (item.sizes || []).map((s) =>
          s.size === reservation.size
            ? { ...s, stock: (s.stock || 0) + reservation.quantity }
            : s
        );
        const { error: stockErr } = await supabase.from('shop_items').update({ sizes }).eq('id', item.id);
        if (stockErr) throw stockErr;
      }
      const { error } = await supabase.from('reservations').update({ status: 'cancelado' }).eq('id', reservation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['shop_items'] });
    },
  });
}

export function useShopConfig() {
  return useQuery({
    queryKey: ['shop_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shop_config').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data || { payment_info: '', pickup_info: '' };
    },
  });
}

export function useUpsertShopConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentInfo, pickupInfo }) => {
      const { error } = await supabase.from('shop_config').upsert(
        { id: 1, payment_info: paymentInfo, pickup_info: pickupInfo },
        { onConflict: 'id' }
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop_config'] }),
  });
}
