import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const uncountable = new Set("gold water cash jewellery luggage money furniture information advice".split(" "));

function tokens(sample) {
  return String(sample).toLowerCase().replace(/[.?!,;:"']/g, " ").replace(/-/g, " ").split(/\s+/).filter(Boolean);
}

function sameWord(hay, needle) {
  if (hay === needle || hay === `${needle}s` || hay === `${needle}es`) return true;
  if (hay === `${needle}ed` || hay === `${needle}d` || hay === `${needle}ing`) return true;
  const last = needle[needle.length - 1];
  return hay === `${needle}${last}ed`;
}

function skeleton(text, lemma) {
  const needle = tokens(lemma);
  const hay = tokens(text);
  let cut = null;
  outer: for (let i = 0; i <= hay.length - needle.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) if (!sameWord(hay[i + j], needle[j])) continue outer;
    cut = hay.slice(0, i).concat(hay.slice(i + needle.length));
    break;
  }
  const left = (cut || hay).filter((tok) => tok !== "a" && tok !== "an" && tok !== "the");
  if (left.length < 2) return null;
  return left.join(" ");
}

test("an example skeleton is shared by at most two lemmas", () => {
  const groups = new Map();
  for (const item of lex.items) {
    const samples = [...(item.examples || []).map((example) => example.en), ...(item.miniDialogue || []).map((turn) => turn.en)];
    if (!samples.length && item.example) samples.push(item.example);
    else if (item.example) samples.push(item.example);
    for (const sample of samples) {
      const key = skeleton(sample, item.lemma);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(item.id);
    }
  }
  for (const [key, ids] of groups) assert.ok(ids.size <= 2, `${key} x${ids.size}`);
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
