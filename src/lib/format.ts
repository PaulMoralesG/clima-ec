const TZ = 'America/Guayaquil';

export function dayLabel(date: string, today: string): string {
  if (date === today) return 'Hoy';
  const d = new Date(`${date}T12:00:00-05:00`);
  const t = new Date(`${today}T12:00:00-05:00`);
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return d.toLocaleDateString('es-EC', { weekday: 'short', timeZone: TZ });
}

export function longDate(date: string): string {
  return new Date(`${date}T12:00:00-05:00`).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TZ,
  });
}

export const shortDate = (date: string): string =>
  new Date(`${date}T12:00:00-05:00`).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    timeZone: TZ,
  });

export const hourLabel = (iso: string): string => iso.slice(11, 16);

export const mm = (n: number): string => `${n.toFixed(n < 10 ? 1 : 0)} mm`;
