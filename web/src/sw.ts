/// <reference lib="webworker" />
import { cleanupOutdatedCaches, PrecacheController, PrecacheRoute } from "workbox-precaching";
import { cacheNames } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import type { PrecacheEntry } from "workbox-precaching";
import { planPrecachePurge } from "./sw-purge.mjs";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

const SHELL = /(?:^|\/)(?:index\.html|sw\.js|registerSW\.js|manifest\.webmanifest|workbox-[^/]+\.js)$/;

function entryUrl(entry: PrecacheEntry | string): string {
  return typeof entry === "string" ? entry : entry.url;
}

// index.html, sw.js, and the manifest are never precached. Navigations and
// those URLs are network-only, so a phone cannot keep the old shell.
const manifest = self.__WB_MANIFEST.filter((entry) => !SHELL.test(entryUrl(entry)));

// addToCacheList does not register an install handler. precache() would,
// and that handler waits for every audio file before activate. Safari would
// keep serving the precached dark page until that finished.
const precacheController = new PrecacheController();
precacheController.addToCacheList(manifest);
registerRoute(
  ({ request, url }) => request.mode === "navigate" || SHELL.test(url.pathname),
  new NetworkOnly(),
);
registerRoute(new PrecacheRoute(precacheController));
cleanupOutdatedCaches();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type !== "eq-ping") return;
  event.ports[0]?.postMessage({ eq: 2 });
});

async function purgeOldShell(): Promise<boolean> {
  const keep = cacheNames.precache;
  const keepKeys = [...precacheController.getURLsToCacheKeys().values()];
  const keys = await caches.keys();
  let removed = false;
  await Promise.all(keys.map(async (key) => {
    if (key !== keep) {
      removed = true;
      await caches.delete(key);
      return;
    }
    const cache = await caches.open(key);
    const requests = await cache.keys();
    const plan = planPrecachePurge(requests.map((request) => request.url), keepKeys);
    if (plan.shellChanged) removed = true;
    await Promise.all(plan.remove.map((url) => cache.delete(url)));
  }));
  return removed;
}

let precacheTask: Promise<void> | null = null;
function precacheInBackground(): Promise<void> {
  if (!precacheTask) {
    precacheTask = (async () => {
      try {
        const fake = {
          type: "install",
          waitUntil(promise: Promise<unknown>) {
            void Promise.resolve(promise).catch(() => undefined);
          },
        } as ExtendableEvent;
        await precacheController.install(fake);
      } catch {
        // A missed asset must not put the dark shell back in control.
      }
    })();
  }
  return precacheTask;
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const removedShell = await purgeOldShell();
    await self.clients.claim();
    if (removedShell) {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) void client.navigate(client.url);
    }
    void precacheInBackground();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") return;
  event.waitUntil(precacheInBackground());
});
