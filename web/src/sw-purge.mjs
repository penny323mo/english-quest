/**
 * Decide what the service worker deletes from the precache on activate.
 *
 * Workbox stores each precached file under a cache key that carries its
 * revision (…/word.mp3?__WB_REVISION__=abc). Comparing only pathnames kept
 * every old revision of a re-rendered clip forever, so the full key is
 * compared here. An entry whose path is no longer in the manifest at all
 * (an old shell, a removed file) is reported as `shellChanged`, which is what
 * makes open windows reload; a stale revision of a current file is removed
 * quietly.
 *
 * @param {string[]} cachedUrls  request URLs currently in the precache
 * @param {Iterable<string>} keepKeys  full cache keys of the current manifest
 * @returns {{ remove: string[], shellChanged: boolean }}
 */
export function planPrecachePurge(cachedUrls, keepKeys) {
  const keep = new Set(keepKeys);
  const keepPaths = new Set([...keep].map((key) => new URL(key).pathname));
  const remove = [];
  let shellChanged = false;
  for (const url of cachedUrls) {
    if (keep.has(url)) continue;
    remove.push(url);
    if (!keepPaths.has(new URL(url).pathname)) shellChanged = true;
  }
  return { remove, shellChanged };
}
