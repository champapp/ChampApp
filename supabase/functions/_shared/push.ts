import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? '';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Manda el payload a cada suscripcion. Si el navegador la dio de baja
// (404/410), borra la fila de push_subscriptions.
export async function sendPushToSubscriptions(supabase, subscriptions, payload) {
  const body = JSON.stringify(payload);

  await Promise.all((subscriptions ?? []).map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
      );
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      } else {
        console.error('push error', sub.endpoint, err?.statusCode, err?.message);
      }
    }
  }));
}

// audience: {type:'all'} | {type:'cats', cats:[...]} | {type:'players', playerIds:[...]} | {type:'admins'}
export async function resolveAudience(supabase, audience) {
  const type = audience?.type;

  if (!type || type === 'all') {
    const { data, error } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth');
    if (error) throw error;
    return data ?? [];
  }

  if (type === 'players') {
    const ids = audience.playerIds ?? [];
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('player_id', ids);
    if (error) throw error;
    return data ?? [];
  }

  if (type === 'cats') {
    const cats = audience.cats ?? [];
    if (!cats.length) return [];
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, players!inner(cat)')
      .in('players.cat', cats);
    if (error) throw error;
    return data ?? [];
  }

  if (type === 'admins') {
    const { data: admins, error: adminsErr } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    if (adminsErr) throw adminsErr;
    const ids = (admins ?? []).map((a) => a.user_id);
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', ids);
    if (error) throw error;
    return data ?? [];
  }

  return [];
}
