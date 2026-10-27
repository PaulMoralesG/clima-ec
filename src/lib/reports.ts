export const KIND_LABEL = {
  inundacion: '🌊 Calle o zona inundada',
  deslizamiento: '⛰️ Deslizamiento',
  via_cerrada: '🚧 Vía cerrada',
  otro: '⚠️ Otro',
} as const;

export type ReportKind = keyof typeof KIND_LABEL;

export interface Report {
  id: string;
  kind: ReportKind;
  note: string | null;
  latitude: number;
  longitude: number;
  place_name: string | null;
  created_at: string;
}

export async function fetchReports(lat: number, lon: number, signal?: AbortSignal): Promise<Report[]> {
  const res = await fetch(`/api/reports?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`, { signal });
  if (!res.ok) throw new Error(`Reportes no disponibles (${res.status})`);
  return (await res.json()) as Report[];
}

export async function sendReport(input: {
  kind: ReportKind;
  note: string;
  latitude: number;
  longitude: number;
  placeName: string;
}): Promise<void> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.status === 429) throw new Error('Enviaste varios reportes seguidos. Intenta de nuevo más tarde.');
  if (!res.ok) throw new Error('No se pudo enviar el reporte.');
}

export function hoursAgo(iso: string, now = Date.now()): string {
  const h = Math.max(0, Math.round((now - new Date(iso).getTime()) / 3_600_000));
  return h < 1 ? 'hace menos de 1 h' : `hace ${h} h`;
}
