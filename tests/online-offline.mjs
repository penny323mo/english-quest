// review/v1-audit.md P1-1, P1-2, P1-7.
// Rule: online, always load the newest page; offline, fall back to the cached copy;
// never touch IndexedDB progress.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { navigateNetworkFirst, SHELL_CACHE } from "../web/src/sw-navigate.mjs";
import { ART_WAIT_MS, waitForImages } from "../web/src/art-wait.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCOPE = "https://penny323mo.github.io/english-quest/";

function fakeCaches() {
  const stores = new Map();
  return {
    stores,
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(url) { return store.get(url)?.clone(); },
        async put(url, response) { store.set(url, response); },
      };
    },
  };
}

const html = (body, init = {}) => new Response(body, { status: 200, headers: { "content-type": "text/html" }, ...init });

test("online: the page always comes from the network, past the HTTP cache (P1-1)", async () => {
  const caches = fakeCaches();
  await (await caches.open(SHELL_CACHE)).put(SCOPE, html("old page"));
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push([url, init]); return html("new page"); };
  const response = await navigateNetworkFirst({ url: `${SCOPE}#/lesson/F1` }, { fetchImpl, cachesImpl: caches, shellUrl: SCOPE });
  assert.equal(await response.text(), "new page", "a kept copy never wins while online");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].cache, "no-cache", "revalidates instead of trusting max-age=600");
  const kept = await (await caches.open(SHELL_CACHE)).match(SCOPE);
  assert.equal(await kept.text(), "new page", "the newest page becomes the offline copy");
});

test("offline: the last good page is served (P1-2)", async () => {
  const caches = fakeCaches();
  await (await caches.open(SHELL_CACHE)).put(SCOPE, html("kept page"));
  const fetchImpl = async () => { throw new TypeError("Failed to fetch"); };
  const response = await navigateNetworkFirst({ url: SCOPE }, { fetchImpl, cachesImpl: caches, shellUrl: SCOPE });
  assert.equal(await response.text(), "kept page");
});

test("offline with no copy yet fails like the network did", async () => {
  const fetchImpl = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(navigateNetworkFirst({ url: SCOPE }, { fetchImpl, cachesImpl: fakeCaches(), shellUrl: SCOPE }), /Failed to fetch/);
});

test("an error page or a non-HTML response is returned but never kept", async () => {
  const caches = fakeCaches();
  const notFound = await navigateNetworkFirst({ url: SCOPE }, {
    fetchImpl: async () => html("missing", { status: 404 }),
    cachesImpl: caches,
    shellUrl: SCOPE,
  });
  assert.equal(notFound.status, 404);
  const json = await navigateNetworkFirst({ url: SCOPE }, {
    fetchImpl: async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    cachesImpl: caches,
    shellUrl: SCOPE,
  });
  assert.equal(json.status, 200);
  assert.equal(await (await caches.open(SHELL_CACHE)).match(SCOPE), undefined);
});

test("a redirected page is copied into a clean response for Safari", async () => {
  const redirected = html("page");
  Object.defineProperty(redirected, "redirected", { value: true });
  const response = await navigateNetworkFirst({ url: SCOPE.slice(0, -1) }, {
    fetchImpl: async () => redirected,
    cachesImpl: fakeCaches(),
    shellUrl: SCOPE,
  });
  assert.equal(response.redirected, false);
  assert.equal(await response.text(), "page");
});

test("sw.ts wires the rule in and the purge keeps the offline copy", () => {
  const sw = fs.readFileSync(path.join(root, "web/src/sw.ts"), "utf8");
  assert.match(sw, /request\.mode === "navigate",\s*\(\{ request, event \}\) =>\s*navigateNetworkFirst\(/);
  assert.match(sw, /new NetworkOnly\(\{ fetchOptions: \{ cache: "no-cache" \} \}\)/);
  assert.match(sw, /if \(key === SHELL_CACHE\) return;/);
  for (const file of ["web/src/sw.ts", "web/src/sw-navigate.mjs"]) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    assert.equal(/indexedDB|IDB/i.test(text.replace(/Nothing here touches IndexedDB\./, "")), false, `${file} must not touch IndexedDB`);
  }
});

function fakeImage(behaviour) {
  return () => {
    const img = { complete: false, naturalWidth: 0, decode: () => Promise.resolve() };
    Object.defineProperty(img, "src", {
      set() {
        queueMicrotask(() => {
          if (behaviour === "load") { img.naturalWidth = 1000; img.onload(); }
          if (behaviour === "error") img.onerror();
        });
      },
    });
    return img;
  };
}

test("the Hook's art wait cannot hang on a failed or missing image (P1-7)", async () => {
  const never = () => {};
  await waitForImages(["a.webp"], { makeImage: fakeImage("load"), setTimer: never });
  await waitForImages(["a.webp", "b.webp"], { makeImage: fakeImage("error"), setTimer: never });
  let fire;
  const pending = waitForImages(["slow.webp"], { makeImage: fakeImage("hang"), setTimer: (fn) => { fire = fn; } });
  let done = false;
  pending.then(() => { done = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(done, false, "still waiting before the timeout");
  fire();
  await pending;
  assert.ok(ART_WAIT_MS <= 3000);
  const art = fs.readFileSync(path.join(root, "web/src/art.tsx"), "utf8");
  assert.match(art, /waitForImages\(urls, \{ minWidth, timeoutMs, makeImage: \(\) => new Image\(\) \}\)/);
});
