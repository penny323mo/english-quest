// Word-only clips for 每日抽卡: every visible card has one (normal and slow), it says
// the lemma (or the lemma's reviewed [[phoneme]] override), and the card plays it.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const lex = read("content/lexicon.json");
const words = read("content/word-audio.json").items;

const skip = new Set(read("content/word-audio-skip.json").ids);

test("every visible card has a word clip unless no take passed the ASR gate; hidden cards have none", () => {
  const visible = lex.items.filter((item) => !item.hidden);
  for (const id of skip) assert.ok(visible.some((item) => item.id === id), `${id} in the skip list is not a visible card`);
  assert.equal(Object.keys(words).length, visible.length - skip.size);
  assert.ok(skip.size < visible.length / 2, `${skip.size} cards without a word clip`);
  for (const item of visible) {
    if (skip.has(item.id)) {
      assert.equal(words[item.id], undefined, item.id);
      continue;
    }
    const row = words[item.id];
    assert.ok(row, item.id);
    assert.equal(row.audio, `assets/audio/words/${item.id}-word.mp3`);
    assert.equal(row.audioSlow, `assets/audio/words/${item.id}-word-slow.mp3`);
    for (const rel of [row.audio, row.audioSlow]) assert.ok(fs.statSync(path.join(root, rel)).size > 400, rel);
    if (!row.say.includes("[[")) assert.equal(row.say, item.lemma, item.id);
  }
});

test("every word without a clip is listed for Penny's ear check, with its last take to play (the app does not play it)", () => {
  const doc = fs.readFileSync(path.join(root, "review/word-audio-ear-check.md"), "utf8");
  for (const id of skip) {
    assert.ok(doc.includes(`\`${id}\``), `${id} is not in review/word-audio-ear-check.md`);
    for (const rel of [`assets/audio/words/${id}-word.mp3`, `assets/audio/words/${id}-word-slow.mp3`]) {
      assert.ok(fs.existsSync(path.join(root, rel)), `${rel}: no take to listen to`);
    }
  }
});

test("every card can be drawn; one without a checked word clip shows no word 🔊", () => {
  const src = fs.readFileSync(path.join(root, "web/src/Daily.tsx"), "utf8");
  assert.match(src, /const pool = lexicon\.items\.map\(\(item\) => item\.id\);/);
  assert.match(src, /drawDaily\(\{ date, preferred, pool, history \}\)/);
  assert.match(src, /\{clip \? \(\s*<button className="btn" type="button" aria-label=\{`聽 \$\{item\.lemma\}`\}/);
});

test("the card's 🔊 plays the word clip and the back plays the existing sentence clip", () => {
  const src = fs.readFileSync(path.join(root, "web/src/Daily.tsx"), "utf8");
  assert.match(src, /playAsset\(clip\.audio\)/);
  assert.match(src, /playAsset\(item\.audio\)/);
});
