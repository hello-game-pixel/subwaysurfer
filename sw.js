const CACHE_NAME = 'github-offline-v1';

// 1. When the site loads, instantly cache the HTML file
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cleanest way to cache the current folder on GitHub Pages
      return cache.addAll(['./', './index.html']);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate and take control of the page immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 3. Intercept requests: Try the network, fall back to Cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If internet is working, duplicate the fresh file into our cache box
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If internet fails (offline), pull the file from local iPad/device memory
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || Response.error();
        });
      })
  );
});
