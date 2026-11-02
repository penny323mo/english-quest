import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));

const PERSONS = new Set(
  "mei tom kai ling vera quinn dana una otto iris fran opal hugh ned liam tess ruth paul mae hope yao joel cora ann ben mina sam lee jo pat kim robin alex chris jamie taylor morgan casey drew".split(" "),
);
const PLACES = new Set(
  "window counter shelf box chair plant door table lamp drawer hall reception desk lobby station airport hotel shop store kitchen bathroom bedroom office bank clinic pharmacy restaurant cafe market street lane courtyard balcony elevator lift corridor warehouse basement attic garage patio garden park beach harbour harbor pier gate terminal carousel scanner belt booth till tray suitcase cabin passport trolley cart aisle stall plaza mall museum theatre theater cinema library classroom campus hostel dormitory apartment flat studio suite room front back side left right upstairs downstairs outdoor indoor kettle".split(" "),
);
const TIMES = new Set(
  "monday tuesday wednesday thursday friday saturday sunday noon midnight lunch dinner breakfast brunch yesterday tomorrow tonight morning afternoon evening weekend today week month year january february march april may june july august september october november december hour minute second oclock six seven eight nine ten eleven twelve one two three four five".split(" "),
);

const MODALS = new Set("can could should will would may might must shall".split(" "));
// Base-form verbs whose spelling ends in -ed. They are not past tense.
const BASE_ED = new Set("need exceed proceed succeed bleed feed seed heed speed plead knead shred embed".split(" "));
// Past forms that are not also the base form. Invariant verbs (cut, put, let, set, beat, split, …)
// are omitted because "can split" and "will beat" are grammatical.
const IRREGULAR_PAST = new Set(
  "was were been had did went came saw took got made said told knew thought felt became began brought bought caught chose drew drank drove ate fell found flew forgot gave grew heard held kept left lost meant met paid ran rode rose sat slept spoke stood swam taught threw understood wore wrote arose awoke broke hid shook stole woke bent bit bled bred built burnt dealt dug fed fled froze hung knelt laid led lit shot slid spent stung struck swept swung wept won wound".split(" "),
);

function tokens(sample) {
  return String(sample)
    .toLowerCase()
    .replace(/[.?!,;:"']/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sameWord(hay, needle) {
  if (hay === needle || hay === `${needle}s` || hay === `${needle}es`) return true;
  if (hay === `${needle}ed` || hay === `${needle}d` || hay === `${needle}ing`) return true;
  const last = needle[needle.length - 1];
  return hay === `${needle}${last}ed`;
}

function stripAllLemmas(hay, lemma) {
  const needle = tokens(lemma);
  if (!needle.length) return hay;
  let out = hay;
  for (let guard = 0; guard < 8; guard += 1) {
    let idx = -1;
    outer: for (let i = 0; i <= out.length - needle.length; i += 1) {
      for (let j = 0; j < needle.length; j += 1) if (!sameWord(out[i + j], needle[j])) continue outer;
      idx = i;
      break;
    }
    if (idx < 0) break;
    out = out.slice(0, idx).concat(out.slice(idx + needle.length));
  }
  return out;
}

function skeleton(text, lemma) {
  const compact = String(lemma).toLowerCase().replace(/[\s'-]+/g, "");
  const out = [];
  const toks = stripAllLemmas(tokens(text), lemma);
  for (let i = 0; i < toks.length; i += 1) {
    const tok = toks[i];
    if (tok === "a" || tok === "an" || tok === "the") continue;
    if (/^\d+$/.test(tok)) {
      out.push("#");
      continue;
    }
    if (tok === "code") {
      out.push("#");
      if (i + 1 < toks.length) i += 1;
      continue;
    }
    if (tok.length >= 4 && tok.length < compact.length && compact.startsWith(tok)) {
      out.push("#");
      continue;
    }
    if (PERSONS.has(tok) || TIMES.has(tok) || PLACES.has(tok)) {
      out.push("#");
      continue;
    }
    out.push(tok);
  }
  const collapsed = [];
  for (const tok of out) {
    if (tok === "#" && collapsed[collapsed.length - 1] === "#") continue;
    collapsed.push(tok);
  }
  if (collapsed.length < 2) return null;
  return collapsed.join(" ");
}

function englishSamples(item) {
  const samples = [];
  if (item.example) samples.push(["example", item.example]);
  for (const [index, example] of (item.examples || []).entries()) samples.push([`ex${index}`, example.en]);
  for (const [index, turn] of (item.miniDialogue || []).entries()) samples.push([`md${index}`, turn.en]);
  return samples;
}

function cantoneseSamples(item) {
  const samples = [];
  if (item.glossYue) samples.push(["glossYue", item.glossYue]);
  if (item.exampleYue) samples.push(["exampleYue", item.exampleYue]);
  if (item.usageNotes) samples.push(["usageNotes", item.usageNotes]);
  if (item.pitfallsYue) samples.push(["pitfallsYue", item.pitfallsYue]);
  if (item.note) samples.push(["note", item.note]);
  for (const [index, example] of (item.examples || []).entries()) samples.push([`ex${index}.yue`, example.yue || ""]);
  for (const [index, turn] of (item.miniDialogue || []).entries()) samples.push([`md${index}.yue`, turn.yue || ""]);
  return samples;
}

function mandarinMarks(text) {
  const marks = [];
  const stripped = String(text).replaceAll("的士", "Ｘ").replaceAll("目的", "Ｙ");
  if (stripped.includes("的")) marks.push("的");
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "把") continue;
    const prev = text[i - 1] || "";
    if (!"一二兩三四五六七八九十幾呢嗰每成".includes(prev)) marks.push("把");
  }
  return marks;
}

test("mini-dialogues are not echoes", () => {
  const failures = [];
  for (const item of lex.items) {
    const turns = item.miniDialogue || [];
    const seen = new Map();
    for (const [index, turn] of turns.entries()) {
      const key = String(turn.en || "")
        .toLowerCase()
        .replace(/[.?!,;:"']/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!key) continue;
      if (seen.has(key)) failures.push(`${item.id} md${seen.get(key)} = md${index}: ${turn.en}`);
      else seen.set(key, index);
    }
  }
  assert.deepEqual(failures, []);
});

test("a modal is not followed by a past-tense verb", () => {
  const failures = [];
  for (const item of lex.items) {
    for (const [where, sample] of englishSamples(item)) {
      const row = tokens(sample);
      for (let i = 0; i < row.length - 1; i += 1) {
        if (!MODALS.has(row[i])) continue;
        const verb = row[i + 1];
        const regularPast = /.+ed$/.test(verb) && !BASE_ED.has(verb);
        if (regularPast || IRREGULAR_PAST.has(verb)) failures.push(`${item.id} ${where}: ${row[i]} ${verb} :: ${sample}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("cantonese fields do not use mandarin 的 or 把", () => {
  const failures = [];
  for (const item of lex.items) {
    for (const [where, sample] of cantoneseSamples(item)) {
      const marks = mandarinMarks(sample);
      if (marks.length) failures.push(`${item.id} ${where} [${marks.join(",")}] ${sample}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("a slot-stripped skeleton is shared by at most two lemmas", () => {
  const groups = new Map();
  for (const item of lex.items) {
    const seen = new Set();
    for (const [, sample] of englishSamples(item)) {
      if (!sample) continue;
      const key = skeleton(sample, item.lemma);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(item.id);
    }
  }
  const failures = [];
  for (const [key, ids] of groups) {
    if (ids.size > 2) failures.push(`${key} x${ids.size}`);
  }
  failures.sort();
  assert.deepEqual(failures, []);
});
