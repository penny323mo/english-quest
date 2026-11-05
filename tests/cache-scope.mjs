// github.io is shared by every project of the account (review finding 3). Every
// clean-up path must remove only English Quest's own caches and registrations: the
// service worker purge (rules in web/src/cache-scope.mjs), the index.html recovery,
// and the kill-switch workers in public/, which carry inline copies of the rules.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { isOwnCache, isOwnRegistration } from "../web/src/cache-scope.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://penny323mo.github.io";
const SCOPE = `${HOST}/english-quest/`;
const OURS = ["eq-shell-v1", "eq-old-dark", `workbox-precache-v2-${SCOPE}`, `workbox-runtime-${SCOPE}`, `workbox-precache-v2-${SCOPE}sub/`];
const THEIRS = [
  "other-app-v1",
  `workbox-precache-v2-${HOST}/other-app/`,
  `workbox-precache-v2-${HOST}/english-quest-2/`,
  `workbox-precache-v2-${HOST}/`,
  "workbox-precache-v2-",
];
const REG_OURS = [SCOPE, `${SCOPE}sub/`];
const REG_THEIRS = [`${HOST}/other-app/`, `${HOST}/english-quest-2/`, `${HOST}/`];
const KILL_SWITCHES = ["public/registerSW.js", "public/workbox-835c8c05.js", "public/workbox-9c191d2f.js"];

test("the rules: own caches and registrations only", () => {
  for (const name of OURS) assert.equal(isOwnCache(name, SCOPE), true, name);
  for (const name of THEIRS) assert.equal(isOwnCache(name, SCOPE), false, name);
  for (const scope of REG_OURS) assert.equal(isOwnRegistration(scope, SCOPE), true, scope);
  for (const scope of REG_THEIRS) assert.equal(isOwnRegistration(scope, SCOPE), false, scope);
  assert.equal(isOwnRegistration(SCOPE, ""), false, "no known scope: touch no registration");
  assert.equal(isOwnCache(`workbox-precache-v2-${SCOPE}`, ""), false, "no known scope: only eq- caches");
});

function fakeCaches() {
  const names = new Set([...OURS, ...THEIRS]);
  return {
    names,
    keys: async () => [...names],
    delete: async (name) => names.delete(name),
  };
}

function fakeRegistrations() {
  return [...REG_OURS, ...REG_THEIRS].map((scope) => ({ scope, gone: false, unregister() { this.gone = true; return Promise.resolve(true); } }));
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

for (const file of KILL_SWITCHES) {
  test(`${file} as a worker deletes only English Quest's caches`, async () => {
    const caches = fakeCaches();
    const listeners = {};
    class ServiceWorkerGlobalScope {}
    const self = Object.assign(new ServiceWorkerGlobalScope(), {
      caches,
      registration: { scope: SCOPE, unregister: async () => true },
      clients: { claim: async () => undefined, matchAll: async () => [] },
      skipWaiting() {},
      addEventListener(type, fn) { listeners[type] = fn; },
      location: { href: `${SCOPE}sw.js` },
    });
    vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), { self, caches, ServiceWorkerGlobalScope, URL, Promise, Response });
    let work;
    listeners.activate({ waitUntil(promise) { work = promise; } });
    await work;
    assert.deepEqual([...caches.names].sort(), [...THEIRS].sort());
  });
}

test("public/registerSW.js as a page script unregisters and clears only English Quest", async () => {
  const caches = fakeCaches();
  const regs = fakeRegistrations();
  let reloaded = false;
  const store = new Map();
  const context = {
    URL,
    Promise,
    caches,
    navigator: { serviceWorker: { getRegistrations: async () => regs } },
    document: { currentScript: { src: `${SCOPE}registerSW.js` } },
    location: { href: `${SCOPE}`, reload() { reloaded = true; } },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
  };
  context.self = context;
  context.Window = function Window() {};
  vm.runInNewContext(fs.readFileSync(path.join(root, "public/registerSW.js"), "utf8"), context);
  await settle();
  assert.deepEqual(regs.filter((r) => r.gone).map((r) => r.scope).sort(), [...REG_OURS].sort());
  assert.deepEqual([...caches.names].sort(), [...THEIRS].sort());
  assert.equal(reloaded, true);
});

test("index.html recovery from a dead worker touches only English Quest", async () => {
  const html = fs.readFileSync(path.join(root, "web/index.html"), "utf8");
  const script = html.match(/<script>([\s\S]*?eq-sw-kill[\s\S]*?)<\/script>/)[1].replaceAll("%BASE_URL%", "/english-quest/");
  const caches = fakeCaches();
  const regs = fakeRegistrations();
  let reloaded = false;
  const context = {
    URL,
    Promise,
    caches,
    // The controlling worker never answers the ping: the page treats it as dead.
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout,
    MessageChannel: class { constructor() { this.port1 = {}; this.port2 = {}; } },
    sessionStorage: { getItem: () => null, setItem() {} },
    location: { href: `${SCOPE}#/`, reload() { reloaded = true; } },
    navigator: {
      serviceWorker: {
        controller: { postMessage() {} },
        addEventListener() {},
        getRegistrations: async () => regs,
      },
    },
  };
  context.window = context;
  vm.runInNewContext(script, context);
  await settle();
  assert.deepEqual(regs.filter((r) => r.gone).map((r) => r.scope).sort(), [...REG_OURS].sort());
  assert.deepEqual([...caches.names].sort(), [...THEIRS].sort());
  assert.equal(reloaded, true);
});

test("the service worker purge skips caches that are not English Quest's", () => {
  const sw = fs.readFileSync(path.join(root, "web/src/sw.ts"), "utf8");
  assert.match(sw, /import \{ isOwnCache \} from "\.\/cache-scope\.mjs"/);
  assert.match(sw, /if \(!isOwnCache\(key, scope\)\) return;/);
});

test("no clean-up path deletes every cache or unregisters every worker", () => {
  for (const file of [...KILL_SWITCHES, "web/index.html", "web/src/sw.ts"]) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    assert.equal(/keys\.map\(function \(key\) \{ return caches\.delete\(key\); \}\)/.test(text), false, `${file} deletes every cache`);
    assert.equal(/regs\.map\(function \(reg\) \{ return reg\.unregister\(\); \}\)/.test(text), false, `${file} unregisters every worker`);
  }
});
