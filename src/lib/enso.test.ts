import { describe, expect, it } from 'vitest';
import { parseOni, strengthOf } from './enso';

const SAMPLE = `SEAS  YR   TOTAL   ANOM
 DJF 2025  26.50 -0.40
 JFM 2025  26.80 -0.30
 AMJ 2026  27.60  0.30
 MJJ 2026  27.90  0.60
 JJA 2026  28.20  1.10
`;

describe('parseOni', () => {
  it('lee el último trimestre y clasifica la fase', () => {
    const s = parseOni(SAMPLE);
    expect(s).toMatchObject({ season: 'JJA', year: 2026, oni: 1.1, phase: 'El Niño', strength: 'moderado' });
    expect(s.recent).toHaveLength(5);
  });

  it('clasifica neutral y La Niña', () => {
    expect(parseOni(' DJF 2020 26 0.1').phase).toBe('Neutral');
    expect(parseOni(' DJF 2020 26 -0.8').phase).toBe('La Niña');
  });

  it('falla con formato desconocido', () => {
    expect(() => parseOni('<html>error</html>')).toThrow();
  });
});

describe('strengthOf', () => {
  it.each([
    [0.2, null],
    [0.7, 'débil'],
    [1.2, 'moderado'],
    [1.7, 'fuerte'],
    [2.3, 'muy fuerte'],
    [-2.1, 'muy fuerte'],
  ])('%s -> %s', (oni, expected) => expect(strengthOf(oni)).toBe(expected));
});
