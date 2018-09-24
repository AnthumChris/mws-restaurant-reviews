const cacheVer = 'v2'; // always use a string value, not int

// clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {

      // detect if a new cacheVer was upgraded
      let cacheVerChanged = false;

      return Promise.all(
        keys.filter(
          key => key !== cacheVer).map(key => caches.delete(key)
          .then(_ => cacheVerChanged=true)
        )
      )
      .then(_ => {
        if (cacheVerChanged) {
          // delete old IndexedDB so new data is fetched
          // awaiting the IDBOpenDBRequest.onsuccess call is flakey and stalls
          // ServiceWorker, so don't wait for it and return immediately
          console.log('ServiceWorker now at '+cacheVer+'. Deleting indexedDB...');
          indexedDB.deleteDatabase('restaurantReviews');
        }
      })
    })
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