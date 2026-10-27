import type { Forecast } from './types';

export const TIMEZONE = 'America/Guayaquil';
const BASE = 'https://api.open-meteo.com/v1/forecast';

interface RawForecast {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    precipitation: number[];
    precipitation_probability: (number | null)[];
    temperature_2m: number[];
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    wind_speed_10m_max: number[];
    uv_index_max: (number | null)[];
    weather_code: number[];
  };
}

export function forecastUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: TIMEZONE,
    past_days: '7',
    forecast_days: '16',
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,is_day',
    hourly: 'precipitation,precipitation_probability,temperature_2m',
    daily:
      'precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,uv_index_max,weather_code',
  });
  return `${BASE}?${p}`;
}

export function parseForecast(raw: RawForecast, now = Date.now()): Forecast {
  const today = raw.current.time.slice(0, 10);
  const num = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
  return {
    fetchedAt: now,
    current: {
      time: raw.current.time,
      temperature: raw.current.temperature_2m,
      apparent: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      precipitation: num(raw.current.precipitation),
      windSpeed: raw.current.wind_speed_10m,
      weatherCode: raw.current.weather_code,
      isDay: raw.current.is_day === 1,
    },
    hourly: raw.hourly.time.map((time, i) => ({
      time,
      precipitation: num(raw.hourly.precipitation[i]),
      probability: raw.hourly.precipitation_probability[i] ?? null,
      temperature: raw.hourly.temperature_2m[i],
    })),
    daily: raw.daily.time.map((date, i) => ({
      date,
      precipitationSum: num(raw.daily.precipitation_sum[i]),
      probabilityMax: raw.daily.precipitation_probability_max[i] ?? null,
      tempMax: raw.daily.temperature_2m_max[i],
      tempMin: raw.daily.temperature_2m_min[i],
      windMax: num(raw.daily.wind_speed_10m_max[i]),
      uvMax: raw.daily.uv_index_max[i] ?? null,
      weatherCode: raw.daily.weather_code[i],
      isPast: date < today,
    })),
  };
}

export async function fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast> {
  const res = await fetch(forecastUrl(lat, lon), { signal });
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
  return parseForecast((await res.json()) as RawForecast);
}
