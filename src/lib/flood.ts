import type { RiskLevel } from './types';

export interface FloodPoint {
  date: string;
  discharge: number; // m³/s
  isPast: boolean;
}

export interface FloodAssessment {
  level: RiskLevel;
  peak: FloodPoint | null;
  baseline: number;
  ratio: number;
}

interface RawFlood {
  daily: { time: string[]; river_discharge: (number | null)[] };
}

export function floodUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    daily: 'river_discharge',
    past_days: '7',
    forecast_days: '16',
    timezone: 'America/Guayaquil',
  });
  return `https://flood-api.open-meteo.com/v1/flood?${p}`;
}

export function parseFlood(raw: RawFlood, today: string): FloodPoint[] {
  return raw.daily.time
    .map((date, i) => ({ date, discharge: raw.daily.river_discharge[i], isPast: date < today }))
    .filter((p): p is FloodPoint => typeof p.discharge === 'number' && Number.isFinite(p.discharge));
}

/**
 * Compara el caudal máximo previsto con el promedio de los últimos días. Es una heurística relativa
 * (no hay umbrales oficiales de desborde por río): sirve para avisar de crecidas bruscas, no de cotas.
 */
export function assessFlood(points: FloodPoint[]): FloodAssessment {
  const past = points.filter((p) => p.isPast);
  const future = points.filter((p) => !p.isPast);
  const baseline = past.length ? past.reduce((s, p) => s + p.discharge, 0) / past.length : 0;
  const peak = future.reduce<FloodPoint | null>(
    (m, p) => (m === null || p.discharge > m.discharge ? p : m),
    null,
  );
  if (!peak || baseline < 1) return { level: 'verde', peak, baseline, ratio: 0 };
  const ratio = peak.discharge / baseline;
  const level: RiskLevel = ratio >= 3 ? 'rojo' : ratio >= 2 ? 'naranja' : ratio >= 1.4 ? 'amarillo' : 'verde';
  return { level, peak, baseline, ratio };
}

export async function fetchFlood(
  lat: number,
  lon: number,
  today: string,
  signal?: AbortSignal,
): Promise<FloodPoint[]> {
  const res = await fetch(floodUrl(lat, lon), { signal });
  if (!res.ok) throw new Error(`Flood API respondió ${res.status}`);
  return parseFlood((await res.json()) as RawFlood, today);
}
