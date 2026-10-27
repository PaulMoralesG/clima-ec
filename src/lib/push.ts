import { notificationsSupported } from './notify';
import type { Place } from './types';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** Las notificaciones en segundo plano solo se ofrecen si el despliegue tiene claves VAPID configuradas. */
export const pushAvailable = (): boolean =>
  Boolean(VAPID_PUBLIC_KEY) && notificationsSupported() && 'PushManager' in window;

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} respondió ${res.status}`);
}

/** Pide permiso, suscribe este dispositivo y registra su zona aproximada en el servidor. */
export async function enablePush(place: Place): Promise<void> {
  if (!pushAvailable() || !VAPID_PUBLIC_KEY) throw new Error('Push no disponible');
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('permiso-denegado');
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await post('/api/subscribe', {
    subscription: sub.toJSON(),
    latitude: place.latitude,
    longitude: place.longitude,
    placeName: place.name,
    minLevel: 'naranja',
  });
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await post('/api/unsubscribe', { endpoint: sub.endpoint }).catch(() => undefined);
  await sub.unsubscribe();
}
