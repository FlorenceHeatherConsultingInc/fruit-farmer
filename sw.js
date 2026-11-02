/* Fruit Farmer: lets the installed game open offline.
   Network first, so players get new versions as soon as they're online; the saved copy is only
   used when there's no connection. New game files need adding to FILES. */
const CACHE = 'fruit-farmer';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/data.js', 'js/core.js', 'js/draw.js', 'js/scenery.js', 'js/ui.js', 'js/farm.js',
  'js/animals.js', 'js/friends.js', 'js/stickers.js', 'js/market-layouts.js', 'js/market.js', 'js/shop.js', 'js/board.js', 'js/book.js', 'js/village.js', 'js/main.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => caches.match(e.request)));
});
