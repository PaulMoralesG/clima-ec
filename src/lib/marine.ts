import type { RiskLevel } from './types';

export interface MarinePoint {
  time: string;
  waveHeight: number | null; // m
  wavePeriod: number | null; // s
  seaLevel: number | null; // m sobre el nivel medio
}

interface RawMarine {
  hourly: {
    time: string[];
    wave_height: (number | null)[];
    wave_period: (number | null)[];
    sea_level_height_msl: (number | null)[];
  };
}

export function marineUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: 'wave_height,wave_period,sea_level_height_msl',
    forecast_days: '5',
    timezone: 'America/Guayaquil',
  });
  return `https://marine-api.open-meteo.com/v1/marine?${p}`;
}

/** Devuelve [] para puntos tierra adentro (la API no tiene datos de mar). */
export function parseMarine(raw: RawMarine): MarinePoint[] {
  const pts = raw.hourly.time.map((time, i) => ({
    time,
    waveHeight: raw.hourly.wave_height[i] ?? null,
    wavePeriod: raw.hourly.wave_period[i] ?? null,
    seaLevel: raw.hourly.sea_level_height_msl[i] ?? null,
  }));
  return pts.some((p) => p.waveHeight !== null || p.seaLevel !== null) ? pts : [];
}

export function waveLevel(maxWave: number): RiskLevel {
  if (maxWave >= 4) return 'rojo';
  if (maxWave >= 2.5) return 'naranja';
  if (maxWave >= 1.5) return 'amarillo';
  return 'verde';
}

export const maxOf = (values: (number | null)[]): number =>
  values.reduce<number>((m, v) => (v !== null && v > m ? v : m), 0);

export async function fetchMarine(lat: number, lon: number, signal?: AbortSignal): Promise<MarinePoint[]> {
  const res = await fetch(marineUrl(lat, lon), { signal });
  // Para puntos tierra adentro Open-Meteo responde 400: se trata como "sin datos de mar".
  if (res.status === 400) return [];
  if (!res.ok) throw new Error(`Marine API respondió ${res.status}`);
  return parseMarine((await res.json()) as RawMarine);
}
