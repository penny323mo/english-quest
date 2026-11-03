/**
 * Page loads (navigations) in the service worker.
 *
 * Online, the page always comes from the network, revalidated past the HTTP
 * cache (GitHub Pages sends max-age=600, which could otherwise hand back an
 * index.html up to ten minutes old). Each good copy is kept in SHELL_CACHE.
 * Only when the network request fails (offline) is that kept copy served.
 * Nothing here touches IndexedDB.
 */
export const SHELL_CACHE = "eq-shell-v1";

/** Safari will not use a redirected response for a navigation; copy it into a clean one. */
async function unredirect(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
}

function isHtml(response) {
  return (response.headers.get("content-type") || "").includes("text/html");
}

/**
 * @param {{ url: string }} request
 * @param {{ fetchImpl: typeof fetch, cachesImpl: CacheStorage, shellUrl: string, waitUntil?: (p: Promise<unknown>) => void }} deps
 * @returns {Promise<Response>}
 */
export async function navigateNetworkFirst(request, { fetchImpl, cachesImpl, shellUrl, waitUntil }) {
  let response;
  try {
    response = await fetchImpl(request.url, { cache: "no-cache", credentials: "same-origin", redirect: "follow" });
  } catch (err) {
    const cache = await cachesImpl.open(SHELL_CACHE);
    const kept = await cache.match(shellUrl);
    if (kept) return kept;
    throw err;
  }
  response = await unredirect(response);
  if (response.ok && isHtml(response)) {
    const copy = response.clone();
    const store = cachesImpl.open(SHELL_CACHE).then((cache) => cache.put(shellUrl, copy)).catch(() => undefined);
    if (waitUntil) waitUntil(store);
    else await store;
  }
  return response;
}
