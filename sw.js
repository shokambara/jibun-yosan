// STEP 1: デバッグ用にキャッシュ名をバージョンアップ
const CACHE_NAME = 'jibun-yosan-cache-v12';

const urlsToCache = [
  '/',
  '/index.html',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
];

// installイベント：変更なし
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching pre-cached files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// activateイベント：変更なし
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('jibun-yosan-cache-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// ★★★ ここからが改善点です ★★★
// fetchイベント：デバッグログを追加し、より安全なロジックに変更
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ナビゲーションリクエスト（HTMLページへのアクセス）の場合
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('[SW] Network fetch failed, serving index.html from cache');
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 画像やCSSなど、その他のリクエストの場合
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. キャッシュにヒットした場合
      if (cachedResponse) {
        console.log(`[SW] Serving from Cache: ${url.pathname}`);
        return cachedResponse;
      }

      // 2. キャッシュにヒットしなかった場合、ネットワークから取得
      console.log(`[SW] Cache miss, fetching from Network: ${url.pathname}`);
      return fetch(event.request);
    })
  );
});
