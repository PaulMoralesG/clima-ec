import { describe, expect, it } from 'vitest';
import { assessFlood, floodUrl, parseFlood } from './flood';
import { maxOf, parseMarine, waveLevel } from './marine';
import { haversineKm, parseQuakes, quakesUrl } from './quakes';
import { notifyKey } from './notify';
import { shareMessage, whatsappUrl } from './share';
import { forecastUrl } from './openMeteo';
import { riskFor } from './risk';

const place = { id: 'guayaquil', name: 'Guayaquil', latitude: -2.19, longitude: -79.89 };

describe('flood', () => {
  const raw = {
    daily: {
      time: ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'],
      river_discharge: [100, 100, 100, 250, null],
    },
  };
  it('descarta nulos y marca pasado', () => {
    const pts = parseFlood(raw, '2026-10-27');
    expect(pts).toHaveLength(4);
    expect(pts.map((p) => p.isPast)).toEqual([true, true, false, false]);
  });
  it('compara el pico previsto con el caudal reciente', () => {
    const a = assessFlood(parseFlood(raw, '2026-10-27'));
    expect(a.peak?.date).toBe('2026-10-28');
    expect(a.ratio).toBeCloseTo(2.5);
    expect(a.level).toBe('naranja');
  });
  it('ignora ríos sin caudal significativo', () => {
    const a = assessFlood([
      { date: '2026-10-26', discharge: 0.2, isPast: true },
      { date: '2026-10-28', discharge: 5, isPast: false },
    ]);
    expect(a.level).toBe('verde');
  });
  it('arma la URL con zona horaria', () => {
    expect(new URL(floodUrl(-2.19, -79.89)).searchParams.get('timezone')).toBe('America/Guayaquil');
  });
});

describe('marine', () => {
  it('devuelve vacío si todo es nulo (tierra adentro)', () => {
    const empty = {
      hourly: { time: ['a'], wave_height: [null], wave_period: [null], sea_level_height_msl: [null] },
    };
    expect(parseMarine(empty)).toEqual([]);
  });
  it('parsea y clasifica oleaje', () => {
    const raw = {
      hourly: {
        time: ['a', 'b'],
        wave_height: [1, 3],
        wave_period: [8, 9],
        sea_level_height_msl: [0.1, -0.2],
      },
    };
    const pts = parseMarine(raw);
    expect(maxOf(pts.map((p) => p.waveHeight))).toBe(3);
    expect(waveLevel(3)).toBe('naranja');
    expect(waveLevel(4.2)).toBe('rojo');
    expect(waveLevel(0.8)).toBe('verde');
  });
});

describe('quakes', () => {
  it('calcula distancias', () => {
    expect(haversineKm(-2.19, -79.89, -0.18, -78.47)).toBeGreaterThan(250);
    expect(haversineKm(-2.19, -79.89, -2.19, -79.89)).toBe(0);
  });
  it('parsea GeoJSON de USGS', () => {
    const raw = {
      features: [
        {
          id: 'a',
          properties: { mag: 4.6, place: '10 km N de X', time: 1, url: 'u' },
          geometry: { coordinates: [-79.9, -2.1, 35] as [number, number, number] },
        },
        {
          id: 'b',
          properties: { mag: null, place: null, time: 2, url: 'u' },
          geometry: { coordinates: [0, 0, 0] as [number, number, number] },
        },
      ],
    };
    const q = parseQuakes(raw, -2.19, -79.89);
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ magnitude: 4.6, depthKm: 35 });
    expect(q[0].distanceKm).toBeLessThan(20);
  });
  it('pide los últimos 7 días', () => {
    const u = new URL(quakesUrl(-2.19, -79.89, Date.UTC(2026, 9, 27)));
    expect(u.searchParams.get('starttime')).toBe('2026-10-20');
  });
});

describe('notificaciones y compartir', () => {
  it('solo avisa de naranja o rojo', () => {
    expect(notifyKey(place, riskFor(5), '2026-10-27')).toBeNull();
    expect(notifyKey(place, riskFor(15), '2026-10-27')).toBeNull();
    expect(notifyKey(place, riskFor(35), '2026-10-27')).toBe('guayaquil|2026-10-27|naranja');
    expect(notifyKey(place, riskFor(80), '2026-10-27')).toBe('guayaquil|2026-10-27|rojo');
  });
  it('arma el mensaje y el enlace de WhatsApp', () => {
    const msg = shareMessage(place, riskFor(35), 35.2, 'https://x.app');
    expect(msg).toContain('Guayaquil');
    expect(msg).toContain('35.2 mm');
    expect(whatsappUrl(msg)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
});

describe('modo ahorro de datos', () => {
  it('pide menos días', () => {
    const u = new URL(forecastUrl(-2.19, -79.89, true));
    expect(u.searchParams.get('past_days')).toBe('3');
    expect(u.searchParams.get('forecast_days')).toBe('7');
  });
});
