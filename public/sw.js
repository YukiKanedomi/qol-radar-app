// QOLレーダー Service Worker — オフライン対応
// 方針: ナビゲーションと picks.json は network-first（最新優先）、
//       ハッシュ付き静的アセットは stale-while-revalidate、いずれも失敗時はキャッシュへ。
// install 時にアプリシェル＋ビルド成果物を precache するので、初回訪問後はオフラインでも開ける。
const CACHE = "qol-cache-v3"; // v3: ネットワーク待ちの上限を導入
const BASE = "/qol-radar-app/";
// ビルド時に dist のハッシュ付きアセットが注入される（scripts/inject-sw-precache.mjs）
const BUILD_ASSETS = []; /*__PRECACHE_INJECT__*/
const APP_SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.webmanifest",
  BASE + "icon-192.png",
  BASE + "data/picks.json",
];
const PRECACHE = APP_SHELL.concat(BUILD_ASSETS);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // 1件の失敗で install 全体を落とさないよう個別に追加
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** 一定時間で諦めてキャッシュに切り替える（モバイルの弱い回線で固まらないため） */
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(request).then(
      (res) => {
        clearTimeout(t);
        resolve(res);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      },
    );
  });
}

/** 正常応答だけをキャッシュし、書き込み完了を event.waitUntil で待つ（404/500 を保存しない） */
function cacheOk(event, request, response) {
  if (response && response.ok) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then((c) => c.put(request, copy)));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ナビゲーション: network-first → 失敗時はキャッシュした app shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(req, 4000)
        .then((res) => cacheOk(event, BASE, res))
        .catch(() =>
          caches
            .match(BASE, { ignoreVary: true })
            .then((r) => r || caches.match(BASE + "index.html", { ignoreVary: true })),
        ),
    );
    return;
  }

  // データ: network-first（最新優先）→ 失敗時キャッシュ
  if (url.pathname.endsWith("/data/picks.json")) {
    event.respondWith(
      fetchWithTimeout(req, 6000)
        .then((res) => cacheOk(event, req, res))
        .catch(() => caches.match(req, { ignoreVary: true })),
    );
    return;
  }

  // 静的アセット: cache-first（ハッシュ付きで不変）。CORS の Vary を無視して確実にヒットさせる
  event.respondWith(
    caches.match(req, { ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => cacheOk(event, req, res))
          .catch(() => cached),
    ),
  );
});
