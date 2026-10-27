# Backend de la fase 2 (alertas push y reportes)

Implementado sobre un proyecto de Supabase **propio de ClimaEC** (`clima-ec`, región us-east-1), separado de
cualquier otro proyecto. El navegador nunca habla con Supabase: todo pasa por funciones serverless de Vercel
que usan la clave de servicio.

```
navegador ──> /api/subscribe | /api/unsubscribe | /api/reports ──> Supabase (RLS activado, sin acceso público)
GitHub Actions (cada hora) ──> /api/cron/notify ──> Open-Meteo ──> web-push ──> dispositivos
```

## Tablas (migración `create_push_and_reports`)

- `push_subscriptions`: endpoint, claves, **coordenadas redondeadas a ~1 km**, nivel mínimo (`naranja` por defecto) y
  `last_notified_key` (evita repetir el mismo aviso: fecha + nivel).
- `reports`: tipo, nota (≤280), coordenadas, `status` (`pendiente` / `publicado` / `rechazado`) y `ip_hash`.

Ambas tienen RLS activado **sin políticas** y sin permisos para `anon`/`authenticated`. Es intencional: el aviso
INFO "RLS enabled, no policy" del linter es lo esperado.

## Funciones (`api/`)

| Ruta                       | Qué hace                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/subscribe`      | Valida y guarda la suscripción. Solo acepta endpoints de FCM, Mozilla, Apple y Windows (evita SSRF) y puntos dentro de Ecuador.     |
| `POST /api/unsubscribe`    | Da de baja el dispositivo.                                                                                                          |
| `GET /api/reports?lat&lon` | Reportes **publicados** de las últimas 48 h en ~33 km.                                                                              |
| `POST /api/reports`        | Crea un reporte `pendiente` (máx. 5 por hora por IP, que se guarda con hash).                                                       |
| `GET /api/cron/notify`     | Exige `Authorization: Bearer $CRON_SECRET`. Calcula el riesgo por zona y envía los avisos. Borra suscripciones caducadas (404/410). |

La lógica está en `api/_lib/` (validación y `runNotifier`) y tiene pruebas unitarias con dependencias simuladas.

## Puesta en marcha (lo hace el dueño del proyecto)

1. **Claves VAPID**: `npx web-push generate-vapid-keys`.
2. **Variables en Vercel** (Settings > Environment Variables, entorno Production) y luego **Redeploy**:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API > `service_role`, **secreta**),
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:tu-correo`), `CRON_SECRET` (texto aleatorio largo),
   `REPORT_SALT` (otro texto aleatorio) y `VITE_VAPID_PUBLIC_KEY` (la misma clave pública; el cliente la lee al compilar).
3. **Secretos en GitHub** (Settings > Secrets and variables > Actions): `APP_URL` (URL de producción) y el mismo `CRON_SECRET`.
   El workflow `notify.yml` llama al endpoint cada hora. GitHub lo pausa si el repo pasa 60 días sin actividad.
4. **Moderar reportes**: Supabase > Table Editor > `reports` > cambia `status` a `publicado` (o `rechazado`).

## Pendiente de esta parte

- Fotos en los reportes (requiere un bucket de Storage con límite de tamaño y limpieza de EXIF).
- Panel de moderación propio (hoy se modera desde el Table Editor).
- Poner un `Retry`/métricas al cron si el volumen crece (hoy procesa hasta 5000 suscripciones por ejecución).
