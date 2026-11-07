/**
 * Word-card extras: the third example and the mini-dialogue clips that a word card
 * only shows under 更多 (assets/audio/words/<id>-ex<n>.mp3 and -md<n>.mp3, with
 * their -slow takes). They are about 60% of all audio, and no lesson plays them.
 *
 * Precaching them made a first visit download ~190 MB in the background, on mobile
 * data too. They stay in the build manifest (so each keeps its revision) but the
 * worker caches one only when it is first played. A re-rendered clip gets a new
 * revision, a new cache key, and the stale copy is purged on activate, so a
 * pronunciation fix is never stuck behind an old copy.
 */

export const EXTRAS_CACHE = "eq-word-extras-v1";

const EXTRA = /(?:^|\/)assets\/audio\/words\/[^/]+-(?:ex[3-9]|ex\d{2,}|md\d+)(?:-slow)?\.mp3$/;

/** @param {string} url  an absolute URL or a path */
export function isExtraClip(url) {
  if (typeof url !== "string") return false;
  const path = url.split(/[?#]/)[0];
  return EXTRA.test(path);
}

/**
 * @param {string} url  absolute URL without a query
 * @param {string | null | undefined} revision
 */
export function extraKey(url, revision) {
  return revision ? `${url}?__WB_REVISION__=${encodeURIComponent(revision)}` : url;
}

/**
 * @param {string[]} cachedUrls  request URLs in the extras cache
 * @param {Iterable<string>} keepKeys  the current manifest's keys for extras
 * @returns {string[]} cached URLs to delete
 */
export function planExtrasPurge(cachedUrls, keepKeys) {
  const keep = new Set(keepKeys);
  return cachedUrls.filter((url) => !keep.has(url));
}
