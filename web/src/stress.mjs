/** Syllable stress and karaoke timings.
 * `stress` is the 1-based syllable whose CMUdict vowel carries primary stress (digit 1).
 * 0 means the word has no primary stress.
 */

export function stressSplit(syllables, stress) {
  const parts = [];
  for (let i = 0; i < syllables.length; i += 1) {
    const text = String(syllables[i] || "");
    const stressed = Number(stress) > 0 && i + 1 === Number(stress);
    parts.push({ text, stressed });
  }
  return parts;
}

export function syllableCount(word) {
  const cleaned = String(word).toLowerCase().replace(/[^a-z']/g, "");
  if (!cleaned) return 1;
  const trimmed = cleaned.replace(/e$/, "");
  const groups = trimmed.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Equal time per syllable. Word spans cover the whole clip. */
export function karaokeSpans(text, durationSec) {
  const words = String(text).match(/[A-Za-z']+/g) || [];
  const counts = words.map((word) => syllableCount(word));
  const total = counts.reduce((sum, n) => sum + n, 0) || 1;
  const duration = Number(durationSec) > 0 ? Number(durationSec) : 0;
  let cursor = 0;
  return words.map((word, index) => {
    const width = duration * (counts[index] / total);
    const span = { word, start: cursor, end: cursor + width };
    cursor += width;
    return span;
  });
}
