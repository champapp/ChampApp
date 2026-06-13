import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, resolveAudience, sendPushToSubscriptions } from '../_shared/push.ts';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Manda push a una audiencia. Solo admins pueden invocarla (se valida con el
// JWT del usuario que llama). Disparada desde useUpsertMessage/Match/Lineup
// con {audience, title, body, url}.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: isAdmin, error: adminErr } = await callerClient.rpc('is_admin');
    if (adminErr || !isAdmin) return json({ error: 'forbidden' }, 403);

    const { audience, title, body, url } = await req.json();
    if (!title) return json({ error: 'falta title' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const subs = await resolveAudience(supabase, audience);
    await sendPushToSubscriptions(supabase, subs, { title, body, url });

    return json({ sent: subs.length });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
