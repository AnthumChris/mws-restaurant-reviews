const cacheVer = 'v2';

// clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== cacheVer).map(key => caches.delete(key))))
  );
})

self.addEventListener('fetch', event => {
  // bypass when using local Browsersync
  if (event.request.url.startsWith('http://localhost:3000/')) {
    return;
  }

  event.respondWith(
    caches.open(cacheVer)
    .then(cache => {
      return cache.match(event.request)
      .then(response => {
        return response || fetch(event.request)
        .then(response => {
          cache.put(event.request, response.clone())
          return response;
        });
      })
    })
  )
})