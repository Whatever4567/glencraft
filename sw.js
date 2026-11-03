// Glencraft service worker: always fetch the newest game page first, use the saved copy only when offline
const V = new URL(self.location).searchParams.get('v') || '0';
const C = 'glencraft-page-' + V;
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('glencraft-page-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const page = r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname) || u.pathname.endsWith('version.json');
  if (!page) return;
  e.respondWith(fetch(r, {cache: 'no-store'}).then(res => { if (res.ok && r.mode === 'navigate') { const c = res.clone(); caches.open(C).then(x => x.put(r, c)); } return res; }).catch(() => caches.match(r).then(m => m || Response.error())));
});
