// Guards for the recorded audio:
//  1. every clip was rendered from the text it is shown with (assets/audio/rendered.json),
//  2. every [[phoneme]] override in a `say` stands only for the word it is meant for,
//  3. no voiced text contains IPA in slashes, which the voice reads out as "slash N slash".
// scripts/check_audio_asr.py is the slower check that listens to each clip.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const lex = read("content/lexicon.json");
const lines = read("content/lines.json");
const words = read("content/word-audio.json");
const rendered = read("assets/audio/rendered.json");
const allowed = read("tests/fixtures/say-overrides.json");

const sha = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const renderText = (row, shown) => (typeof row.say === "string" && row.say.length > 0 ? row.say : shown);

/** Every clip, in the same order scripts/render_audio.py renders them. */
function clips() {
  const out = [];
  for (const item of lex.items) {
    out.push({ rel: item.audio, shown: item.example, say: item.say, where: `${item.id} main` });
    for (const [i, ex] of (item.examples || []).entries()) {
      out.push({ rel: ex.audio, shown: ex.en, say: renderText(ex, ex.en), where: `${item.id} ex${i}` });
    }
    for (const [i, turn] of (item.miniDialogue || []).entries()) {
      const rel = turn.audio || `assets/audio/words/${item.id}-md${i}.mp3`;
      out.push({ rel, shown: turn.en, say: renderText(turn, turn.en), where: `${item.id} md${i}` });
    }
  }
  for (const line of lines) out.push({ rel: line.audio, shown: line.text, say: line.say, where: line.id });
  // Word-only clips for 每日抽卡: the card shows the lemma.
  const lemma = Object.fromEntries(lex.items.map((item) => [item.id, item.lemma]));
  for (const [id, row] of Object.entries(words.items)) out.push({ rel: row.audio, shown: lemma[id], say: row.say, where: `${id} word` });
  return out;
}

test("each clip was rendered from its current text", () => {
  const stale = [];
  for (const clip of clips()) {
    if (rendered[clip.rel] !== sha(clip.say)) stale.push(`${clip.where}: ${clip.rel} "${clip.say}"`);
  }
  assert.deepEqual(stale, [], "re-render these with npm run audio");
});

test("clips that share a file share the same text", () => {
  const byRel = new Map();
  const clash = [];
  for (const clip of clips()) {
    const seen = byRel.get(clip.rel);
    if (seen && seen.say !== clip.say) clash.push(`${clip.rel}: ${seen.where} "${seen.say}" vs ${clip.where} "${clip.say}"`);
    if (!seen) byRel.set(clip.rel, clip);
  }
  assert.deepEqual(clash, []);
});

const norm = (text) =>
  text
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Pair each [[override]] in `say` with the words of `shown` it replaces, or null if the rest differs. */
function align(shown, say) {
  const parts = say.split(/\[\[([^\]]+)\]\]/);
  let pattern = "";
  parts.forEach((part, k) => {
    if (k % 2 === 1) pattern += "(.+?)";
    else if (norm(part)) pattern += `\\s?${escape(norm(part))}\\s?`;
    else if (part && !part.trim() && k > 0 && k < parts.length - 1) pattern += " ";
  });
  const m = new RegExp(`^${pattern}$`, "s").exec(norm(shown));
  if (!m) return null;
  return parts.filter((_, k) => k % 2 === 1).map((phonemes, i) => [phonemes, m[i + 1]]);
}

test("each [[phoneme]] override replaces only the word it spells", () => {
  const problems = [];
  for (const clip of clips()) {
    if (!clip.say.includes("[[")) {
      if (norm(clip.say) !== norm(clip.shown)) problems.push(`${clip.where}: say "${clip.say}" ≠ text "${clip.shown}"`);
      continue;
    }
    const pairs = align(clip.shown, clip.say);
    if (!pairs) {
      problems.push(`${clip.where}: say "${clip.say}" does not match text "${clip.shown}" outside its overrides`);
      continue;
    }
    for (const [phonemes, words] of pairs) {
      if (!(allowed[phonemes] || []).includes(words)) {
        problems.push(`${clip.where}: [[${phonemes}]] stands for "${words}" (allowed: ${JSON.stringify(allowed[phonemes] || [])})`);
      }
    }
  }
  assert.deepEqual(problems, [], "fix the say, or add a reviewed pair to tests/fixtures/say-overrides.json");
});

test("no voiced text contains IPA between slashes", () => {
  const ipa = /\/[^/\s]{1,6}\//;
  const found = clips()
    .filter((clip) => ipa.test(clip.say.replace(/\[\[[^\]]+\]\]/g, "")) || ipa.test(clip.shown))
    .map((clip) => `${clip.where}: ${clip.shown}`);
  assert.deepEqual(found, [], "keep IPA in the Cantonese gloss or notes, not in a sentence the voice reads");
});
