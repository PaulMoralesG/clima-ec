import { timingSafeEqual } from 'node:crypto';
import webpush from 'web-push';
import { send, type Req, type Res } from '../_lib/http';
import { runNotifier, type Subscription } from '../_lib/notifier';
import { rest, supabaseConfig } from '../_lib/supabase';
import { fetchForecast } from '../../src/lib/openMeteo';

function authorized(req: Req): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.authorization ?? '';
  if (!secret || !header.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Lo invoca un cron (GitHub Actions) cada hora con `Authorization: Bearer $CRON_SECRET`. */
export default async function handler(req: Req, res: Res): Promise<void> {
  if (!authorized(req)) return send(res, 401, { error: 'No autorizado' });

  const cfg = supabaseConfig();
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!cfg || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return send(res, 503, { error: 'Servicio no configurado' });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  try {
    const subs = await rest<Subscription[]>(cfg, 'push_subscriptions?select=*&limit=5000');
    const summary = await runNotifier(subs, {
      loadForecast: (lat, lon) => fetchForecast(lat, lon),
      send: async (sub, payload) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
            { TTL: 6 * 3600 },
          );
          return 'ok';
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          return status === 404 || status === 410 ? 'gone' : 'error';
        }
      },
      markNotified: (id, key) =>
        rest(cfg, `push_subscriptions?id=eq.${id}`, {
          method: 'PATCH',
          body: { last_notified_key: key },
          prefer: 'return=minimal',
        }),
      remove: (ids) =>
        rest(cfg, `push_subscriptions?id=in.(${ids.join(',')})`, {
          method: 'DELETE',
          prefer: 'return=minimal',
        }),
    });
    send(res, 200, summary);
  } catch {
    send(res, 502, { error: 'Fallo al procesar las suscripciones' });
  }
}
