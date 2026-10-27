import type { Place, Risk } from './types';

export function shareMessage(place: Place, risk: Risk, rainTodayMm: number, url: string): string {
  return `🌧️ ${place.name}: ${risk.label}. Lluvia prevista hoy: ${rainTodayMm.toFixed(1)} mm.\n${risk.advice}\nMás en ClimaEC: ${url}`;
}

export const whatsappUrl = (text: string): string => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Usa el menú nativo de compartir si existe; si no, abre WhatsApp. */
export async function shareForecast(text: string, url: string): Promise<void> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'ClimaEC', text, url });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
}
