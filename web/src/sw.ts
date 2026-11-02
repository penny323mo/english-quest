/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { cacheNames, clientsClaim } from "workbox-core";
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
clientsClaim();
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
    await self.clients.claim();
    const keep = cacheNames.precache;
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== keep).map((key) => caches.delete(key)));
    // The fix-55 page reloads itself on controllerchange. A second
    // client.navigate here was the ?eqfresh=1 hop.
  })());
});
