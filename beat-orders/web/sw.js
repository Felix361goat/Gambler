// Service worker: offline app shell + notification clicks.
const CACHE = 'beat-orders-v18';
const SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/db.js',
  './js/generator.js',
  './js/cloud.js',
  './js/native.js',
  './js/shop.js',
  './js/customers.js',
  './js/people.js',
  './js/themes.js',
  './js/motivation.js',
  './js/genres.js',
  './js/careers.js',
  './js/inbox.js',
  './js/visualizer.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first for our own files (so updates arrive), cache as fallback.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.postMessage({ type: 'open-order', id: e.notification.data?.orderId });
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});

// Ready for real server push later (Supabase Edge Function + Web Push).
self.addEventListener('push', (e) => {
  let payload = {};
  try { payload = e.data.json(); } catch { payload = { title: 'Neuer Auftrag', body: e.data?.text() }; }
  e.waitUntil(
    self.registration.showNotification(payload.title || 'Neuer Auftrag', {
      body: payload.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      data: payload.data || {},
    })
  );
});
