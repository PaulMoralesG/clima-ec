import { isInEcuador } from '../../src/lib/geocode';

export type MinLevel = 'amarillo' | 'naranja' | 'rojo';
export const REPORT_KINDS = ['inundacion', 'deslizamiento', 'via_cerrada', 'otro'] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  latitude: number;
  longitude: number;
  placeName: string | null;
  minLevel: MinLevel;
}

export interface ReportInput {
  kind: ReportKind;
  note: string | null;
  latitude: number;
  longitude: number;
  placeName: string | null;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Solo se aceptan endpoints de los servicios de push de los navegadores. Sin esta lista, cualquiera podría
 * registrar una URL arbitraria y usar el servidor para hacer peticiones a donde quiera (SSRF).
 */
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  '.push.services.mozilla.com',
  '.push.apple.com',
  '.notify.windows.com',
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return (
      u.protocol === 'https:' &&
      PUSH_HOSTS.some((h) => (h.startsWith('.') ? u.hostname.endsWith(h) : u.hostname === h))
    );
  } catch {
    return false;
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const round2 = (n: number): number => Math.round(n * 100) / 100;

// eslint-disable-next-line no-control-regex -- se eliminan caracteres de control del texto libre
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
export const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(CONTROL, '').trim().slice(0, max);
  return s === '' ? null : s;
};

function coords(b: Record<string, unknown>): { latitude: number; longitude: number } | null {
  const { latitude, longitude } = b;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !isInEcuador(latitude, longitude))
    return null;
  // Se redondea a ~1 km: no se guarda la ubicación exacta de nadie.
  return { latitude: round2(latitude), longitude: round2(longitude) };
}

export function validateSubscription(body: unknown): Result<SubscriptionInput> {
  if (!isObject(body)) return { ok: false, error: 'Cuerpo inválido' };
  const sub = isObject(body.subscription) ? body.subscription : null;
  const keys = sub && isObject(sub.keys) ? sub.keys : null;
  const endpoint = sub?.endpoint;
  if (typeof endpoint !== 'string' || endpoint.length > 1000 || !isAllowedPushEndpoint(endpoint)) {
    return { ok: false, error: 'Endpoint de notificaciones no permitido' };
  }
  if (
    typeof keys?.p256dh !== 'string' ||
    typeof keys.auth !== 'string' ||
    keys.p256dh.length > 200 ||
    keys.auth.length > 100
  ) {
    return { ok: false, error: 'Claves de suscripción inválidas' };
  }
  const c = coords(body);
  if (!c) return { ok: false, error: 'Ubicación fuera de Ecuador' };
  const minLevel = body.minLevel ?? 'naranja';
  if (minLevel !== 'amarillo' && minLevel !== 'naranja' && minLevel !== 'rojo')
    return { ok: false, error: 'Nivel inválido' };
  return {
    ok: true,
    value: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ...c,
      placeName: clean(body.placeName, 120),
      minLevel,
    },
  };
}

export function validateReport(body: unknown): Result<ReportInput> {
  if (!isObject(body)) return { ok: false, error: 'Cuerpo inválido' };
  const kind = REPORT_KINDS.find((k) => k === body.kind);
  if (!kind) return { ok: false, error: 'Tipo de reporte inválido' };
  const c = coords(body);
  if (!c) return { ok: false, error: 'Ubicación fuera de Ecuador' };
  return {
    ok: true,
    value: { kind, note: clean(body.note, 280), ...c, placeName: clean(body.placeName, 120) },
  };
}
