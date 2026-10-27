# 🌧️ ClimaEC

PWA gratuita para consultar **pronóstico, lluvia en vivo y estado de El Niño en Ecuador**. Detecta tu ciudad
automáticamente (si no, muestra Guayaquil), funciona en el navegador y se puede instalar en el celular.

> ⚠️ Herramienta informativa, **no oficial**. Ante una emergencia sigue las alertas del
> [INAMHI](https://www.inamhi.gob.ec), la [SNGRE](https://www.gestionderiesgos.gob.ec) y el ECU 911.

## Funciones

- Detección automática de ubicación (con respaldo en Guayaquil) y búsqueda por ciudad o cantón.
- Mapa con **radar de lluvia animado** (RainViewer); toca un punto para ver su pronóstico y dirección.
- Pronóstico por hora y a 16 días, con selección de fecha; lluvia de los últimos 7 días y próximos 16.
- **Semáforo de riesgo** (verde / amarillo / naranja / rojo) según lluvia diaria y horaria.
- Panel **El Niño**: índice ONI de NOAA en vivo, fase, intensidad y qué significa para la Costa.
- **Riesgos**: crecida de ríos (GloFAS), oleaje y nivel del mar en la costa, y sismos recientes (USGS).
- Compartir el pronóstico por WhatsApp o el menú del celular.
- **Modo ahorro de datos** y avisos del navegador cuando el riesgo es alto o muy alto (mientras la app está abierta o instalada).
- Lugares guardados, mochila de emergencia (checklist) y llamada al ECU 911.
- PWA instalable con caché sin conexión, modo claro/oscuro, accesible (contraste, teclado, lectores de pantalla).

## Stack

React 19 · TypeScript · Vite · vite-plugin-pwa (Workbox) · MapLibre GL · Recharts · Vitest · ESLint · Prettier.
Datos: [Open-Meteo](https://open-meteo.com) (pronóstico, ríos, mar y geocodificación), RainViewer (radar), NOAA CPC (ONI), USGS (sismos),
OpenStreetMap/Nominatim (mapa y direcciones). Una función serverless (`api/enso.ts`) evita el bloqueo CORS de NOAA.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint && npm run typecheck && npm test
npm run build && npm run preview
```

> `/api/enso` solo existe en Vercel. En local, el panel El Niño mostrará "no disponible"; usa `npx vercel dev`
> para probarlo completo.

## Estructura

```
api/enso.ts          función serverless (Vercel): descarga y parsea el índice ONI de NOAA
src/lib/             lógica pura y testeada: riesgo, parseo de datos, geocodificación, formato
src/components/      pantallas y gráficos
docs/                plan, hoja de ruta y pendientes
```

## Calibración del riesgo

Los umbrales de `src/lib/risk.ts` (10 / 30 / 60 mm por día; 15 / 30 mm por hora) son una heurística inicial.
Deben calibrarse por zona con datos históricos (p. ej. El Niño 1997-98 y 2023).

## Licencia

MIT
