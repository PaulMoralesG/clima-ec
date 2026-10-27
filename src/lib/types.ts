export interface Place {
  id: string;
  name: string;
  admin?: string; // provincia / región
  address?: string; // dirección legible (geocodificación inversa)
  latitude: number;
  longitude: number;
}

export interface HourlyPoint {
  time: string; // ISO local (America/Guayaquil)
  precipitation: number; // mm
  probability: number | null; // %
  temperature: number; // °C
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  precipitationSum: number; // mm
  probabilityMax: number | null; // %
  tempMax: number;
  tempMin: number;
  windMax: number; // km/h
  uvMax: number | null;
  weatherCode: number;
  isPast: boolean;
}

export interface CurrentWeather {
  temperature: number;
  apparent: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface Forecast {
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  fetchedAt: number;
}

export type RiskLevel = 'verde' | 'amarillo' | 'naranja' | 'rojo';

export interface Risk {
  level: RiskLevel;
  label: string;
  advice: string;
}

export interface EnsoStatus {
  season: string; // p. ej. "JAS"
  year: number;
  oni: number;
  phase: 'El Niño' | 'La Niña' | 'Neutral';
  strength: 'débil' | 'moderado' | 'fuerte' | 'muy fuerte' | null;
  recent: { label: string; oni: number }[];
}
