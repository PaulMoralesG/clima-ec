/* Se importa desde el service worker generado por Workbox (vite.config.ts > workbox.importScripts). */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* payload no JSON: se muestra el aviso genérico */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'ClimaEC', {
      body: data.body || 'Hay una alerta de lluvia en tu zona.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'clima-ec-risk',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow(url);
    }),
  );
});
