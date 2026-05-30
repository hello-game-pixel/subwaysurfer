const CACHE_NAME = 'github-offline-v3';

// 1. Only cache the root files needed to boot up
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use relative dots so GitHub knows to look inside your repository folder
      return cache.addAll(['./', './index.html']);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 2. The Smart Interceptor (Fixed for GitHub Pages)
self.addEventListener('fetch', (event) => {
  
  // FIXED: Check if the request is for your specific GitHub repository folder
  const isLocalRequest = event.request.url.includes(self.location.pathname.replace('sw.js', ''));

  // If it's a request to an outside server (like Google Fonts or external APIs), bypass the cache completely
  if (!isLocalRequest) {
    event.respondWith(fetch(event.request).catch(() => Response.error()));
    return;
  }

  // For your local project files (images, CSS, game elements), prioritize the internet but save a backup
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If Wi-Fi is cut, grab the assets straight from local iPad memory
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || Response.error();
        });
      })
  );
});
