import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/push.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Actualiza el email en auth.users cuando el admin cambia el username.
// Usa auth_user_id (UUID estable) para encontrar al usuario directamente,
// sin depender de que el email actual coincida con el username actual.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const callerClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdmin, error: adminErr } = await callerClient.rpc('is_admin');
    if (adminErr || !isAdmin) return json({ error: 'forbidden' }, 403);

    const { playerId, newUsername } = await req.json();
    if (!playerId || !newUsername) return json({ error: 'faltan parámetros' }, 400);

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Obtener auth_user_id del jugador (vínculo directo, no depende del email)
    const { data: player, error: playerErr } = await adminClient
      .from('players')
      .select('username, auth_user_id')
      .eq('id', playerId)
      .single();

    console.log(`Player ${playerId}: username="${player?.username}" auth_user_id="${player?.auth_user_id}"`);

    if (playerErr || !player) return json({ error: 'jugador no encontrado' }, 404);
    if (!player.auth_user_id) return json({ error: 'jugador sin auth_user_id — correr SQL de backfill' }, 404);

    const newEmail = `${newUsername}@champapp.local`;

    // Actualizar por UUID directo, sin buscar por email
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(player.auth_user_id, {
      email: newEmail,
      email_confirm: true,
    });

    console.log(`Update auth email to "${newEmail}": ${updateErr ? updateErr.message : 'OK'}`);
    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ ok: true, newEmail });
  } catch (err) {
    console.error('Error inesperado:', err);
    return json({ error: String(err) }, 500);
  }
});
