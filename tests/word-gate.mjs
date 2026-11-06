// The word-clip gate in scripts/check_audio_asr.py (review of #39):
// - compare_word passes only an exact match (after the listed spelling variants) or
//   a reviewed homophone: no similarity score, so water heard as "waiter" fails;
// - --changed re-checks word clips whose gate changed (a homophone, the checker or
//   the word voice), although their text and mp3 did not.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const py = (code) =>
  JSON.parse(execFileSync("python3", ["-c", `import sys, json; sys.path.insert(0, "scripts"); import check_audio_asr as ca\n${code}`], { cwd: root, encoding: "utf8" }));

test("a different word is never a match, however close the spelling", () => {
  const out = py(`print(json.dumps({h: ca.compare_word(w, h, []) for w, h in [
    ("water", "waiter"), ("price", "prize"), ("cold", "could"), ("gold", "goal"), ("the", "that"),
    ("water", "Water."), ("flavour", "Flavor"), ("jewellery", "jewelry"), ("window seat", "Window seat."),
  ]}))`);
  for (const miss of ["waiter", "prize", "could", "goal", "that"]) assert.ok(out[miss].length, `${miss} must fail`);
  for (const hit of ["Water.", "Flavor", "jewelry", "Window seat."]) assert.deepEqual(out[hit], [], `${hit} must pass`);
});

test("only a reviewed homophone passes, and a card's own entry stays with that card", () => {
  const out = py(`t = ca.homophones()
print(json.dumps([
  ca.compare_word("tea", "T", ca.alternates("tea", "tea-noun", t)),
  ca.compare_word("bass", "base", ca.alternates("bass", "bass-noun-pitch", t)),
  ca.compare_word("bass", "base", ca.alternates("bass", "bass-noun-fish", t)),
  ca.compare_word("pearl", "purl", []),
]))`);
  assert.deepEqual(out[0], []);
  assert.deepEqual(out[1], []);
  assert.ok(out[2].length, "the fish card does not get the pitch card's homophone");
  assert.ok(out[3].length, "without the list, purl is not pearl");
});

test("changing the gate re-checks the word clips it affects", () => {
  const out = py(`old = ca._homophone_table({"words": {"pearl": ["purl"], "tea": ["t"]}, "cards": {}})
new = ca._homophone_table({"words": {"tea": ["t"]}, "cards": {}})
pearl = {"word": True, "text": "pearl", "where": "pearl-noun word"}
tea = {"word": True, "text": "tea", "where": "tea-noun word"}
sentence = {"word": False, "text": "This is a pearl.", "where": "pearl-noun main"}
print(json.dumps([
  ca.word_recheck(pearl, old, new, False), ca.word_recheck(tea, old, new, False),
  ca.word_recheck(tea, new, new, True), ca.word_recheck(sentence, old, new, True),
]))`);
  assert.deepEqual(out, [true, false, true, false]);
});
