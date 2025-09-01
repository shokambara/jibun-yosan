const CACHE_NAME = 'jibun-yosan-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // ここにSTEP1で生成した画像ファイル名を追記していくと、より完璧になります。
  // 例: '/images/android-chrome-192x192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
