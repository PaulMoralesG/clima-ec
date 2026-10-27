import type { Place } from './types';

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
  country_code?: string;
}

export const DEFAULT_PLACE: Place = {
  id: 'guayaquil',
  name: 'Guayaquil',
  admin: 'Guayas',
  latitude: -2.1962,
  longitude: -79.8862,
};

/** Búsqueda de ciudades/cantones de Ecuador por nombre. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const p = new URLSearchParams({ name: q, count: '10', language: 'es', countryCode: 'EC', format: 'json' });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${p}`, { signal });
  if (!res.ok) throw new Error(`Geocodificación falló (${res.status})`);
  const data = (await res.json()) as { results?: GeoResult[] };
  return (data.results ?? [])
    .filter((r) => r.country_code === 'EC')
    .map((r) => ({
      id: String(r.id),
      name: r.name,
      admin: r.admin1 ?? r.admin2,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
}

interface NominatimReverse {
  display_name?: string;
  address?: Record<string, string>;
}

/** Dirección legible para unas coordenadas (OpenStreetMap / Nominatim). */
export async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<Place> {
  const p = new URLSearchParams({
    lat: lat.toFixed(5),
    lon: lon.toFixed(5),
    format: 'jsonv2',
    zoom: '16',
    'accept-language': 'es',
  });
  const base: Place = {
    id: `${lat.toFixed(3)},${lon.toFixed(3)}`,
    name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
    latitude: lat,
    longitude: lon,
  };
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${p}`, { signal });
    if (!res.ok) return base;
    const data = (await res.json()) as NominatimReverse;
    const a = data.address ?? {};
    const name = a.city || a.town || a.village || a.municipality || a.county || a.suburb || base.name;
    return { ...base, name, admin: a.state, address: data.display_name };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return base;
  }
}

/** Ecuador continental + Galápagos (aprox.). */
export function isInEcuador(lat: number, lon: number): boolean {
  const mainland = lat >= -5.1 && lat <= 1.5 && lon >= -81.2 && lon <= -75.1;
  const galapagos = lat >= -1.6 && lat <= 0.8 && lon >= -92.2 && lon <= -89.2;
  return mainland || galapagos;
}

/**
 * Detecta la ubicación del dispositivo. Si el usuario no da permiso, falla o está
 * fuera de Ecuador, cae a Guayaquil.
 */
export async function detectPlace(signal?: AbortSignal): Promise<{ place: Place; detected: boolean }> {
  if (!('geolocation' in navigator)) return { place: DEFAULT_PLACE, detected: false };
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 10 * 60 * 1000,
      }),
    );
    const { latitude, longitude } = pos.coords;
    if (!isInEcuador(latitude, longitude)) return { place: DEFAULT_PLACE, detected: false };
    return { place: await reverseGeocode(latitude, longitude, signal), detected: true };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return { place: DEFAULT_PLACE, detected: false };
  }
}
