/// <reference lib="webworker" />
import { cleanupOutdatedCaches, PrecacheController, PrecacheRoute } from "workbox-precaching";
import { cacheNames } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import type { PrecacheEntry } from "workbox-precaching";
import { navigateNetworkFirst, SHELL_CACHE } from "./sw-navigate.mjs";
import { planPrecachePurge } from "./sw-purge.mjs";
import { isOwnCache } from "./cache-scope.mjs";
import { EXTRAS_CACHE, extraKey, isExtraClip, planExtrasPurge } from "./sw-extras.mjs";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

const SHELL = /(?:^|\/)(?:index\.html|sw\.js|registerSW\.js|manifest\.webmanifest|workbox-[^/]+\.js)$/;

function entryUrl(entry: PrecacheEntry | string): string {
  return typeof entry === "string" ? entry : entry.url;
}

// index.html, sw.js, and the manifest are never precached. Online, navigations
// and those URLs always come from the network past the HTTP cache, so a phone
// cannot keep the old shell. Offline, a page load falls back to the last
// index.html that loaded (sw-navigate.mjs).
const built = self.__WB_MANIFEST.filter((entry) => !SHELL.test(entryUrl(entry)));
// Word-card extras (sw-extras.mjs) are cached when first played, not up front.
const manifest = built.filter((entry) => !isExtraClip(entryUrl(entry)));
const extraKeys = new Map<string, string>();
for (const entry of built) {
  const url = entryUrl(entry);
  if (!isExtraClip(url)) continue;
  const abs = new URL(url, self.registration.scope).href;
  extraKeys.set(abs, extraKey(abs, typeof entry === "string" ? null : entry.revision));
}

// addToCacheList does not register an install handler. precache() would,
// and that handler waits for every audio file before activate. Safari would
// keep serving the precached dark page until that finished.
const precacheController = new PrecacheController();
precacheController.addToCacheList(manifest);
registerRoute(
  ({ request }) => request.mode === "navigate",
  ({ request, event }) =>
    navigateNetworkFirst(request, {
      fetchImpl: fetch,
      cachesImpl: caches,
      shellUrl: self.registration.scope,
      waitUntil: (promise) => (event as ExtendableEvent).waitUntil(promise),
    }),
);
registerRoute(
  ({ url }) => SHELL.test(url.pathname),
  new NetworkOnly({ fetchOptions: { cache: "no-cache" } }),
);
registerRoute(new PrecacheRoute(precacheController));
registerRoute(
  ({ url }) => extraKeys.has(url.origin + url.pathname),
  async ({ url }) => {
    const key = extraKeys.get(url.origin + url.pathname)!;
    const cache = await caches.open(EXTRAS_CACHE);
    const hit = await cache.match(key);
    if (hit) return hit;
    const response = await fetch(url.origin + url.pathname);
    if (response.ok && response.status === 200) await cache.put(key, response.clone()).catch(() => undefined);
    return response;
  },
);
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
  const scope = self.registration.scope;
  let removed = false;
  await Promise.all(keys.map(async (key) => {
    if (!isOwnCache(key, scope)) return; // another app on this origin (github.io is shared)
    if (key === SHELL_CACHE) return; // the offline copy of the page is managed by sw-navigate.mjs
    if (key === EXTRAS_CACHE) {
      // Played word-card extras stay; only stale revisions and removed clips go.
      const cache = await caches.open(key);
      const cached = (await cache.keys()).map((request) => request.url);
      await Promise.all(planExtrasPurge(cached, extraKeys.values()).map((url) => cache.delete(url)));
      return;
    }
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
    // Keep the offline copy of the page in step with this worker's assets.
    void navigateNetworkFirst({ url: self.registration.scope }, {
      fetchImpl: fetch,
      cachesImpl: caches,
      shellUrl: self.registration.scope,
    }).catch(() => undefined);
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") return;
  event.waitUntil(precacheInBackground());
});
