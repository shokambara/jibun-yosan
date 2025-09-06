// STEP 1: キャッシュ名を最終バージョン('v6')に更新します
const CACHE_NAME = 'jibun-yosan-cache-v6';

// STEP 2: 画像パスが正しいことを確認した上で、プレキャッシュするファイルを指定します
const urlsToCache = [
  '/',
  '/index.html',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
];

// installイベント
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // ★★★ 改善点1: 新しいワーカーがインストールされたら、待機せず即座に次のステップへ進む
        return self.skipWaiting();
      })
  );
});

// activateイベント
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('jibun-yosan-cache-') &&
                 cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // ★★★ 改善点2: 有効化されたら、即座にすべてのクライアント（開いているタブ）の制御を取得する
      return self.clients.claim();
    })
  );
});

// fetchイベント（変更なし）
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
