import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/push.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Actualiza el email en auth.users cuando el admin cambia el username de un
// jugador. Requiere Service Role Key porque la Admin API de Supabase es la
// única forma fiable de modificar auth.users.email desde código externo.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';

    // Verificar que quien llama es admin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdmin, error: adminErr } = await callerClient.rpc('is_admin');
    if (adminErr || !isAdmin) return json({ error: 'forbidden' }, 403);

    const { playerId, newUsername } = await req.json();
    if (!playerId || !newUsername) return json({ error: 'faltan parámetros' }, 400);

    // Cliente con privilegios de admin
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Obtener el username actual del jugador
    const { data: player, error: playerErr } = await adminClient
      .from('players')
      .select('username')
      .eq('id', playerId)
      .single();
    if (playerErr || !player) return json({ error: 'jugador no encontrado' }, 404);

    const oldUsername = player.username;
    if (!oldUsername || oldUsername === newUsername) return json({ ok: true, changed: false });

    // Buscar el usuario en auth.users por su email actual
    const oldEmail = `${oldUsername}@champapp.local`;
    const newEmail = `${newUsername}@champapp.local`;

    // Paginar hasta encontrar el usuario (perPage 1000 cubre cualquier club razonable)
    const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listErr) return json({ error: listErr.message }, 500);

    const authUser = (userList?.users ?? []).find((u) => u.email === oldEmail);
    if (!authUser) {
      console.error('Usuario auth no encontrado. Email buscado:', oldEmail);
      return json({ error: `usuario auth no encontrado: ${oldEmail}` }, 404);
    }

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(authUser.id, {
      email: newEmail,
    });
    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ ok: true, changed: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
