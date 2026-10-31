import assert from "node:assert/strict";
import test from "node:test";
import { karaokeSpans, stressSplit, syllableCount } from "../web/src/stress.mjs";

test("stress split marks the CMU primary syllable", () => {
  const parts = stressSplit(["in", "voice"], 2);
  assert.deepEqual(parts.map((part) => part.stressed), [false, true]);
  assert.equal(parts.find((part) => part.stressed).text, "voice");
  assert.equal(stressSplit(["the"], 0)[0].stressed, false);
  assert.equal(syllableCount("voice"), 1);
  assert.equal(syllableCount("invoice"), 2);
});

test("karaoke gives each syllable an equal slice of the clip", () => {
  const spans = karaokeSpans("in voice", 3);
  assert.equal(spans.length, 2);
  assert.equal(spans[0].word, "in");
  assert.equal(spans[1].word, "voice");
  assert.ok(Math.abs(spans[0].end - 1.5) < 1e-9);
  assert.ok(Math.abs(spans[1].end - 3) < 1e-9);
  assert.ok(spans[0].end <= spans[1].start + 1e-9);
});
