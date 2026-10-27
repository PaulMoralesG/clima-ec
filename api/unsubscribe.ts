import { allow, send, type Req, type Res } from './_lib/http';
import { rest, supabaseConfig } from './_lib/supabase';
import { isAllowedPushEndpoint } from './_lib/validate';

/** Elimina la suscripción de este dispositivo ("darse de baja"). */
export default async function handler(req: Req, res: Res): Promise<void> {
  if (!allow(req, res, 'POST')) return;
  const cfg = supabaseConfig();
  if (!cfg) return send(res, 503, { error: 'Servicio no configurado' });

  const endpoint = (req.body as { endpoint?: unknown } | undefined)?.endpoint;
  if (typeof endpoint !== 'string' || !isAllowedPushEndpoint(endpoint))
    return send(res, 400, { error: 'Endpoint inválido' });

  try {
    await rest(cfg, `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    send(res, 200, { ok: true });
  } catch {
    send(res, 502, { error: 'No se pudo eliminar la suscripción' });
  }
}
