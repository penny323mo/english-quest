// Each [[phoneme]] override in a `say` string must spell the word it replaces.
// The audit found 43 strings where another card's override (platinum, bracelet, karat,
// natural, ...) had been pasted over the headword, or where words were dropped.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const lines = JSON.parse(fs.readFileSync(path.join(root, "content/lines.json"), "utf8"));

const norm = (ipa) => ipa.replace(/[/ˈˌ.\s[\]]/gu, "").replace(/ɝ/gu, "ɜɹ").replace(/ɚ/gu, "əɹ");
const ipaOf = new Map();
for (const item of lex.items) {
  const key = item.lemma.toLowerCase().replace(/-/g, " ");
  if (!ipaOf.has(key)) ipaOf.set(key, new Set());
  ipaOf.get(key).add(norm(item.ipa));
}
// Weak and stressed forms of function words that the cards teach on purpose.
const FUNCTION = {
  of: ["əv", "ʌv"], can: ["kən"], for: ["fɚ", "fəɹ"], to: ["tə"], a: ["ə"], the: ["ðə", "ði"],
  and: ["ən", "ənd"], on: ["ɔn", "ɑn"], at: ["ət"],
};

function similar(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return 1 - dp[a.length][b.length] / Math.max(a.length, b.length, 1);
}

function candidates(words) {
  const key = words.join(" ").toLowerCase();
  const out = new Set(ipaOf.get(key) || []);
  if (words.length === 1 && FUNCTION[key]) for (const f of FUNCTION[key]) out.add(f);
  const parts = words.map((w) => [...(ipaOf.get(w.toLowerCase()) || FUNCTION[w.toLowerCase()] || [])][0]);
  if (parts.every(Boolean)) out.add(parts.join(""));
  // plural or possessive of a known word
  if (words.length === 1 && /s$/i.test(key)) for (const x of ipaOf.get(key.replace(/'?s$/, "")) || []) out.add(`${x}z`).add(`${x}s`);
  return out;
}

const tokens = (text) => text.match(/\[\[[^\]]+\]\]|[A-Za-z][A-Za-z'-]*/g) || [];

// Align say against en: every non-override token must match in order, and each
// override must stand in for a run of en words it plausibly spells.
function problems(en, say) {
  const a = tokens(en).flatMap((t) => t.split("-"));
  const b = tokens(say).flatMap((t) => (t.startsWith("[[") ? [t] : t.split("-")));
  const out = [];
  let i = 0;
  for (let j = 0; j < b.length; j += 1) {
    const tok = b[j];
    if (!tok.startsWith("[[")) {
      if (a[i]?.toLowerCase() !== tok.toLowerCase()) return [`text differs at "${tok}" (en has "${a[i] ?? ""}")`];
      i += 1;
      continue;
    }
    const nextPlain = b.slice(j + 1).find((t) => !t.startsWith("[["));
    const parts = tok.slice(2, -2).trim().split(/\s+/).length;
    const fits = (k) => (nextPlain ? a[k]?.toLowerCase() === nextPlain.toLowerCase() : k === a.length);
    let stop = fits(i + parts) ? i + parts
      : nextPlain ? a.findIndex((w, k) => k > i && w.toLowerCase() === nextPlain.toLowerCase()) : a.length;
    // consecutive overrides share the run one word each
    const overridesAhead = b.slice(j + 1).findIndex((t) => !t.startsWith("[["));
    const following = overridesAhead === -1 ? b.length - j - 1 : overridesAhead;
    if (stop === -1) return [`text differs after ${tok}`];
    if (following > 0) stop = Math.min(stop, i + 1);
    const words = a.slice(i, stop);
    const ov = norm(tok.slice(2, -2));
    const cands = candidates(words);
    const known = [...cands].length > 0;
    const ok = [...cands].some((x) => similar(ov, x) >= 0.7 && ov.length / Math.max(1, x.length) >= 0.7);
    if (words.length === 0) out.push(`${tok} replaces nothing`);
    else if (known && !ok) out.push(`${tok} does not spell "${words.join(" ")}"`);
    else if (!known && words.length !== parts) out.push(`${tok} swallows "${words.join(" ")}"`);
    i = stop;
  }
  if (i !== a.length) out.push(`say drops "${a.slice(i).join(" ")}"`);
  return out;
}

test("phoneme overrides spell the word they replace and drop nothing", () => {
  const failures = [];
  const visit = (id, en, say) => {
    if (!say || say === en) return;
    for (const p of problems(en, say)) failures.push(`${id}: ${p} | ${say}`);
  };
  for (const item of lex.items) {
    visit(`${item.id} main`, item.example, item.say);
    for (const [i, ex] of (item.examples || []).entries()) visit(`${item.id} e${i}`, ex.en, ex.say);
    for (const [i, turn] of (item.miniDialogue || []).entries()) visit(`${item.id} md${i}`, turn.en, turn.say);
  }
  for (const line of lines) visit(line.id, line.text, line.say);
  assert.deepEqual(failures, []);
});

test("the override check catches the audit's corrupted strings", () => {
  assert.notDeepEqual(problems("This ring is too expensive.", "This ring is too [[plˈætənəm]]."), []);
  assert.notDeepEqual(problems("My wrist is still sore.", "My [[bɹˈeɪslət]] is still sore."), []);
  assert.notDeepEqual(problems("Please sign the refund form.", "Please sign the [[ɹˈifˌʌnd]]."), []);
  assert.notDeepEqual(problems("Sauce on the side, please.", "Sauce [[ˈɔn]], please."), []);
  assert.notDeepEqual(problems("Wine starts with /w/.", "[[wˈaɪn]]"), []);
  assert.deepEqual(problems("Please sign the refund form.", "Please sign the [[ɹˈifˌʌnd]] form."), []);
  assert.deepEqual(problems("A pair of earrings.", "A pair [[əv]] earrings."), []);
  assert.deepEqual(problems("Yesterday I read the book.", "Yesterday I [[ɹˈɛd]] the book."), []);
});

test("no clip text asks the voice to read IPA aloud", () => {
  const failures = [];
  const ipa = /\/[^/\s]{1,4}\//u;
  for (const item of lex.items) {
    if (ipa.test(item.example)) failures.push(`${item.id} main`);
    for (const [i, ex] of (item.examples || []).entries()) if (ipa.test(ex.en)) failures.push(`${item.id} e${i}`);
    for (const [i, turn] of (item.miniDialogue || []).entries()) if (ipa.test(turn.en)) failures.push(`${item.id} md${i}`);
  }
  for (const line of lines) if (!line.runtimeTts && ipa.test(line.text)) failures.push(line.id);
  assert.deepEqual(failures, []);
});

test("roleplay text is what its audio says", () => {
  const byAudio = new Map(lines.map((line) => [line.audio, line]));
  const failures = [];
  for (const name of fs.readdirSync(path.join(root, "content/lessons"))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(root, "content/lessons", name), "utf8"));
    for (const [i, turn] of lesson.roleplay.turns.entries()) {
      const heard = byAudio.get(turn.audio);
      const model = byAudio.get(turn.modelAudio);
      if (heard && heard.text !== turn.line) failures.push(`${lesson.id} turn ${i} line`);
      if (model && model.text !== turn.expect) failures.push(`${lesson.id} turn ${i} expect`);
    }
  }
  assert.deepEqual(failures, []);
});
