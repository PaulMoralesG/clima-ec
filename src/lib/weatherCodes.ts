// Códigos WMO usados por Open-Meteo.
export function describeWeather(code: number): { text: string; emoji: string } {
  if (code === 0) return { text: 'Despejado', emoji: '☀️' };
  if (code <= 2) return { text: 'Parcialmente nublado', emoji: '⛅' };
  if (code === 3) return { text: 'Nublado', emoji: '☁️' };
  if (code === 45 || code === 48) return { text: 'Neblina', emoji: '🌫️' };
  if (code >= 51 && code <= 57) return { text: 'Llovizna', emoji: '🌦️' };
  if (code >= 61 && code <= 67) return { text: 'Lluvia', emoji: '🌧️' };
  if (code >= 80 && code <= 82) return { text: 'Aguacero', emoji: '🌧️' };
  if (code >= 95) return { text: 'Tormenta eléctrica', emoji: '⛈️' };
  return { text: 'Variable', emoji: '🌤️' };
}
