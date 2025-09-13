// Basic Service Worker for Tutoring Center Scheduler
const CACHE_NAME = 'tutoring-center-scheduler-v1';
// client/public/sw.js
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];
// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Handle navigations (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch (_) {
        return (await caches.match('/index.html')) || (await caches.match('/'));
      }
    })());
    return;
  }

  // Static assets: Cache-first
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
