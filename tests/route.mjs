// A hash that is not valid percent-encoding must not throw while the app renders
// (review finding 8): #/lesson/%, #/word/%E0%A4%A, #/vocab/%/quiz open the path.
// Every valid route parses exactly as before.
import assert from "node:assert/strict";
import test from "node:test";
import { parseRoute, safeDecode } from "../web/src/route.mjs";

test("valid routes parse as before", () => {
  const cases = [
    ["", { name: "path" }],
    ["#", { name: "path" }],
    ["#/", { name: "path" }],
    ["#/onboarding", { name: "onboarding" }],
    ["#/review", { name: "review" }],
    ["#/words", { name: "words" }],
    ["#/profile", { name: "profile" }],
    ["#/attributions", { name: "attributions" }],
    ["#/settings", { name: "settings" }],
    ["#/daily", { name: "daily" }],
    ["#/vocab", { name: "vocab" }],
    ["#/vocab/a1-core", { name: "vocab", deckId: "a1-core", quiz: false }],
    ["#/vocab/a1-core/quiz", { name: "vocab", deckId: "a1-core", quiz: true }],
    ["#/lesson/F1", { name: "lesson", id: "F1" }],
    ["#/lesson/F1?from=daily", { name: "lesson", id: "F1" }],
    ["#/word/gold-noun", { name: "word", id: "gold-noun" }],
    ["#/word/caf%C3%A9-noun", { name: "word", id: "café-noun" }],
    ["#/somewhere-else", { name: "path" }],
  ];
  for (const [hash, want] of cases) assert.deepEqual(parseRoute(hash), want, hash);
});

test("broken percent-encoding opens the path instead of throwing", () => {
  for (const hash of ["#/lesson/%", "#/lesson/%E0%A4%A", "#/word/%", "#/word/abc%ZZ", "#/vocab/%", "#/vocab/%/quiz"]) {
    assert.doesNotThrow(() => parseRoute(hash), hash);
    assert.deepEqual(parseRoute(hash), { name: "path" }, hash);
  }
});

test("safeDecode returns null only for invalid encoding", () => {
  assert.equal(safeDecode("F1"), "F1");
  assert.equal(safeDecode("%41"), "A");
  assert.equal(safeDecode("%"), null);
  assert.equal(safeDecode("%E0%A4%A"), null);
});
