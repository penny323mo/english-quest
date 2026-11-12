import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = [
  ["W9", "approved", "approved 係「批核咗」，呢度講緊假期申請。"],
  ["W10", "delay", "delay 係「延誤」；apology 先係「道歉」。"],
  ["J18", "water-resistant", "water-resistant 係有一定防水能力；實際防水程度要睇產品標示。"],
  ["T1", "show", "show 開頭係 /ʃ/；check 開頭係 /tʃ/；ticket 開頭係 /t/。"],
];

// Regression cases observed in the live app on 2026-11-12. A correct answer
// must explain that answer, not the first distractor or an unrelated sound.
for (const [id, answer, explanation] of cases) {
  test(`${id} quiz feedback explains ${answer} accurately`, () => {
    const lesson = JSON.parse(fs.readFileSync(path.join(root, "content/lessons", `${id.toLowerCase()}.json`), "utf8"));
    const question = lesson.quiz[4];
    assert.equal(question.choices[question.answer], answer);
    assert.equal(question.explain, explanation);
  });
}

test("the original T1 content emitter preserves the corrected sound explanation", () => {
  const emitter = fs.readFileSync(path.join(root, "scripts/emit_content.py"), "utf8");
  assert.ok(emitter.includes(cases[3][2]));
  assert.ok(!emitter.includes("check 同 ticket 係 /tʃ/"));
});
