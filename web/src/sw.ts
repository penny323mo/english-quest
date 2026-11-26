/// <reference lib="webworker" />
import { PrecacheController } from "workbox-precaching";
import { cacheNames } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import type { PrecacheEntry } from "workbox-precaching";
import { navigateNetworkFirst, SHELL_CACHE } from "./sw-navigate.mjs";
import { planPrecachePurge } from "./sw-purge.mjs";
import { isOwnCache } from "./cache-scope.mjs";

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
const manifest = self.__WB_MANIFEST.filter((entry) => !SHELL.test(entryUrl(entry)));

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
      keepPage,
      waitUntil: (promise) => (event as ExtendableEvent).waitUntil(promise),
    }),
);
registerRoute(
  ({ url }) => SHELL.test(url.pathname),
  new NetworkOnly({ fetchOptions: { cache: "no-cache" } }),
);
const urls = precacheController.getURLsToCacheKeys();
const scope = self.registration.scope;
const entryUrlForBuild = [...urls.keys()].find((url) => /\/assets\/index-[^/]+\.js$/.test(url));
const bootFiles = [...urls].filter(([url]) => /\.(?:js|css)$/.test(url));
let bootReady = false;
let packReady = false;

async function keepPage(page: Response) {
  if (!entryUrlForBuild || !bootReady) return;
  const entryPath = new URL(entryUrlForBuild).pathname;
  if (!(await page.clone().text()).includes(entryPath)) return;
  const shells = await caches.open(SHELL_CACHE);
  const previous = await shells.match(scope);
  if (previous && !packReady && !(await previous.text()).includes(entryPath)) return;
  await shells.put(scope, page);
}

registerRoute(
  ({ url }) => url.href.startsWith(scope + "assets/") || urls.has(url.href),
  async ({ request }) => {
    const cache = await caches.open(cacheNames.precache);
    const key = urls.get(request.url);
    const hit = key && await cache.match(key);
    if (hit) return hit;
    // A saved page may still reference a previous fingerprint or audio revision.
    try {
      const response = await fetch(request);
      if (response.ok) return response;
      return await cache.match(request, { ignoreSearch: true }) ?? response;
    } catch (error) {
      const previous = await cache.match(request, { ignoreSearch: true });
      if (previous) return previous;
      throw error;
    }
  },
);

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

let precacheTask: Promise<void> | undefined;

async function download(cache: Cache, files: [string, string][], present: Set<string>) {
  const missing = files.filter(([, key]) => !present.has(key));
  let at = 0;
  let failure: unknown;
  async function next() {
    while (!failure && at < missing.length) {
      const [url, key] = missing[at++];
      try {
        const response = await fetch(url, { cache: "reload" });
        if (!response.ok) throw new Error("Offline asset HTTP " + response.status);
        await cache.put(key, response);
        present.add(key);
      } catch (error) { failure = error; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, missing.length) }, next));
  if (failure) throw failure;
}

async function refreshPage() {
  const response = await fetch(scope, { cache: "no-cache" });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return false;
  await keepPage(response);
  const saved = await (await caches.open(SHELL_CACHE)).match(scope);
  return Boolean(entryUrlForBuild && saved && (await saved.text()).includes(new URL(entryUrlForBuild).pathname));
}

function precacheInBackground(): Promise<void> {
  if (!precacheTask) {
    precacheTask = (async () => {
      const cache = await caches.open(cacheNames.precache);
      const present = new Set((await cache.keys()).map((request) => request.url));
      await download(cache, bootFiles, present);
      bootReady = true;
      await refreshPage();
      await download(cache, [...urls], present);
      packReady = true;
      if (await refreshPage()) await purgeOldShell();
      else throw new Error("Offline page does not match this worker");
    })().catch(() => {
      packReady = false;
      precacheTask = undefined;
    });
  }
  return precacheTask;
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Only legacy workers lack a separate saved page. Remove their dark shell
    // immediately; modern updates retain their previous playable pack.
    const hasSavedPage = await (await caches.open(SHELL_CACHE)).match(scope);
    const removedShell = !hasSavedPage && await purgeOldShell();
    await self.clients.claim();
    if (removedShell) {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(scope)) void client.navigate(client.url);
      }
    }
    void precacheInBackground();
  })());
});

self.addEventListener("fetch", (event) => {
  event.waitUntil(precacheInBackground());
});
