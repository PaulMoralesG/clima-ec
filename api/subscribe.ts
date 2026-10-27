import { allow, send, type Req, type Res } from './_lib/http';
import { rest, supabaseConfig } from './_lib/supabase';
import { validateSubscription } from './_lib/validate';

/** Guarda (o actualiza) la suscripción push de un dispositivo junto a su zona aproximada. */
export default async function handler(req: Req, res: Res): Promise<void> {
  if (!allow(req, res, 'POST')) return;
  const cfg = supabaseConfig();
  if (!cfg) return send(res, 503, { error: 'Servicio no configurado' });

  const parsed = validateSubscription(req.body);
  if (!parsed.ok) return send(res, 400, { error: parsed.error });
  const v = parsed.value;

  try {
    await rest(cfg, 'push_subscriptions?on_conflict=endpoint', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: {
        endpoint: v.endpoint,
        p256dh: v.p256dh,
        auth: v.auth,
        latitude: v.latitude,
        longitude: v.longitude,
        place_name: v.placeName,
        min_level: v.minLevel,
        last_notified_key: null,
      },
    });
    send(res, 200, { ok: true });
  } catch {
    send(res, 502, { error: 'No se pudo guardar la suscripción' });
  }
}
