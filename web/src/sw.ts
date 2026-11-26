/// <reference lib="webworker" />
import { PrecacheController } from "workbox-precaching";
import { cacheNames } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { createPartialResponse } from "workbox-range-requests";
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
      onMissingPage: () => {
        if (pack.state === "ready") {
          pack.state = "checking";
          pack.completed = 0;
          packReady = bootReady = false;
          precacheTask = undefined;
          savedRevisions = undefined;
        }
      },
      waitUntil: (promise) => (event as ExtendableEvent).waitUntil(promise),
    }),
);
// Keep the last install metadata available when a saved app is opened offline.
async function appManifest(): Promise<Response> {
  const url = new URL("manifest.webmanifest", self.registration.scope).href;
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (response.ok && /json|manifest/i.test(response.headers.get("content-type") || "")) {
      await cache.put(url, response.clone());
    }
    if (response.ok) return response;
    return await cache.match(url) || response;
  } catch {
    return await cache.match(url) || new Response(null, {status:503});
  }
}
registerRoute(({ url }) => url.href === self.registration.scope + "manifest.webmanifest", appManifest);
registerRoute(
  ({ url }) => SHELL.test(url.pathname),
  new NetworkOnly({ fetchOptions: { cache: "no-cache" } }),
);
const urls = precacheController.getURLsToCacheKeys();
const scope = self.registration.scope;
const entryUrlForBuild = [...urls.keys()].find((url) => /\/assets\/index-[^/]+\.js$/.test(url));
const revisionPrefix = scope + ".offline-revisions/";
let savedRevisions: Promise<Map<string, string>> | undefined;
function revisionList(entry: string) {
  return revisionPrefix + encodeURIComponent(entry);
}
function previousRevisions(cache: Cache): Promise<Map<string, string>> {
  return savedRevisions ??= (async () => {
    const shells = await caches.open(SHELL_CACHE);
    const page = await shells.match(scope);
    const src = page && /\bsrc=["']([^"']*\/assets\/index-[^/"']+\.js)["']/.exec(await page.text())?.[1];
    if (!src) return new Map<string, string>();
    const entry = new URL(src, scope).href;
    const saved = await shells.match(revisionList(entry));
    if (saved) return new Map<string, string>(await saved.json());
    // Upgrade an installed pack that predates revision lists, before staging any new audio.
    const previous = new Map<string, string>();
    for (const request of await cache.keys()) {
      const url = new URL(request.url);
      url.searchParams.delete("__WB_REVISION__");
      if (!previous.has(url.href)) previous.set(url.href, request.url);
    }
    await shells.put(revisionList(entry), new Response(JSON.stringify([...previous])));
    return previous;
  })().catch(error => {
    savedRevisions = undefined;
    throw error;
  });
}
const bootFiles = [...urls].filter(([url]) => /\.(?:js|css)$/.test(url));
let bootReady = false;
let packReady = false;
const pack = { state: "checking", completed: 0, total: urls.size, reason: "", entry: entryUrlForBuild };
let retryAfter = 0;

