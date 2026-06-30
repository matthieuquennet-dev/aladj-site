/* =====================================================================
 *  ALADJ — Service Worker (notifications push + pastille d'icône)
 *  À placer dans le dossier  public/  du projet  ->  servi sur /sw.js
 * ===================================================================== */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Réception d'une notification push envoyée par le serveur
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'ALADJ';
  const options = {
    body: data.body || 'Vous avez une nouvelle notification.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'aladj-notif',
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    // met aussi à jour la pastille de l'icône si l'API est dispo
    if (typeof data.count === 'number' && self.navigator && 'setAppBadge' in self.navigator) {
      try {
        if (data.count > 0) await self.navigator.setAppBadge(data.count);
        else if ('clearAppBadge' in self.navigator) await self.navigator.clearAppBadge();
      } catch (e) { /* ignore */ }
    }
  })());
});

// Clic sur la notification : ouvre / met au premier plan le site
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if ('focus' in c) { try { if ('navigate' in c) await c.navigate(url); } catch (e) {} return c.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
