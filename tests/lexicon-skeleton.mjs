import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const uncountable = new Set("gold water cash jewellery luggage money furniture information advice".split(" "));

const PERSONS = new Set(
  "mei tom kai ling vera quinn dana una otto iris fran opal hugh ned liam tess ruth paul mae hope yao joel cora ann ben mina sam lee jo pat kim robin alex chris jamie taylor morgan casey drew".split(" "),
);
const PLACES = new Set(
  "window counter shelf box chair plant door table lamp drawer hall reception desk lobby station airport hotel shop store kitchen bathroom bedroom office bank clinic pharmacy restaurant cafe market street lane courtyard balcony elevator lift corridor warehouse basement attic garage patio garden park beach harbour harbor pier gate terminal carousel scanner belt booth till tray suitcase cabin passport trolley cart aisle stall plaza mall museum theatre theater cinema library classroom campus hostel dormitory apartment flat studio suite room front back side left right upstairs downstairs outdoor indoor kettle".split(" "),
);
const TIMES = new Set(
  "monday tuesday wednesday thursday friday saturday sunday noon midnight lunch dinner breakfast brunch yesterday tomorrow tonight morning afternoon evening weekend today week month year january february march april may june july august september october november december hour minute second oclock six seven eight nine ten eleven twelve one two three four five".split(" "),
);

function tokens(sample) {
  return String(sample).toLowerCase().replace(/[.?!,;:"']/g, " ").replace(/-/g, " ").split(/\s+/).filter(Boolean);
}

function sameWord(hay, needle) {
  if (hay === needle || hay === `${needle}s` || hay === `${needle}es`) return true;
  if (hay === `${needle}ed` || hay === `${needle}d` || hay === `${needle}ing`) return true;
  const last = needle[needle.length - 1];
  return hay === `${needle}${last}ed`;
}

function stripLemma(hay, lemma) {
  const needle = tokens(lemma);
  if (!needle.length) return hay;
  outer: for (let i = 0; i <= hay.length - needle.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) if (!sameWord(hay[i + j], needle[j])) continue outer;
    return hay.slice(0, i).concat(hay.slice(i + needle.length));
  }
  return hay;
}

function rawSkeleton(text, lemma) {
  const left = stripLemma(tokens(text), lemma).filter((tok) => tok !== "a" && tok !== "an" && tok !== "the");
  if (left.length < 2) return null;
  return left.join(" ");
}

function normalisedSkeleton(text, lemma) {
  const out = [];
  for (const tok of stripLemma(tokens(text), lemma)) {
    if (tok === "a" || tok === "an" || tok === "the") continue;
    if (PERSONS.has(tok)) out.push("PERSON");
    else if (TIMES.has(tok)) out.push("TIME");
    else if (PLACES.has(tok)) out.push("PLACE");
    else out.push(tok);
  }
  const collapsed = [];
  for (const tok of out) {
    if (collapsed.length && collapsed[collapsed.length - 1] === tok && (tok === "PERSON" || tok === "PLACE" || tok === "TIME")) continue;
    collapsed.push(tok);
  }
  if (collapsed.length < 2) return null;
  return collapsed.join(" ");
}

test("a third-example raw skeleton is shared by at most two lemmas", () => {
  const groups = new Map();
  for (const item of lex.items) {
    const examples = item.examples || [];
    if (examples.length < 3) continue;
    const key = rawSkeleton(examples[2].en, item.lemma);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(item.id);
  }
  for (const [key, ids] of groups) assert.ok(ids.size <= 2, `${key} x${ids.size}`);
});

test("a normalised skeleton is shared by at most three lemmas", () => {
  const groups = new Map();
  for (const item of lex.items) {
    const samples = [];
    if (item.example) samples.push(item.example);
    for (const example of item.examples || []) samples.push(example.en);
    for (const turn of item.miniDialogue || []) samples.push(turn.en);
    for (const sample of samples) {
      if (!sample) continue;
      const key = normalisedSkeleton(sample, item.lemma);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(item.id);
    }
  }
  for (const [key, ids] of groups) assert.ok(ids.size <= 3, `${key} x${ids.size}`);
});

test("a and an do not introduce an uncountable", () => {
  for (const item of lex.items) {
    const samples = [item.example, ...(item.examples || []).map((example) => example.en), ...(item.miniDialogue || []).map((turn) => turn.en)];
    for (const sample of samples) {
      if (!sample) continue;
      const row = tokens(sample);
      for (let i = 0; i < row.length - 1; i += 1) {
        if ((row[i] === "a" || row[i] === "an") && uncountable.has(row[i + 1])) {
          assert.fail(`${item.id} ${sample}`);
        }
      }
    }
  }
});

test("banned example and dialogue templates stay gone", () => {
  const bannedEx = [/People often say/i, /In this lesson,/i, /beside the \w+ tray/i];
  const bannedMd = [/Is this the .+ for the .+ task/i];
  for (const item of lex.items) {
    for (const ex of item.examples || []) {
      for (const re of bannedEx) assert.equal(re.test(ex.en || ""), false, `${item.id} ${ex.en}`);
    }
    for (const turn of item.miniDialogue || []) {
      for (const re of bannedMd) assert.equal(re.test(turn.en || ""), false, `${item.id} ${turn.en}`);
    }
    assert.equal(JSON.stringify(item).includes("俾"), false, `${item.id} has 俾`);
  }
});