function cachedResponse(request: Request, response: Response) {
  return request.headers.has("range") ? createPartialResponse(request, response) : response;
}

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
    if (key && !packReady) {
      const oldKey = (await previousRevisions(cache)).get(request.url);
      if (oldKey && oldKey !== key) {
        const previous = await cache.match(oldKey);
        if (previous) {
          // A new online page gets the current recording. An offline page still
          // belongs to the last complete pack, even if this file finished staging.
          try {
            const online = await fetch(request.url, {
              cache: "no-cache",
              integrity: precacheController.getIntegrityForCacheKey(key),
            });
            if (online.status === 200) return cachedResponse(request, online);
          } catch { /* The last complete recording is available offline. */ }
          return cachedResponse(request, previous);
        }
      }
    }
    // A previous shell still requests its exact fingerprinted boot script.
    // Use those saved bytes even if the network connection stays half open.
    const hit = await cache.match(key || request);
    if (hit) return cachedResponse(request, hit);
    // A saved page may still reference a previous fingerprint or audio revision.
    try {
      const response = await fetch(request);
      if (response.ok) return response;
      const previous = await cache.match(request, { ignoreSearch: true });
      return previous ? cachedResponse(request, previous) : response;
    } catch (error) {
      const previous = await cache.match(request, { ignoreSearch: true });
      if (previous) return cachedResponse(request, previous);
      throw error;
    }
  },
);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const type = event.data?.type;
  if (type === "eq-ping") event.ports[0]?.postMessage({ eq: 2 });
  if (type !== "eq-pack-status" && type !== "eq-pack-retry") return;
  if (type === "eq-pack-retry") retryAfter = 0;
  if (pack.state === "checking" || type === "eq-pack-retry") event.waitUntil(precacheInBackground());
  event.ports[0]?.postMessage(pack);
});

async function purgeOldShell(legacyOnly = false): Promise<boolean> {
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
    // Only historical workers stored their index.html in the asset precache.
    // A missing lookup in the separate shell cache cannot identify one.
    if (legacyOnly && !requests.some(({ url }) => url.split("?")[0] === scope + "index.html")) return;
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
        const response = await fetch(url, {
          cache: "reload",
          integrity: precacheController.getIntegrityForCacheKey(key),
        });
        if (response.status !== 200) throw new Error("Offline asset HTTP " + response.status);
        await cache.put(key, response);
        present.add(key);
        pack.completed++;
      } catch (error) { failure = error; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, missing.length) }, next));
  if (failure) throw failure;
}

async function refreshPage() {
  const saved = await (await caches.open(SHELL_CACHE)).match(scope);
  if (!entryUrlForBuild) return false;
  const entry = new URL(entryUrlForBuild).pathname;
  if (saved && (await saved.text()).includes(entry)) return true;
  const response = await fetch(scope, { cache: "no-cache" });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return false;
  await keepPage(response);
  const current = await (await caches.open(SHELL_CACHE)).match(scope);
  return Boolean(current && (await current.text()).includes(entry));
}

function precacheInBackground(): Promise<void> {
  if (!precacheTask) {
    if (Date.now() < retryAfter) return Promise.resolve();
    pack.state = "downloading";
    pack.reason = "";
    precacheTask = (async () => {
      const cache = await caches.open(cacheNames.precache);
      await previousRevisions(cache);
      const present = new Set((await cache.keys()).map((request) => request.url));
      pack.completed = [...urls.values()].filter(key => present.has(key)).length;
      await download(cache, bootFiles, present);
      if (!(await (await caches.open(SHELL_CACHE)).match(scope + "manifest.webmanifest"))) await appManifest();
      bootReady = true;
      await refreshPage();
      await download(cache, [...urls], present);
      if (!entryUrlForBuild) throw new Error("Offline entry is missing");
      const shells = await caches.open(SHELL_CACHE);
      const revisionUrl = revisionList(entryUrlForBuild);
      await shells.put(revisionUrl, new Response(JSON.stringify([...urls])));
      packReady = true;
      if (await refreshPage()) await purgeOldShell();
      else throw new Error("Offline page does not match this worker");
      for (const entry of await shells.keys()) {
        if (entry.url.startsWith(revisionPrefix) && entry.url !== revisionUrl) await shells.delete(entry);
      }
      savedRevisions = Promise.resolve(urls);
      pack.state = "ready";
    })().catch((error) => {
      pack.state = "failed";
      pack.reason = error?.name === "QuotaExceededError" ? "quota" : "download";
      retryAfter = Date.now() + 5000;
      packReady = false;
      precacheTask = undefined;
    });
  }
  return precacheTask;
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const hasSavedPage = await (await caches.open(SHELL_CACHE)).match(scope);
    const removedShell = !hasSavedPage && await purgeOldShell(true);
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
