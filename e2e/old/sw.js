const CACHE = "eq-old-dark";
const SCOPE = "/english-quest";
const SHELL = [`${SCOPE}/index.html`, `${SCOPE}/sw.js`, `${SCOPE}/manifest.webmanifest`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const shell = url.pathname.endsWith("/sw.js")
    || url.pathname.endsWith("/index.html")
    || url.pathname.endsWith("/manifest.webmanifest")
    || event.request.mode === "navigate";
  if (!shell) return;
  event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
});
