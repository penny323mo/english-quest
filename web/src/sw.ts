/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { cacheNames } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import type { PrecacheEntry } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

const SHELL = /(?:^|\/)(?:index\.html|sw\.js|registerSW\.js|manifest\.webmanifest|workbox-[^/]+\.js)$/;

function entryUrl(entry: PrecacheEntry | string): string {
  return typeof entry === "string" ? entry : entry.url;
}

// index.html, sw.js, and the manifest are never precached. Navigations and
// those URLs are network-only below, so a phone cannot keep the old shell.
const manifest = self.__WB_MANIFEST.filter((entry) => !SHELL.test(entryUrl(entry)));

self.skipWaiting();
cleanupOutdatedCaches();
precacheAndRoute(manifest);

registerRoute(
  ({ request, url }) => request.mode === "navigate" || SHELL.test(url.pathname),
  new NetworkOnly(),
);

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type !== "eq-ping") return;
  event.ports[0]?.postMessage({ eq: 2 });
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = cacheNames.precache;
    const allowed = new Set(manifest.map((entry) => new URL(entryUrl(entry), self.registration.scope).pathname));
    const keys = await caches.keys();
    await Promise.all(keys.map(async (key) => {
      if (key !== keep) {
        await caches.delete(key);
        return;
      }
      const cache = await caches.open(key);
      const requests = await cache.keys();
      await Promise.all(requests.map((request) => {
        const pathname = new URL(request.url).pathname;
        if (allowed.has(pathname)) return undefined;
        return cache.delete(request);
      }));
    }));
    // clientsClaim after the purge, so the fix-55 reload is not served the old shell.
    await self.clients.claim();
  })());
});
