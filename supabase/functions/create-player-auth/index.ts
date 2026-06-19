import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/push.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Crea un usuario en auth.users para un jugador nuevo.
// Solo admins pueden invocarla. Devuelve el UUID del usuario creado.
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

    const { username, pin } = await req.json();
    if (!username || !pin) return json({ error: 'faltan parámetros' }, 400);
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return json({ error: 'PIN inválido' }, 400);

    const adminClient = createClient(supabaseUrl, serviceKey);

    const email = `${username.trim().toLowerCase()}@champapp.local`;
    const password = `${pin}-champ`;

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      console.error('Error creando usuario auth:', createErr.message);
      return json({ error: createErr.message }, 500);
    }

    console.log(`Usuario creado: ${email} → ${created.user.id}`);
    return json({ ok: true, userId: created.user.id });
  } catch (err) {
    console.error('Error inesperado:', err);
    return json({ error: String(err) }, 500);
  }
});
