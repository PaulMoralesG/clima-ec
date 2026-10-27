import type { Place, Risk } from './types';
import { RISK_ORDER } from './risk';

const KEY = 'clima-ec:last-notified';

export const notificationsSupported = (): boolean => 'Notification' in window && 'serviceWorker' in navigator;

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  return (await Notification.requestPermission()) === 'granted';
}

/** Solo se avisa de riesgo naranja o rojo, y una vez por lugar, día y nivel. */
export function notifyKey(place: Place, risk: Risk, date: string): string | null {
  return RISK_ORDER.indexOf(risk.level) >= RISK_ORDER.indexOf('naranja')
    ? `${place.id}|${date}|${risk.level}`
    : null;
}

export async function maybeNotify(place: Place, risk: Risk, date: string): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const key = notifyKey(place, risk, date);
  if (key === null) return;
  try {
    if (localStorage.getItem(KEY) === key) return;
    localStorage.setItem(KEY, key);
  } catch {
    /* sin almacenamiento: puede repetir el aviso, pero no falla */
  }
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(`ClimaEC · ${place.name}: ${risk.label}`, {
    body: risk.advice,
    icon: '/icon-192.png',
    tag: 'clima-ec-risk',
  });
}
