// STEP 1: キャッシュ名を新しいバージョン('v4')に更新します。
// これにより、ブラウザは変更を検知し、再度installイベントを実行します。
const CACHE_NAME = 'jibun-yosan-cache-v4';

// STEP 2: プレキャッシュするファイルのリストに、ご指定の画像ファイルを追加しました。
const urlsToCache = [
  '/',
  '/index.html',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
];

// installイベント: 新しいサービスワーカーがインストールされるときに一度だけ実行されます。
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then((cache) => {
        console.log('Opened cache and caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

// activateイベント: 古いバージョンのキャッシュを削除します。
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// fetchイベント: リクエストの種類に応じてキャッシュ戦略を切り替えます。
self.addEventListener('fetch', (event) => {
  // (A) HTMLページへのリクエストの場合 (ネットワークファースト)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
      .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // (B) 画像、CSS、JSなど、その他のリクエストの場合 (キャッシュファースト、なければネットワークから取得してキャッシュ)
  event.respondWith(
    caches.match(event.request)
    .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse |

| networkResponse.status!== 200 |
| networkResponse.type!== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
            .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
  );
});
