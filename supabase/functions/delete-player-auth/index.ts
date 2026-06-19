import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/push.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Elimina el usuario de auth.users y su fila en players.
// Solo admins pueden invocarla.
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

    const { playerId, authUserId } = await req.json();
    if (!playerId) return json({ error: 'faltan parámetros' }, 400);

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Eliminar de auth.users (si tiene cuenta)
    if (authUserId) {
      const { error: authErr } = await adminClient.auth.admin.deleteUser(authUserId);
      if (authErr) {
        console.error('Error eliminando usuario auth:', authErr.message);
        return json({ error: authErr.message }, 500);
      }
      console.log(`Usuario auth eliminado: ${authUserId}`);
    }

    // Eliminar fila de players (y en cascada lo que corresponda)
    const { error: playerErr } = await adminClient.from('players').delete().eq('id', playerId);
    if (playerErr) {
      console.error('Error eliminando jugador:', playerErr.message);
      return json({ error: playerErr.message }, 500);
    }

    console.log(`Jugador ${playerId} eliminado`);
    return json({ ok: true });
  } catch (err) {
    console.error('Error inesperado:', err);
    return json({ error: String(err) }, 500);
  }
});
