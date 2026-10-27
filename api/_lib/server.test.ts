import { describe, expect, it, vi } from 'vitest';
import { isAllowedPushEndpoint, validateReport, validateSubscription } from './validate';
import { runNotifier, type NotifierDeps, type Subscription } from './notifier';
import { parseForecast } from '../../src/lib/openMeteo';

const GOOD_SUB = {
  subscription: {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) },
  },
  latitude: -2.19623,
  longitude: -79.88621,
  placeName: '  Guayaquil\u0000 ',
};

describe('isAllowedPushEndpoint', () => {
  it.each([
    ['https://fcm.googleapis.com/fcm/send/x', true],
    ['https://updates.push.services.mozilla.com/wpush/v2/x', true],
    ['https://web.push.apple.com/x', true],
    ['https://wns2-par02p.notify.windows.com/?token=x', true],
    ['http://fcm.googleapis.com/x', false],
    ['https://evil.example.com/x', false],
    ['https://fcm.googleapis.com.evil.com/x', false],
    ['https://169.254.169.254/latest', false],
    ['no es url', false],
  ])('%s -> %s', (url, ok) => expect(isAllowedPushEndpoint(url)).toBe(ok));
});

describe('validateSubscription', () => {
  it('acepta, redondea coordenadas y limpia el nombre', () => {
    const r = validateSubscription(GOOD_SUB);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.latitude).toBe(-2.2);
      expect(r.value.longitude).toBe(-79.89);
      expect(r.value.placeName).toBe('Guayaquil');
      expect(r.value.minLevel).toBe('naranja');
    }
  });
  it('rechaza endpoints no permitidos, ubicaciones fuera de Ecuador y niveles raros', () => {
    expect(
      validateSubscription({
        ...GOOD_SUB,
        subscription: { ...GOOD_SUB.subscription, endpoint: 'https://evil.com/x' },
      }).ok,
    ).toBe(false);
    expect(validateSubscription({ ...GOOD_SUB, latitude: 40, longitude: -3 }).ok).toBe(false);
    expect(validateSubscription({ ...GOOD_SUB, minLevel: 'verde' }).ok).toBe(false);
    expect(validateSubscription(null).ok).toBe(false);
    expect(
      validateSubscription({ ...GOOD_SUB, subscription: { endpoint: GOOD_SUB.subscription.endpoint } }).ok,
    ).toBe(false);
  });
});

describe('validateReport', () => {
  it('acepta un reporte válido y recorta la nota', () => {
    const r = validateReport({
      kind: 'inundacion',
      note: 'x'.repeat(500),
      latitude: -2.19,
      longitude: -79.88,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.note).toHaveLength(280);
  });
  it('rechaza tipos desconocidos y puntos fuera de Ecuador', () => {
    expect(validateReport({ kind: 'spam', latitude: -2.19, longitude: -79.88 }).ok).toBe(false);
    expect(validateReport({ kind: 'otro', latitude: 4.7, longitude: -74 }).ok).toBe(false);
  });
});

// --- motor de avisos ---
function forecastWithRain(mm: number) {
  const days = ['2026-10-27', '2026-10-28'];
  return parseForecast(
    {
      current: {
        time: '2026-10-27T08:00',
        temperature_2m: 26,
        apparent_temperature: 28,
        relative_humidity_2m: 80,
        precipitation: 0,
        wind_speed_10m: 5,
        weather_code: 3,
        is_day: 1,
      },
      hourly: {
        time: ['2026-10-28T14:00'],
        precipitation: [mm / 4],
        precipitation_probability: [80],
        temperature_2m: [26],
      },
      daily: {
        time: days,
        precipitation_sum: [1, mm],
        precipitation_probability_max: [20, 90],
        temperature_2m_max: [30, 30],
        temperature_2m_min: [22, 22],
        wind_speed_10m_max: [10, 10],
        uv_index_max: [9, 9],
        weather_code: [3, 65],
      },
    },
    0,
  );
}

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 's1',
  endpoint: 'https://fcm.googleapis.com/x',
  p256dh: 'p',
  auth: 'a',
  latitude: -2.2,
  longitude: -79.89,
  place_name: 'Guayaquil',
  min_level: 'naranja',
  last_notified_key: null,
  ...over,
});

function deps(mm: number, over: Partial<NotifierDeps> = {}): NotifierDeps {
  return {
    loadForecast: vi.fn(async () => forecastWithRain(mm)),
    send: vi.fn(async () => 'ok' as const),
    markNotified: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    ...over,
  };
}

describe('runNotifier', () => {
  it('envía cuando el riesgo alcanza el nivel y lo registra', async () => {
    const d = deps(40);
    const s = await runNotifier([sub()], d);
    expect(s).toMatchObject({ checked: 1, sent: 1, removed: 0, errors: 0 });
    expect(d.send).toHaveBeenCalledOnce();
    expect(d.markNotified).toHaveBeenCalledWith('s1', '2026-10-28|naranja');
  });
  it('no envía si el riesgo es menor al elegido', async () => {
    const d = deps(12);
    expect((await runNotifier([sub()], d)).sent).toBe(0);
    expect(d.send).not.toHaveBeenCalled();
  });
  it('no repite el mismo aviso (misma fecha y nivel)', async () => {
    const d = deps(40);
    expect((await runNotifier([sub({ last_notified_key: '2026-10-28|naranja' })], d)).sent).toBe(0);
  });
  it('vuelve a avisar si el nivel sube', async () => {
    const d = deps(80);
    expect((await runNotifier([sub({ last_notified_key: '2026-10-28|naranja' })], d)).sent).toBe(1);
  });
  it('elimina suscripciones caducadas (410) y cuenta los errores', async () => {
    const d = deps(40, {
      send: vi.fn(async (s: Subscription) => (s.id === 'gone' ? ('gone' as const) : ('error' as const))),
    });
    const s = await runNotifier([sub({ id: 'gone' }), sub({ id: 'bad' })], d);
    expect(d.remove).toHaveBeenCalledWith(['gone']);
    expect(s).toMatchObject({ removed: 1, errors: 1, sent: 0 });
  });
  it('comparte el pronóstico entre suscripciones de la misma zona', async () => {
    const d = deps(40);
    await runNotifier([sub({ id: 'a' }), sub({ id: 'b', latitude: -2.201 })], d);
    expect(d.loadForecast).toHaveBeenCalledTimes(1);
  });
  it('sigue con las demás si falla un pronóstico', async () => {
    const d = deps(40, {
      loadForecast: vi.fn(async (lat: number) => {
        if (lat > 0) throw new Error('x');
        return forecastWithRain(40);
      }),
    });
    const s = await runNotifier([sub({ id: 'a', latitude: 0.5 }), sub({ id: 'b' })], d);
    expect(s).toMatchObject({ sent: 1, errors: 1 });
  });
});
