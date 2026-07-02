import { createClient } from 'npm:@supabase/supabase-js@2';
import { resolveAudience, sendPushToSubscriptions } from '../_shared/push.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

function isoDatePlusDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Devuelve el lunes de la semana de una fecha dada (YYYY-MM-DD)
function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay(); // 0=Dom, 1=Lun ... 6=Sáb
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Llamada una vez al dia por pg_cron a las 08:00 Montevideo (11:00 UTC).
// Envía push para:
// 1. Recordatorio RSVP: jugadores que no contestaron la encuesta de un partido activo
// 2. Lunes: recordatorio de partido este fin de semana
// 3. Documentación administrativa que vence en 30 días
// 4. Lesiones cuya fecha de retorno es hoy
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

    const today = isoDatePlusDays(0);
    const todayDow = new Date(today + 'T12:00:00Z').getUTCDay(); // 0=Dom 1=Lun ... 6=Sáb
    const adminSubs = await resolveAudience(supabase, { type: 'admins' });

    let rsvpReminders = 0;
    let mondayAlerts = 0;

    // ── 1. RSVP: recordatorio diario a jugadores que no contestaron ──────────
    // La encuesta de un partido está activa desde el lunes de su semana hasta
    // el día del partido. Buscamos partidos dentro de los próximos 6 días
    // y filtramos en JS con mondayOf(match.date) <= today.
    {
      const weekEnd = isoDatePlusDays(6);
      const { data: activeMatches, error: matchErr } = await supabase
        .from('matches')
        .select('id, cat, date, rival')
        .gte('date', today)
        .lte('date', weekEnd);
      if (matchErr) throw matchErr;

      for (const match of activeMatches ?? []) {
        // Solo si la encuesta ya empezó (lunes de la semana del partido ≤ hoy)
        if (mondayOf(match.date) > today) continue;

        // Jugadores activos de esa categoría
        const { data: catPlayers, error: playersErr } = await supabase
          .from('players')
          .select('id')
          .eq('cat', match.cat)
          .is('deleted_at', null);
        if (playersErr) throw playersErr;

        // Jugadores que ya respondieron (tienen fila en rsvp)
        const { data: answered, error: rsvpErr } = await supabase
          .from('rsvp')
          .select('player_id')
          .eq('match_id', match.id);
        if (rsvpErr) throw rsvpErr;

        const answeredIds = new Set((answered ?? []).map((r) => r.player_id));
        const unansweredIds = (catPlayers ?? [])
          .map((p) => p.id)
          .filter((id) => !answeredIds.has(id));

        if (unansweredIds.length === 0) continue;

        const playerSubs = await resolveAudience(supabase, { type: 'players', playerIds: unansweredIds });
        const dayName = DIAS[new Date(match.date + 'T12:00:00Z').getUTCDay()];
        const rivalTxt = match.rival ? ` vs ${match.rival}` : '';
        await sendPushToSubscriptions(supabase, playerSubs, {
          title: 'Encuesta de disponibilidad',
          body: `¿Vas al partido del ${dayName}? ${match.cat}${rivalTxt} — ${fmtDate(match.date)}. Respondé en la app.`,
          url: '/?tab=home',
        });
        rsvpReminders += unansweredIds.length;
      }
    }

    // ── 2. Lunes: recordatorio de partido este fin de semana ─────────────────
    if (todayDow === 1) {
      const saturday = isoDatePlusDays(5);
      const sunday = isoDatePlusDays(6);

      const { data: weekendMatches, error: wmErr } = await supabase
        .from('matches')
        .select('id, cat, date, rival')
        .in('date', [saturday, sunday]);
      if (wmErr) throw wmErr;

      for (const match of weekendMatches ?? []) {
        const catSubs = await resolveAudience(supabase, { type: 'cats', cats: [match.cat] });
        const dayName = new Date(match.date + 'T12:00:00Z').getUTCDay() === 6 ? 'sábado' : 'domingo';
        const rivalTxt = match.rival ? ` vs ${match.rival}` : '';
        await sendPushToSubscriptions(supabase, catSubs, {
          title: 'Partido este fin de semana',
          body: `${match.cat}${rivalTxt} — ${dayName} ${fmtDate(match.date)}`,
          url: '/?tab=calendar',
        });
        mondayAlerts++;
      }
    }

    // ── 3. Documentación que vence en 30 días ────────────────────────────────
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
        body: `Tu "${doc.type}" vence el ${fmtDate(doc.expiry)}.`,
        url: '/?tab=home',
      });
      await sendPushToSubscriptions(supabase, adminSubs, {
        title: 'Documentación por vencer',
        body: `"${doc.type}" de ${doc.players?.name ?? 'un jugador'} vence el ${fmtDate(doc.expiry)}.`,
        url: `/?tab=players&playerId=${doc.player_id}`,
      });
    }

    // ── 4. Lesiones cuya fecha de retorno es hoy ─────────────────────────────
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

    return new Response(JSON.stringify({
      rsvpReminders,
      mondayAlerts,
      docs: docs?.length ?? 0,
      injuries: injuries?.length ?? 0,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
