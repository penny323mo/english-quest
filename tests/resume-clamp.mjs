// review/v1-audit.md P1-8: a saved step past a beat's last item opened a blank
// lesson with no buttons. Resume must always land on something the player renders.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { clampResumePoint, itemCounts } from "../web/src/resume.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessons = fs
  .readdirSync(path.join(root, "content/lessons"))
  .map((name) => JSON.parse(fs.readFileSync(path.join(root, "content/lessons", name), "utf8")));

/** Mirrors the render conditions in Lesson.tsx: does this beat/sub show anything? */
function renders(lesson, beat, sub) {
  if (beat === 3) return Boolean(lesson.understand[sub]);
  if (beat === 4) return Boolean(lesson.chunks[sub]);
  if (beat === 6) return Boolean(lesson.build[sub]);
  if (beat === 7) return Boolean(lesson.roleplay.turns[sub]);
  if (beat === 8) return Boolean(lesson.quiz[sub]);
  return beat >= 0 && beat <= 11;
}

test("a step past the end moves to the next beat", () => {
  const counts = { 3: 3, 4: 3, 6: 2, 7: 3, 8: 5 };
  assert.deepEqual(clampResumePoint(8, 2, counts), { beat: 8, sub: 2, restart: false }, "in range: unchanged");
  assert.deepEqual(clampResumePoint(3, 7, counts), { beat: 4, sub: 0, restart: false });
  assert.deepEqual(clampResumePoint(8, 5, counts), { beat: 9, sub: 0, restart: false }, "past the last quiz item: Sound");
  assert.deepEqual(clampResumePoint(6, 40, { ...counts, 7: 0 }), { beat: 8, sub: 0, restart: false }, "skips an empty beat too");
  assert.deepEqual(clampResumePoint(5, 4, counts), { beat: 5, sub: 0, restart: false }, "single-screen beats ignore sub");
  assert.deepEqual(clampResumePoint(4, -1, counts), { beat: 4, sub: 0, restart: false });
});

test("a beat outside 1–9 restarts the lesson", () => {
  const counts = { 3: 3, 4: 3, 6: 2, 7: 3, 8: 5 };
  for (const beat of [0, 10, 11, -1, 2.5, Number.NaN]) {
    assert.deepEqual(clampResumePoint(beat, 0, counts), { beat: 0, sub: 0, restart: true }, String(beat));
  }
});

test("every saved step in every lesson resumes onto something that renders", () => {
  let checked = 0;
  for (const lesson of lessons) {
    const counts = itemCounts(lesson);
    for (let beat = 1; beat <= 9; beat += 1) {
      for (let sub = 0; sub <= 40; sub += 1) {
        const point = clampResumePoint(beat, sub, counts);
        assert.ok(renders(lesson, point.beat, point.sub), `${lesson.id} beat ${beat} sub ${sub} → ${JSON.stringify(point)}`);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 30000);
});

test("Lesson.tsx clamps both ways of resuming", () => {
  const src = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  const uses = src.match(/clampResumePoint\((savedCursor|cursor)\.beat, \1\.sub, itemCounts\(lesson\)\)/g) || [];
  assert.equal(uses.length, 2, "the armed resume on open and the 繼續 button");
  assert.match(src, /if \(point\.restart\) \{\s*restart\(\);/);
});
