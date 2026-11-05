// Hash routes (#/lesson/F1, #/word/gold-noun, #/vocab/deck/quiz). Pure so node tests
// can import it. A hash that is not valid percent-encoding (#/lesson/% from a broken
// link or a typo) opens the path instead of throwing while the app renders
// (review finding 8).

/** decodeURIComponent, or null when the text is not valid percent-encoding. */
export function safeDecode(text) {
  try {
    return decodeURIComponent(text);
  } catch {
    return null;
  }
}

/** @param {string} hash */
export function parseRoute(hash) {
  const path = (String(hash || "").replace(/^#/, "") || "/").split("?")[0];
  if (path === "/" || path === "") return { name: "path" };
  if (path === "/onboarding") return { name: "onboarding" };
  if (path === "/review") return { name: "review" };
  if (path === "/words") return { name: "words" };
  if (path === "/profile") return { name: "profile" };
  if (path === "/attributions") return { name: "attributions" };
  if (path === "/settings") return { name: "settings" };
  if (path === "/daily") return { name: "daily" };
  if (path === "/vocab") return { name: "vocab" };
  const vocab = path.match(/^\/vocab\/([^/]+)(\/quiz)?$/);
  if (vocab) {
    const deckId = safeDecode(vocab[1]);
    return deckId === null ? { name: "path" } : { name: "vocab", deckId, quiz: Boolean(vocab[2]) };
  }
  if (path.startsWith("/lesson/")) {
    const id = safeDecode(path.slice("/lesson/".length));
    return id === null ? { name: "path" } : { name: "lesson", id };
  }
  if (path.startsWith("/word/")) {
    const id = safeDecode(path.slice("/word/".length));
    return id === null ? { name: "path" } : { name: "word", id };
  }
  return { name: "path" };
}
