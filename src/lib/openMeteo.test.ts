import { describe, expect, it } from 'vitest';
import { forecastUrl, parseForecast } from './openMeteo';

const RAW = {
  current: {
    time: '2026-10-27T08:00',
    temperature_2m: 26.1,
    apparent_temperature: 29,
    relative_humidity_2m: 80,
    precipitation: 0.4,
    wind_speed_10m: 9,
    weather_code: 3,
    is_day: 1,
  },
  hourly: {
    time: ['2026-10-27T08:00', '2026-10-27T09:00'],
    precipitation: [0.4, null as unknown as number],
    precipitation_probability: [40, null],
    temperature_2m: [26, 27],
  },
  daily: {
    time: ['2026-10-26', '2026-10-27'],
    precipitation_sum: [3, 12.5],
    precipitation_probability_max: [30, 90],
    temperature_2m_max: [31, 30],
    temperature_2m_min: [22, 23],
    wind_speed_10m_max: [12, 15],
    uv_index_max: [10, null],
    weather_code: [61, 63],
  },
};

describe('parseForecast', () => {
  it('normaliza valores y marca días pasados', () => {
    const f = parseForecast(RAW, 123);
    expect(f.fetchedAt).toBe(123);
    expect(f.current.isDay).toBe(true);
    expect(f.hourly[1].precipitation).toBe(0); // null -> 0
    expect(f.daily.map((d) => d.isPast)).toEqual([true, false]);
    expect(f.daily[1].uvMax).toBeNull();
  });
});

describe('forecastUrl', () => {
  it('usa la zona horaria de Ecuador y 7 días atrás', () => {
    const u = new URL(forecastUrl(-2.1962, -79.8862));
    expect(u.searchParams.get('timezone')).toBe('America/Guayaquil');
    expect(u.searchParams.get('past_days')).toBe('7');
    expect(u.searchParams.get('latitude')).toBe('-2.1962');
  });
});
