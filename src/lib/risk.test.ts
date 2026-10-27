import { describe, expect, it } from 'vitest';
import { riskFor, riskForDay, worstRisk } from './risk';
import type { DailyPoint, HourlyPoint } from './types';

const day = (date: string, mm: number): DailyPoint => ({
  date,
  precipitationSum: mm,
  probabilityMax: 80,
  tempMax: 30,
  tempMin: 22,
  windMax: 10,
  uvMax: 9,
  weatherCode: 61,
  isPast: false,
});
const hour = (time: string, precipitation: number): HourlyPoint => ({
  time,
  precipitation,
  probability: 50,
  temperature: 26,
});

describe('riskFor', () => {
  it.each([
    [0, 0, 'verde'],
    [9.9, 0, 'verde'],
    [10, 0, 'amarillo'],
    [30, 0, 'naranja'],
    [60, 0, 'rojo'],
    [5, 16, 'naranja'],
    [5, 30, 'rojo'],
  ])('%s mm/día, %s mm/h -> %s', (d, h, level) => expect(riskFor(d, h).level).toBe(level));
});

describe('riskForDay / worstRisk', () => {
  const hourly = [hour('2026-10-28T14:00', 35), hour('2026-10-29T14:00', 1)];

  it('usa el máximo horario del día', () => {
    expect(riskForDay(day('2026-10-28', 12), hourly).level).toBe('rojo');
    expect(riskForDay(day('2026-10-29', 12), hourly).level).toBe('amarillo');
  });

  it('devuelve el peor día próximo e ignora el pasado', () => {
    const daily = [day('2026-10-26', 90), day('2026-10-27', 2), day('2026-10-28', 12), day('2026-10-29', 40)];
    const w = worstRisk(daily, hourly, '2026-10-27', 3);
    expect(w.risk.level).toBe('rojo');
    expect(w.date).toBe('2026-10-28');
  });
});
