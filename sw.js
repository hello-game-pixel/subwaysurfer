const CACHE_NAME = 'github-offline-v2';

// 1. Only cache the exact local files needed to boot the app structure
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['./', './index.html']);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 2. The Smart Interceptor
self.addEventListener('fetch', (event) => {
  // RULE 1: If the request is NOT a standard web request (like a chrome extension or external API), bypass the cache completely
  if (!event.request.url.startsWith(self.location.origin)) {
    event.respondWith(fetch(event.request).catch(() => Response.error()));
    return;
  }

  // RULE 2: For local site files, try the internet first so the site stays updated. 
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the internet works, save a copy of the fresh file for later offline use
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If the internet fails (offline), ONLY THEN look inside the local iPad/device memory
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || Response.error();
        });
      })
  );
});
