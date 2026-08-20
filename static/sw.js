const CACHE_NAME = 'agrovision-v1';
const urlsToCache = [
  '/',
  '/static/img/logo.jpg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Keshlangan fayl bo'lsa uni beradi, bo'lmasa internetdan tortadi
        return response || fetch(event.request);
      })
  );
});
