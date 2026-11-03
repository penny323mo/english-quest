// The six B2 lessons the content audit found incoherent (T20, J23, R17, W14, W15, J24)
// and the 24 cards only they teach are hidden, not deleted: their files stay, the
// learner's saved reviews stay, and nothing on the path, in a deck, or in a review leads to them.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const HIDDEN = ["T20", "J23", "R17", "W14", "W15", "J24"];
const lessonFiles = fs.readdirSync(path.join(root, "content/lessons")).map((name) => read(`content/lessons/${name}`));
const lex = read("content/lexicon.json");
const pathFile = read("content/path.json");
const decks = read("content/decks.json");
const data = fs.readFileSync(path.join(root, "web/src/data.ts"), "utf8");

test("hidden lessons are kept but marked, and only they are", () => {
  const marked = lessonFiles.filter((lesson) => lesson.hidden).map((lesson) => lesson.id).sort();
  assert.deepEqual(marked, [...HIDDEN].sort());
  for (const id of HIDDEN) assert.ok(lessonFiles.find((lesson) => lesson.id === id).dialogue.length > 0, id);
});

test("no path, shipped list or next step leads to a hidden lesson", () => {
  const onPath = pathFile.units.flatMap((unit) => unit.lessons).map((entry) => entry.id);
  const shipped = JSON.parse(data.match(/export const SHIPPED = (\[[^\]]*\])/)[1]);
  for (const id of HIDDEN) {
    assert.equal(onPath.includes(id), false, `${id} on path`);
    assert.equal(shipped.includes(id), false, `${id} shipped`);
  }
  for (const lesson of lessonFiles) {
    if (lesson.hidden) continue;
    assert.equal(HIDDEN.includes(lesson.next), false, `${lesson.id}.next → ${lesson.next}`);
  }
  assert.deepEqual(onPath, shipped);
});

test("cards taught only by hidden lessons are hidden and out of every deck", () => {
  const taught = new Set(lessonFiles.filter((lesson) => !lesson.hidden).flatMap((lesson) => lesson.lemmas));
  const onlyHidden = new Set(lessonFiles.filter((lesson) => lesson.hidden).flatMap((lesson) => lesson.lemmas).filter((id) => !taught.has(id)));
  const hiddenCards = new Set(lex.items.filter((item) => item.hidden).map((item) => item.id));
  assert.deepEqual([...hiddenCards].sort(), [...onlyHidden].sort());
  assert.equal(hiddenCards.size, 24);
  for (const id of taught) assert.equal(hiddenCards.has(id), false, `${id} is taught by a shipped lesson`);
  for (const deck of decks.decks) {
    for (const id of deck.lemmas) assert.equal(hiddenCards.has(id), false, `${deck.id} lists hidden ${id}`);
  }
});

test("the app filters hidden lessons and cards where it loads them", () => {
  assert.match(data, /items: lexAll\.items\.filter\(\(item\) => !item\.hidden\)/);
  assert.match(data, /\.filter\(\(lesson\) => !\(lesson as \{ hidden\?: boolean \}\)\.hidden\)/);
});
