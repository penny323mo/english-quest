// GitHub Pages serves every project of an account from one origin
// (penny323mo.github.io/<project>/). Cache Storage and service worker
// registrations belong to the whole origin, so "delete every cache" or
// "unregister every worker" would also wipe other apps on it (review finding 3).
//
// English Quest owns only:
// - caches whose name starts with "eq-" (its offline page copy, eq-shell-v1);
// - Workbox caches made by a worker at or under its scope
//   (workbox-precache-v2-https://…/english-quest/, workbox-runtime-…);
// - service worker registrations at or under its own scope.
//
// The same rules are written out inline in web/index.html and the kill-switch
// workers in public/, which cannot import this module; tests/cache-scope.mjs
// runs those copies against the same cases.

export const OWN_CACHE_PREFIX = "eq-";

/**
 * @param {string} name  a Cache Storage name
 * @param {string} scope  this app's scope URL, e.g. https://host/english-quest/
 */
export function isOwnCache(name, scope) {
  if (typeof name !== "string") return false;
  if (name.indexOf(OWN_CACHE_PREFIX) === 0) return true;
  if (!scope || name.indexOf("workbox-") !== 0) return false;
  // Workbox names end with the worker's scope: this app's scope or one under it.
  return name.indexOf(`-${scope}`) !== -1;
}

/**
 * @param {string} registrationScope  a ServiceWorkerRegistration's scope
 * @param {string} scope  this app's scope URL
 */
export function isOwnRegistration(registrationScope, scope) {
  return Boolean(scope) && typeof registrationScope === "string" && registrationScope.indexOf(scope) === 0;
}
