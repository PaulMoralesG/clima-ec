import type { DailyPoint, HourlyPoint, Risk, RiskLevel } from './types';

/**
 * Umbrales heurísticos (mm). Son un punto de partida y deben calibrarse con
 * datos históricos de cada zona: 50 mm/día no significa lo mismo en Guayaquil que en Quito.
 * Esta herramienta NO sustituye las alertas oficiales del INAMHI / SNGRE.
 */
export const THRESHOLDS = {
  dailyYellow: 10,
  dailyOrange: 30,
  dailyRed: 60,
  hourlyOrange: 15,
  hourlyRed: 30,
} as const;

const COPY: Record<RiskLevel, Omit<Risk, 'level'>> = {
  verde: { label: 'Riesgo bajo', advice: 'Sin lluvias intensas previstas. Sigue atento al pronóstico.' },
  amarillo: {
    label: 'Precaución',
    advice: 'Lluvia moderada. Lleva paraguas y evita quebradas y zonas bajas.',
  },
  naranja: {
    label: 'Riesgo alto',
    advice:
      'Lluvia fuerte. Posibles encharcamientos: evita desplazamientos innecesarios y vigila los comunicados oficiales.',
  },
  rojo: {
    label: 'Riesgo muy alto',
    advice:
      'Lluvia extrema. Riesgo de inundación o deslizamiento: prepara tu mochila de emergencia y sigue las indicaciones del ECU 911 y la SNGRE.',
  },
};

export const RISK_ORDER: RiskLevel[] = ['verde', 'amarillo', 'naranja', 'rojo'];

export function riskFor(dailyMm: number, maxHourlyMm = 0): Risk {
  let level: RiskLevel = 'verde';
  if (dailyMm >= THRESHOLDS.dailyRed || maxHourlyMm >= THRESHOLDS.hourlyRed) level = 'rojo';
  else if (dailyMm >= THRESHOLDS.dailyOrange || maxHourlyMm >= THRESHOLDS.hourlyOrange) level = 'naranja';
  else if (dailyMm >= THRESHOLDS.dailyYellow) level = 'amarillo';
  return { level, ...COPY[level] };
}

/** Riesgo de un día concreto usando también el máximo horario de ese día. */
export function riskForDay(day: DailyPoint, hourly: HourlyPoint[]): Risk {
  const maxHour = hourly
    .filter((h) => h.time.startsWith(day.date))
    .reduce((m, h) => Math.max(m, h.precipitation), 0);
  return riskFor(day.precipitationSum, maxHour);
}

/** Peor riesgo de los próximos `days` días (hoy incluido). */
export function worstRisk(
  daily: DailyPoint[],
  hourly: HourlyPoint[],
  today: string,
  days = 3,
): { risk: Risk; date: string } {
  const upcoming = daily.filter((d) => d.date >= today).slice(0, days);
  let best = { risk: riskFor(0), date: today };
  for (const d of upcoming) {
    const r = riskForDay(d, hourly);
    if (RISK_ORDER.indexOf(r.level) > RISK_ORDER.indexOf(best.risk.level)) best = { risk: r, date: d.date };
  }
  return best;
}

export function sum(values: number[]): number {
  return Math.round(values.reduce((a, b) => a + b, 0) * 10) / 10;
}
