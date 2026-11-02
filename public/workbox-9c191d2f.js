// Kill switch for the dark-shell worker (3b3e48ff through 6e3cd520^), including round 19 1dfee5cb.
// That worker importScripts this URL. A 404 here aborts Safari's update,
// so the precached dark shell stays in control. This file is also a
// service worker: it drops Cache Storage only, then unregisters and reloads.
(function () {
  function purgeCaches() {
    if (!self.caches || typeof caches.keys !== "function") return Promise.resolve();
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) { return caches.delete(key); }));
    });
  }

  function reloadClients() {
    if (!self.clients || typeof self.clients.matchAll !== "function") return Promise.resolve();
    return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      return Promise.all(list.map(function (client) {
        if (client && typeof client.navigate === "function") return client.navigate(client.url);
        return undefined;
      }));
    });
  }

  var armed = false;
  function killWorker() {
    if (armed) return;
    armed = true;
    self.addEventListener("install", function () { self.skipWaiting(); });
    self.addEventListener("activate", function (event) {
      event.waitUntil(purgeCaches().then(function () {
        if (self.clients && self.clients.claim) return self.clients.claim();
        return undefined;
      }).then(reloadClients).then(function () {
        return self.registration.unregister();
      }));
    });
  }

  function emptyHandler() {
    return Promise.resolve(new Response("", { status: 504, statusText: "gone" }));
  }

  function api() {
    return {
      clientsClaim: function () {
        if (self.clients && self.clients.claim) return self.clients.claim();
        return undefined;
      },
      cleanupOutdatedCaches: function () {},
      precacheAndRoute: function () {},
      registerRoute: function () {},
      createHandlerBoundToURL: function () { return emptyHandler; },
      NavigationRoute: function NavigationRoute() {},
      CacheFirst: function CacheFirst() {},
      ExpirationPlugin: function ExpirationPlugin() {},
      CacheableResponsePlugin: function CacheableResponsePlugin() {},
    };
  }

  // The vite/workbox loader calls define() and throws if this module does not register.
  if (typeof self.define === "function") {
    self.define(["exports"], function (exports) {
      var methods = api();
      for (var key in methods) exports[key] = methods[key];
      killWorker();
    });
    return;
  }

  var inWorker = false;
  try {
    inWorker = typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope;
  } catch (err) {
    inWorker = typeof self.skipWaiting === "function" && typeof Window === "undefined";
  }
  if (inWorker) {
    killWorker();
    return;
  }

  // registerSW.js is a page script on the precached dark shell. If that
  // request misses the cache, unregister the stuck worker and reload once.
  if (typeof navigator !== "undefined" && navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (reg) { return reg.unregister(); }));
    }).then(purgeCaches).then(function () {
      try {
        if (sessionStorage.getItem("eq-reg-kill") === "1") return;
        sessionStorage.setItem("eq-reg-kill", "1");
      } catch (err) {
        return;
      }
      location.reload();
    }).catch(function () {});
  }
})();
