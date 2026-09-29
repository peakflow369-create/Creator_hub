const CACHE_NAME = 'creator-hub-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Install Event: Cache core assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up all old caches (v1 automatically deleted)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event: Network-First Strategy
// Pehle live server se fresh file layega, agar network down/offline hua tabhi cache use karega.
self.addEventListener('fetch', (event) => {
  // Non-GET requests ya external API (Supabase/Worker) ko normal handle hone do
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Live network response mila toh use cache me update karke return karo
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Agar network offline/fail ho jaye, tabhi cache se serve karo
        return caches.match(event.request);
      })
  );
});
