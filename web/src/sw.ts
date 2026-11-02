/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
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

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => !key.includes("precache"))
        .map((key) => caches.delete(key)),
    );
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(windows.map(async (client) => {
      const url = new URL(client.url);
      if (url.searchParams.get("eqfresh") === "1") return;
      url.searchParams.set("eqfresh", "1");
      try {
        await client.navigate(url.toString());
      } catch {
        // A client that cannot navigate still gets the page kill-switch on the next open.
      }
    }));
  })());
});
