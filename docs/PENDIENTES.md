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

## Para la fase 2

- [ ] Decidir si usamos tu proyecto de Supabase existente ("Finanzas") u otro nuevo para alertas push
      (crear uno nuevo puede tener costo). No toqué tu proyecto actual.
- [ ] Para las tiendas: cuenta de Google Play (pago único) y Apple Developer (anual).
- [ ] Política de privacidad (obligatoria en tiendas y si guardas ubicaciones o envías notificaciones).
