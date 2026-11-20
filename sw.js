// OPCM 일일 점검 일지 - 서비스워커 (오프라인 캐시)
// 앱을 수정해 다시 올릴 때는 아래 버전 숫자를 올려주세요.
const CACHE = "opcm-log-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return; // 외부 API 연동은 그대로 통과
  if (r.mode === "navigate") { // 화면: 네트워크 우선, 실패 시 캐시(오프라인)
    e.respondWith(fetch(r).then(res => {
      const cp = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(h => h || fetch(r).then(res => {
    const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res;
  })));
});
