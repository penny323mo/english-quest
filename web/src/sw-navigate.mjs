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
export async function navigateNetworkFirst(request, { fetchImpl, cachesImpl, shellUrl, waitUntil, keepPage, onMissingPage }) {
  let response;
  try {
    response = await fetchImpl(request.url, { cache: "no-cache", credentials: "same-origin", redirect: "follow" });
  } catch {
    const cache = await cachesImpl.open(SHELL_CACHE);
    const kept = await cache.match(shellUrl);
    if (kept) return kept;
    onMissingPage?.();
    return new Response(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>情景英文 · 離線學習</title>
<style>body{font:18px/1.6 system-ui,sans-serif;color:#183b39;background:#fffbf2;max-width:34rem;margin:12vh auto;padding:0 1.25rem}button{font:inherit;padding:.6rem 1rem;cursor:pointer}</style>
<main><h1>暫時開唔到離線課程</h1><p>瀏覽器入面搵唔到已下載嘅課程首頁。請連上網絡再試，開返 App 後可以喺設定重新下載課程包。</p>
<form method="get"><button type="submit">重新連線後再試</button></form></main></html>`, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  response = await unredirect(response);
  if (response.ok && isHtml(response)) {
    const copy = response.clone();
    const store = (keepPage ? keepPage(copy) : cachesImpl.open(SHELL_CACHE).then((cache) => cache.put(shellUrl, copy))).catch(() => undefined);
    if (waitUntil) waitUntil(store);
    else await store;
  }
  return response;
}
