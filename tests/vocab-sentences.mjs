// The vocab cards once carried generator slot-fills ("I misplaced my price after lunch.",
// "Please sparkle the form carefully."). These tests keep them, and their templates, out.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/removed-sentences.json"), "utf8"));

const norm = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function sentences(item) {
  return [
    ["example", item.example],
    ...(item.examples || []).map((ex, i) => [`ex${i}`, ex.en]),
    ...(item.miniDialogue || []).map((turn, i) => [`md${i}`, turn.en]),
  ];
}

test("removed generator sentences do not come back", () => {
  const removed = new Set(fixture.removed);
  const found = [];
  for (const item of lex.items) {
    for (const [where, text] of sentences(item)) if (removed.has(norm(text))) found.push(`${item.id} ${where}: ${text}`);
  }
  assert.deepEqual(found, []);
});

test("no sentence fits a generator template with another headword", () => {
  const frames = fixture.frames.map((frame) => [
    frame,
    new RegExp(`^${frame.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("@", "[a-z0-9' ]+?")}$`),
  ]);
  const found = [];
  for (const item of lex.items) {
    for (const [where, text] of sentences(item)) {
      const hit = frames.find(([, re]) => re.test(norm(text)));
      if (hit) found.push(`${item.id} ${where}: "${text}" fits "${hit[0]}"`);
    }
  }
  assert.deepEqual(found, [], "write a real sentence for this card instead of filling a template");
});

test("every example uses its headword", () => {
  const tokens = (text) => norm(text).split(" ").filter(Boolean);
  const stem = (word) => word.slice(0, Math.max(3, word.length - 2));
  const missing = [];
  for (const item of lex.items) {
    const lemma = tokens(item.lemma);
    for (const [index, ex] of (item.examples || []).entries()) {
      const words = tokens(ex.en);
      const ok = words.some((_, i) => lemma.every((part, j) => words[i + j] && words[i + j].startsWith(stem(part))));
      if (!ok) missing.push(`${item.id} ex${index}: ${ex.en}`);
    }
  }
  assert.deepEqual(missing, []);
});
