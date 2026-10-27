# Pendientes para Paul

Lo que no pude hacer solo (permisos o decisiones tuyas). Marca cada punto al terminarlo.

## Bloqueantes para publicar

- [x] Repositorio `clima-ec` creado y código subido.
- [ ] **Desplegar en Vercel**: la integración de esta sesión recibió `403` al crear el proyecto. Entra a
      vercel.com/new, importa `PaulMoralesG/clima-ec` (detecta Vite solo; no hace falta configurar nada) y, si no
      aparece el repo, da acceso a la app de GitHub de Vercel desde Settings > Git. Luego prueba `/api/enso`.
- [ ] Revisar que la CI de GitHub Actions (pestaña Actions) quede en verde.

## Antes de compartirla con otras personas

- [ ] Revisar en un celular real: detección de ubicación, instalación como PWA, radar y mapa.
      (No pude probar con datos reales: la red de la sesión bloquea Open-Meteo/NOAA/RainViewer.
      Todo se verificó en el navegador con respuestas simuladas.)
- [ ] Mapa base: `tile.openstreetmap.org` es solo para uso ligero. Para producción usa un proveedor con clave
      gratuita (MapTiler, Stadia, Protomaps) y ponla en variables de entorno de Vercel.
- [ ] Nominatim (direcciones) exige uso moderado y un `User-Agent`/referer identificable; si crece el tráfico,
      pasa a un proveedor propio o a Open-Meteo/BigDataCloud.
- [ ] Open-Meteo es gratis solo para uso no comercial; si monetizas, contrata su plan.
- [ ] Revisar y aprobar los **umbrales del semáforo** (`src/lib/risk.ts`) con alguien del INAMHI o con datos históricos de tu zona.
- [ ] Confirmar teléfonos de emergencia locales (la app incluye ECU 911 y enlaces oficiales).
- [ ] Dominio propio (opcional) y nombre definitivo de la marca ("ClimaEC" es provisional).

## Para activar la fase 2 (alertas push y reportes)

La base de datos ya está creada (proyecto Supabase `clima-ec`, separado de Finanzas). Falta configurar los secretos,
que no puedo ver ni poner yo. Pasos detallados en `docs/FASE2-BACKEND.md`:

- [ ] Generar las claves VAPID (`npx web-push generate-vapid-keys`).
- [ ] Copiar la `service_role` key de Supabase (Project Settings > API) a las variables de Vercel. **Nunca** al repositorio.
- [ ] Cargar las variables en Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_*`, `CRON_SECRET`, `REPORT_SALT`, `VITE_VAPID_PUBLIC_KEY`) y redesplegar.
- [ ] Crear los secretos `APP_URL` y `CRON_SECRET` en GitHub Actions para el aviso horario.
- [ ] Probar en un celular real: activar "Alertas con la app cerrada" y lanzar el workflow "Alertas push" a mano.
- [ ] Moderar los reportes que lleguen (Supabase > Table Editor > `reports` > `status`).
- [ ] Antes de abrir los reportes al público: política de privacidad (guardamos zona aproximada y un hash de IP).

## Más adelante

- [ ] Para las tiendas: cuenta de Google Play (pago único) y Apple Developer (anual).
