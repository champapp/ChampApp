import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from '../features/auth/useAuth';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && !!VAPID_PUBLIC_KEY;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

// 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'
export async function getPushStatus() {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? 'subscribed' : 'unsubscribed';
}

// Pide permiso (si hace falta), suscribe el navegador y guarda la
// suscripcion en push_subscriptions (una fila por endpoint/dispositivo).
export async function subscribePush({ session, player }) {
  if (!isPushSupported()) throw new Error('Este navegador no soporta notificaciones push');
  if (!session) throw new Error('Sesión no disponible');

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permiso de notificaciones denegado');
  }
  if (Notification.permission !== 'granted') throw new Error('Permiso de notificaciones denegado');

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const keys = sub.toJSON().keys;
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: session.user.id,
    player_id: player?.id ?? null,
    endpoint: sub.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  }, { onConflict: 'endpoint' });
  if (error) throw error;

  return sub;
}

// Desuscribe el navegador y borra la fila correspondiente.
export async function unsubscribePush() {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

// Le pide a la Edge Function `send-push` que notifique a una audiencia.
// audience: {type:'all'|'cats'|'players'|'admins', ...}. Best-effort: si
// falla (sin red, función no desplegada, etc.) no rompe la mutación.
export async function sendPush({ audience, title, body, url }) {
  try {
    await supabase.functions.invoke('send-push', { body: { audience, title, body, url } });
  } catch {
    // el envío de push es best-effort
  }
}

// Al iniciar sesion, si el navegador soporta push y el permiso todavia no fue
// decidido o ya fue otorgado, asegura que haya una suscripcion guardada.
// No insiste si el usuario ya rechazo el permiso.
export function useAutoSubscribePush() {
  const { session, player } = useAuth();

  useEffect(() => {
    if (!session) return;
    if (!isPushSupported()) return;
    if (Notification.permission === 'denied') return;

    subscribePush({ session, player }).catch(() => {});
  }, [session, player]);
}
