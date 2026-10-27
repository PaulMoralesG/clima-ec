# Plan y hoja de ruta

## Hecho (MVP)

- [x] Proyecto Vite + React + TS, PWA instalable, tema claro/oscuro.
- [x] Detección automática de ciudad + búsqueda + lugares guardados.
- [x] Pronóstico (hora/día), lluvia acumulada, semáforo de riesgo.
- [x] Mapa con radar animado y selección de punto con dirección.
- [x] Panel El Niño (ONI de NOAA vía función serverless).
- [x] Seguridad: ECU 911, mochila de emergencia, enlaces oficiales.
- [x] Tests unitarios, lint, typecheck, CI en GitHub Actions.

## Fase 2

- [ ] Notificaciones push por umbral de lluvia (Supabase + Web Push + cron).
- [ ] Riesgo de inundación y caudal de ríos (Open-Meteo Flood API).
- [ ] Marea y oleaje en la costa (Open-Meteo Marine).
- [ ] Sismos recientes (USGS) y volcanes.
- [ ] Reportes ciudadanos con foto ("calle inundada aquí").
- [ ] Botón de compartir por WhatsApp.
- [ ] Modo bajo consumo de datos.
- [ ] Calibrar umbrales por provincia con datos históricos.
- [ ] Pruebas E2E con Playwright.
- [ ] Empaquetar con Capacitor para Play Store / App Store.
