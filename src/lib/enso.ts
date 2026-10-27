import type { EnsoStatus } from './types';

/** Parsea el archivo de texto ONI de NOAA CPC (columnas: SEAS YR TOTAL ANOM). */
export function parseOni(text: string): EnsoStatus {
  const rows = text
    .split('\n')
    .map((l) => l.trim().split(/\s+/))
    .filter((c) => c.length === 4 && /^[A-Z]{3}$/.test(c[0]) && Number.isFinite(Number(c[3])))
    .map((c) => ({ season: c[0], year: Number(c[1]), oni: Number(c[3]) }));
  if (rows.length === 0) throw new Error('Formato ONI no reconocido');

  const last = rows[rows.length - 1];
  return {
    season: last.season,
    year: last.year,
    oni: last.oni,
    phase: last.oni >= 0.5 ? 'El Niño' : last.oni <= -0.5 ? 'La Niña' : 'Neutral',
    strength: strengthOf(last.oni),
    recent: rows.slice(-12).map((r) => ({ label: `${r.season} ${String(r.year).slice(2)}`, oni: r.oni })),
  };
}

export function strengthOf(oni: number): EnsoStatus['strength'] {
  const a = Math.abs(oni);
  if (a < 0.5) return null;
  if (a < 1) return 'débil';
  if (a < 1.5) return 'moderado';
  if (a < 2) return 'fuerte';
  return 'muy fuerte';
}

export async function fetchEnso(signal?: AbortSignal): Promise<EnsoStatus> {
  const res = await fetch('/api/enso', { signal });
  if (!res.ok) throw new Error(`Estado ENSO no disponible (${res.status})`);
  return (await res.json()) as EnsoStatus;
}
