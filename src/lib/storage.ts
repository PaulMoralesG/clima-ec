import type { Place } from './types';

const KEY = 'clima-ec:saved-places';
const LAST = 'clima-ec:last-place';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado o almacenamiento lleno: la app sigue funcionando sin guardar */
  }
}

export const loadSavedPlaces = (): Place[] => read<Place[]>(KEY, []);
export const saveSavedPlaces = (places: Place[]): void => write(KEY, places);
export const loadLastPlace = (): Place | null => read<Place | null>(LAST, null);
export const saveLastPlace = (place: Place): void => write(LAST, place);

export interface Settings {
  lowData: boolean;
  notify: boolean;
}

const SETTINGS = 'clima-ec:settings';
export const loadSettings = (): Settings => ({
  lowData: false,
  notify: false,
  ...read<Partial<Settings>>(SETTINGS, {}),
});
export const saveSettings = (s: Settings): void => write(SETTINGS, s);
