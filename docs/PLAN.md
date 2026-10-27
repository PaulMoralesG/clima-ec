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

- [x] Riesgo de inundación y caudal de ríos (Open-Meteo Flood API).
- [x] Marea y oleaje en la costa (Open-Meteo Marine).
- [x] Sismos recientes (USGS).
- [x] Botón de compartir por WhatsApp / menú nativo.
- [x] Modo ahorro de datos.
- [x] Avisos del navegador por riesgo alto (solo con la app abierta o instalada).
- [x] Notificaciones push en segundo plano (código y base de datos listos; falta configurar claves, ver `docs/FASE2-BACKEND.md`).
- [x] Reportes ciudadanos con moderación (sin fotos todavía).
- [ ] Fotos en los reportes.
- [ ] Volcanes (IGEPN no publica una API estable; evaluar enlaces o scraping).
- [ ] Calibrar umbrales por provincia con datos históricos.
- [ ] Pruebas E2E con Playwright en CI.
- [ ] Empaquetar con Capacitor para Play Store / App Store.
