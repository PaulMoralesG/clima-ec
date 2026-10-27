import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from './push';
import { hoursAgo } from './reports';

describe('urlBase64ToUint8Array', () => {
  it('decodifica base64url con y sin relleno', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3]);
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255]);
  });
});

describe('hoursAgo', () => {
  const now = Date.UTC(2026, 9, 27, 12, 0, 0);
  it('formatea la antigüedad de un reporte', () => {
    expect(hoursAgo('2026-10-27T11:50:00Z', now)).toBe('hace menos de 1 h');
    expect(hoursAgo('2026-10-27T09:00:00Z', now)).toBe('hace 3 h');
    expect(hoursAgo('2026-10-27T13:00:00Z', now)).toBe('hace menos de 1 h');
  });
});
