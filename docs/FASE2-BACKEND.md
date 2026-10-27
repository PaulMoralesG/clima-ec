# Fase 2 pendiente: backend (push y reportes)

Estas dos funciones necesitan una base de datos y secretos que no se pueden crear desde el navegador.
Este documento deja el diseño listo para implementarlo cuando decidas el proyecto de Supabase.

## 1. Notificaciones push en segundo plano

Hoy los avisos solo salen con la app abierta o instalada (`src/lib/notify.ts`). Para avisar con la app cerrada:

1. Generar claves VAPID: `npx web-push generate-vapid-keys`. La pública va en el cliente (`VITE_VAPID_PUBLIC_KEY`);
   la privada solo en variables de entorno del servidor (nunca en el repositorio).
2. Tabla `push_subscriptions` en Supabase:

```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  latitude double precision not null,
  longitude double precision not null,
  place_name text,
  min_level text not null default 'naranja' check (min_level in ('amarillo','naranja','rojo')),
  last_notified_key text,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
-- Sin políticas públicas: solo escribe la función serverless con la clave de servicio.
```

3. Función serverless `api/subscribe.ts` (valida y guarda la suscripción) y un cron de Vercel
   (`vercel.json` -> `crons`, cada hora) que consulta Open-Meteo por suscripción, calcula el riesgo con
   `src/lib/risk.ts` y envía con `web-push` solo si cambió el nivel (`last_notified_key`).
4. En el cliente: `registration.pushManager.subscribe({ applicationServerKey })` tras el permiso del usuario.

Privacidad: se guardan coordenadas aproximadas (redondear a 2 decimales) y se debe ofrecer "darse de baja".

## 2. Reportes ciudadanos ("calle inundada aquí")

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('inundacion','deslizamiento','via_cerrada','otro')),
  note text check (char_length(note) <= 280),
  latitude double precision not null,
  longitude double precision not null,
  photo_path text,
  status text not null default 'pendiente' check (status in ('pendiente','publicado','rechazado')),
  created_at timestamptz not null default now()
);
alter table reports enable row level security;
create policy "leer publicados" on reports for select using (status = 'publicado');
create policy "crear pendientes" on reports for insert with check (status = 'pendiente');
```

Requisitos antes de abrirlo al público: moderación (nadie ve un reporte hasta aprobarlo), límite de tasa por IP,
validación de que el punto esté en Ecuador, fotos en un bucket con tamaño máximo y sin datos EXIF, y aviso de que
los reportes no sustituyen al ECU 911.
