// STEP 1: 将来の更新のためにキャッシュ名を新しいバージョンに変更します。
// 次回更新時は 'v4' のように数字を上げてください。
const CACHE_NAME = 'jibun-yosan-cache-v3';

// プレキャッシュするファイルのリストです。
// CSSやJavaScript、主要な画像ファイルなどを追加するとオフライン体験が向上します。
const urlsToCache = [
  '/',
  '/index.html',
  // '/styles/main.css',
  // '/scripts/main.js',
  // '/images/icon.png',
];

// installイベント: 新しいサービスワーカーがインストールされるときに一度だけ実行されます。
// ここで必要なファイルを事前にキャッシュします。
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
     .then((cache) => {
        console.log('Opened cache and caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

// activateイベント: 新しいサービスワーカーが有効化されるときに実行されます。
// ここで古いバージョンのキャッシュを削除します。
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // ホワイトリストに含まれていないキャッシュ（＝古いキャッシュ）を削除します。
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// fetchイベント: ブラウザがネットワークリクエストを行うたびに実行されます。
// ここでリクエストを横取りし、キャッシュ戦略を適用します。
self.addEventListener('fetch', (event) => {
  // ★★★ 問題解決の核心部分 ★★★
  // リクエストの種類に応じてキャッシュ戦略を切り替えます。

  // (A) HTMLページへのリクエスト（ナビゲーションリクエスト）の場合
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // まずネットワークから最新のHTMLを取得しようとします。
      fetch(event.request)
       .catch(() => {
          // ネットワークに接続できない場合（オフライン時）は、
          // キャッシュされているindex.htmlを返します。
          return caches.match('/index.html');
        })
    );
    return; // このリクエストの処理はここで終了
  }

  // (B) CSS, JavaScript, 画像ファイルなど、その他のリクエストの場合
  event.respondWith(
    caches.match(event.request)
     .then((response) => {
        // キャッシュに一致するものがあれば、それを返します（キャッシュファースト）。
        if (response) {
          return response;
        }

        // キャッシュにない場合は、ネットワークにリクエストを送信します。
        return fetch(event.request).then(
          (networkResponse) => {
            // レスポンスが有効かチェック
            if(!networkResponse |

| networkResponse.status!== 200 |
| networkResponse.type!== 'basic') {
              return networkResponse;
            }

            // レスポンスは一度しか使えないストリームなので、クローンしてキャッシュに保存します。
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
             .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            // 元のレスポンスをブラウザに返します。
            return networkResponse;
          }
        );
      })
  );
});
