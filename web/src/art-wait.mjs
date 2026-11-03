/** Longest the Hook waits for hero and cast art before its button works anyway. */
export const ART_WAIT_MS = 2500;

/**
 * Wait for images to decode. Each image settles on decode, on error, or when
 * the overall timeout fires, so one failed image can never block the caller.
 *
 * @param {string[]} urls
 * @param {{ minWidth?: number, timeoutMs?: number, makeImage: () => any, setTimer?: (fn: () => void, ms: number) => unknown }} options
 * @returns {Promise<void>}
 */
export function waitForImages(urls, { minWidth = 1, timeoutMs = ART_WAIT_MS, makeImage, setTimer = setTimeout }) {
  const jobs = urls.filter(Boolean).map((url) => new Promise((resolve) => {
    const img = makeImage();
    const finish = () => resolve(undefined);
    const decoded = () => {
      const pending = typeof img.decode === "function" ? img.decode() : Promise.resolve();
      pending.then(finish, finish);
    };
    img.onload = decoded;
    img.onerror = finish;
    img.decoding = "async";
    img.src = url;
    if (img.complete && img.naturalWidth >= minWidth) decoded();
  }));
  const all = Promise.all(jobs).then(() => undefined);
  const timeout = new Promise((resolve) => setTimer(() => resolve(undefined), timeoutMs));
  return Promise.race([all, timeout]);
}
