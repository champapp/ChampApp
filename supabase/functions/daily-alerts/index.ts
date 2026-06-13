import { createClient } from 'npm:@supabase/supabase-js@2';
import { resolveAudience, sendPushToSubscriptions } from '../_shared/push.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

function isoDatePlusDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Llamada una vez al dia por pg_cron (ver schema.sql). Avisa:
// - documentacion administrativa que vence en 30 dias (al jugador y al admin)
// - lesiones cuya fecha de retorno es hoy (al admin)
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const adminSubs = await resolveAudience(supabase, { type: 'admins' });

    // Documentacion que vence en 30 dias
    const expiry = isoDatePlusDays(30);
    const { data: docs, error: docsErr } = await supabase
      .from('admin_docs')
      .select('player_id, type, expiry, players(name)')
      .eq('expiry', expiry);
    if (docsErr) throw docsErr;

    for (const doc of docs ?? []) {
      const playerSubs = await resolveAudience(supabase, { type: 'players', playerIds: [doc.player_id] });
      await sendPushToSubscriptions(supabase, playerSubs, {
        title: 'Documentación por vencer',
        body: `Tu "${doc.type}" vence el ${doc.expiry}.`,
        url: '/?tab=home',
      });
      await sendPushToSubscriptions(supabase, adminSubs, {
        title: 'Documentación por vencer',
        body: `"${doc.type}" de ${doc.players?.name ?? 'un jugador'} vence el ${doc.expiry}.`,
        url: `/?tab=players&playerId=${doc.player_id}`,
      });
    }

    // Lesiones cuya fecha de retorno es hoy y siguen activas
    const today = isoDatePlusDays(0);
    const { data: injuries, error: injuriesErr } = await supabase
      .from('injuries')
      .select('player_id, return_date, players(name)')
      .eq('return_date', today)
      .is('closed_at', null);
    if (injuriesErr) throw injuriesErr;

    for (const inj of injuries ?? []) {
      await sendPushToSubscriptions(supabase, adminSubs, {
        title: 'Alta médica',
        body: `${inj.players?.name ?? 'Un jugador'} cumple hoy su fecha de retorno.`,
        url: `/?tab=players&playerId=${inj.player_id}`,
      });
    }

    return new Response(JSON.stringify({ docs: docs?.length ?? 0, injuries: injuries?.length ?? 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
