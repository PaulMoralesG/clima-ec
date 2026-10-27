import { RISK_ORDER, worstRisk } from '../../src/lib/risk';
import type { Forecast, RiskLevel } from '../../src/lib/types';

export interface Subscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  latitude: number;
  longitude: number;
  place_name: string | null;
  min_level: RiskLevel;
  last_notified_key: string | null;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export interface NotifierDeps {
  loadForecast: (lat: number, lon: number) => Promise<Forecast>;
  send: (sub: Subscription, payload: PushPayload) => Promise<'ok' | 'gone' | 'error'>;
  markNotified: (id: string, key: string) => Promise<void>;
  remove: (ids: string[]) => Promise<void>;
}

export interface NotifierSummary {
  checked: number;
  sent: number;
  removed: number;
  errors: number;
}

/**
 * Revisa cada suscripción y envía un aviso solo si el peor riesgo de los próximos 3 días alcanza el nivel
 * elegido y es distinto al último aviso enviado (misma fecha y nivel no se repite). Los pronósticos se
 * comparten entre suscripciones de la misma zona (~1 km).
 */
export async function runNotifier(subs: Subscription[], deps: NotifierDeps): Promise<NotifierSummary> {
  const summary: NotifierSummary = { checked: subs.length, sent: 0, removed: 0, errors: 0 };
  const gone: string[] = [];
  const forecasts = new Map<string, Promise<Forecast | null>>();

  const forecastFor = (lat: number, lon: number) => {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    let p = forecasts.get(key);
    if (!p) {
      p = deps.loadForecast(lat, lon).catch(() => null);
      forecasts.set(key, p);
    }
    return p;
  };

  for (const sub of subs) {
    const f = await forecastFor(sub.latitude, sub.longitude);
    if (!f) {
      summary.errors++;
      continue;
    }
    const today = f.current.time.slice(0, 10);
    const { risk, date } = worstRisk(f.daily, f.hourly, today, 3);
    if (RISK_ORDER.indexOf(risk.level) < RISK_ORDER.indexOf(sub.min_level)) continue;
    const key = `${date}|${risk.level}`;
    if (key === sub.last_notified_key) continue;

    const name = sub.place_name ?? 'tu zona';
    const result = await deps.send(sub, {
      title: `ClimaEC · ${name}: ${risk.label}`,
      body: risk.advice,
      url: '/',
    });
    if (result === 'ok') {
      summary.sent++;
      await deps.markNotified(sub.id, key).catch(() => summary.errors++);
    } else if (result === 'gone') {
      gone.push(sub.id);
    } else {
      summary.errors++;
    }
  }

  if (gone.length > 0) {
    await deps.remove(gone).catch(() => summary.errors++);
    summary.removed = gone.length;
  }
  return summary;
}
