export interface Quake {
  id: string;
  magnitude: number;
  place: string;
  time: number; // epoch ms
  depthKm: number;
  distanceKm: number;
  url: string;
}

interface RawQuakes {
  features: {
    id: string;
    properties: { mag: number | null; place: string | null; time: number; url: string };
    geometry: { coordinates: [number, number, number] };
  }[];
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function quakesUrl(lat: number, lon: number, now = Date.now()): string {
  const p = new URLSearchParams({
    format: 'geojson',
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    maxradiuskm: '400',
    minmagnitude: '3.5',
    starttime: new Date(now - 7 * 86_400_000).toISOString().slice(0, 10),
    orderby: 'time',
    limit: '20',
  });
  return `https://earthquake.usgs.gov/fdsnws/event/1/query?${p}`;
}

export function parseQuakes(raw: RawQuakes, lat: number, lon: number): Quake[] {
  return raw.features
    .filter((f) => typeof f.properties.mag === 'number')
    .map((f) => ({
      id: f.id,
      magnitude: f.properties.mag as number,
      place: f.properties.place ?? 'Ubicación desconocida',
      time: f.properties.time,
      depthKm: f.geometry.coordinates[2],
      distanceKm: Math.round(haversineKm(lat, lon, f.geometry.coordinates[1], f.geometry.coordinates[0])),
      url: f.properties.url,
    }));
}

export async function fetchQuakes(lat: number, lon: number, signal?: AbortSignal): Promise<Quake[]> {
  const res = await fetch(quakesUrl(lat, lon), { signal });
  if (!res.ok) throw new Error(`USGS respondió ${res.status}`);
  return parseQuakes((await res.json()) as RawQuakes, lat, lon);
}
