import { describe, expect, it } from 'vitest';
import { isInEcuador } from './geocode';

describe('isInEcuador', () => {
  it('reconoce ciudades de Ecuador', () => {
    expect(isInEcuador(-2.19, -79.89)).toBe(true); // Guayaquil
    expect(isInEcuador(-0.18, -78.47)).toBe(true); // Quito
    expect(isInEcuador(-0.74, -90.31)).toBe(true); // Galápagos
  });
  it('descarta lugares fuera', () => {
    expect(isInEcuador(40.4, -3.7)).toBe(false); // Madrid
    expect(isInEcuador(4.7, -74.0)).toBe(false); // Bogotá
  });
});
