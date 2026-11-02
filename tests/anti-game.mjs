import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  copiedGlossViolations,
  lemmaSwapViolations,
  lessonNearDuplicateViolations,
  yesEchoViolations,
} from "./lib/anti-game-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const lessonSource = fs.readFileSync(path.join(root, "tests/lessons.mjs"), "utf8");
const shipped = lessonSource.match(/const shipped = (\[[\s\S]*?\]);/);
const lessonIds = JSON.parse(shipped[1]);
const lessons = lessonIds.map((id) => JSON.parse(fs.readFileSync(path.join(root, "content/lessons", `${id}.json`), "utf8")));
const bad = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/anti-game.json"), "utf8"));

test("a lemma-swap frame shared by three lemmas fails, and the lexicon does not", () => {
  const fixture = lemmaSwapViolations(bad.lemmaSwap);
  assert.ok(fixture.length > 0, "fixture should fail");
  assert.match(fixture.join("\n"), /staff logged this under form x3/);
  assert.deepEqual(lemmaSwapViolations(lex.items), []);
});

test("a lesson frame that only swaps a code fails, and real lessons do not share one", () => {
  const fixture = lessonNearDuplicateViolations(bad.lessons);
  assert.ok(fixture.some((row) => row.startsWith("frame ")), fixture.join("\n"));
  assert.deepEqual(lessonNearDuplicateViolations(lessons), []);
});

test("a Cantonese gloss copied from the English fails, and the real glosses do not", () => {
  const fixture = copiedGlossViolations(bad.glossCopy, []);
  assert.ok(fixture.some((row) => row.includes("not Cantonese")), fixture.join("\n"));
  assert.ok(fixture.some((row) => row.includes("copies the English")), fixture.join("\n"));
  assert.deepEqual(copiedGlossViolations(lex.items, lessons), []);
});

test("lesson checks do not exempt ids", () => {
  const src = fs.readFileSync(path.join(root, "tests/lessons.mjs"), "utf8");
  assert.equal(/staffAllow|qAllow|freqAllow|tailAllow|echoAllow|padAllow/.test(src), false);
  assert.equal(/const allow = new Set\(\[(?:(?!\]\))[\s\S])*?\b[a-z]\d+-l\d+\b/.test(src), false);
  for (const match of src.matchAll(/new Set\(\[([\s\S]*?)\]\)/g)) {
    const body = match[1];
    assert.equal(/\b[a-z]\d+-l\d+\b/.test(body), false, body.slice(0, 120));
  }
});

test("a Yes echo fails even when its id used to be exempt, and real replies add a word", () => {
  const fixture = yesEchoViolations(bad.yesEcho);
  assert.deepEqual(fixture, ["j20-l8 echoes receipt,shows,weight,purity"]);
  assert.deepEqual(yesEchoViolations(lessons), []);
});
