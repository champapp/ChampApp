import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, resolveAudience, sendPushToSubscriptions } from '../_shared/push.ts';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Se llama al cancelar/liberar un turno de fisio con hora asignada (no un
// turno de lista de espera). Si hay alguien anotado en la lista de espera de
// esa fecha, le avisa por push que se liberó un lugar, con un link directo a
// Sanidad para tomarlo.
//
// Cualquier usuario autenticado puede invocarla (un jugador cancelando su
// propio turno, o un admin liberándolo) — a diferencia de send-push, no
// requiere ser admin, porque su efecto está acotado: solo puede avisarle a
// la primera persona en la lista de espera real de una fecha puntual, nunca
// mandar un mensaje arbitrario a una audiencia elegida por quien la llama.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'no autenticado' }, 401);

    const { date, time } = await req.json();
    if (!date) return json({ error: 'falta date' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: waitlist, error: wErr } = await supabase
      .from('fisio_bookings')
      .select('id, player_id')
      .eq('date', date)
      .eq('wait', true)
      .order('created_at', { ascending: true })
      .limit(1);
    if (wErr) throw wErr;

    const next = waitlist?.[0];
    if (!next || next.player_id == null) return json({ notified: false });

    const subs = await resolveAudience(supabase, { type: 'players', playerIds: [next.player_id] });
    const dayName = DOW[new Date(date + 'T12:00:00Z').getUTCDay()];
    await sendPushToSubscriptions(supabase, subs, {
      title: 'Se liberó un turno de fisio',
      body: `Hay un lugar libre el ${dayName} ${fmtDate(date)}${time ? ' a las ' + time : ''}. Entrá a la app para tomarlo.`,
      url: '/?tab=health',
    });

    return json({ notified: true, playerId: next.player_id });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
