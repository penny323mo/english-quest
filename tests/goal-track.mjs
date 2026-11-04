// The onboarding goal picks 今日 and opens its track: jewellery J1, J2…, travel T1…,
// restaurant R1…. Foundation (and a finished track) falls back to the shipped order.
// Nothing that used to be open closes, and switching goals never closes earned lessons.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { goalTrack, lessonOpen, todayLesson } from "../web/src/unlock.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = fs.readFileSync(path.join(root, "web/src/data.ts"), "utf8");
const SHIPPED = JSON.parse(data.match(/export const SHIPPED = (\[[^\]]*\])/)[1]);
const HIDDEN = ["T20", "J23", "R17", "W14", "W15", "J24"];
const GOALS = ["foundation", "jewellery", "travel", "restaurant"];
const FIRST = { jewellery: "J1", travel: "T1", restaurant: "R1" };
const done = (ids) => Object.fromEntries(ids.map((id) => [id, { at: "2026-01-01", xp: 15 }]));
const openSet = (goal, progress, started) => SHIPPED.filter((id) => lessonOpen(id, goal, progress, SHIPPED, started));

/** isLessonOpen as it was on main before this change. */
function oldOpen(id, goal, progress) {
  if (!SHIPPED.includes(id)) return false;
  if (id === "F1") return true;
  const idx = SHIPPED.indexOf(id);
  const prev = idx > 0 ? SHIPPED[idx - 1] : "";
  if (prev && progress[prev]) return true;
  if (goal === "jewellery" && id === "J1") return true;
  if (goal === "jewellery" && id === "J2" && progress.J1) return true;
  if (goal === "travel" && id === "T1") return true;
  if (goal === "restaurant" && id === "R1") return true;
  return false;
}

function seeded(seed) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

test("a fresh profile: 今日 is the goal's first lesson, F1 stays open", () => {
  for (const goal of ["jewellery", "travel", "restaurant"]) {
    assert.equal(todayLesson(goal, {}, SHIPPED), FIRST[goal], goal);
    assert.deepEqual(openSet(goal, {}), ["F1", FIRST[goal]], goal);
  }
  assert.equal(todayLesson("foundation", {}, SHIPPED), "F1");
  assert.deepEqual(openSet("foundation", {}), ["F1"]);
});

test("each finished track lesson opens the next one, and 今日 walks the track in path order", () => {
  for (const goal of ["jewellery", "travel", "restaurant"]) {
    const track = goalTrack(goal, SHIPPED);
    assert.equal(track[0], FIRST[goal]);
    assert.ok(track.length > 10, goal);
    const progress = {};
    for (let i = 0; i < track.length; i += 1) {
      assert.equal(todayLesson(goal, progress, SHIPPED), track[i], `${goal} step ${i}`);
      assert.ok(lessonOpen(track[i], goal, progress, SHIPPED), `${track[i]} open`);
      progress[track[i]] = { at: "x", xp: 1 };
      if (i + 1 < track.length) assert.ok(lessonOpen(track[i + 1], goal, progress, SHIPPED), `${track[i]} → ${track[i + 1]}`);
    }
    // Track done: back to the shipped order.
    assert.equal(todayLesson(goal, progress, SHIPPED), "F1", `${goal} finished`);
    assert.equal(todayLesson(goal, { ...progress, ...done(["F1", "F2"]) }, SHIPPED), "F3");
  }
});

test("the track follows path order, not the number (J7 → J15, J10 → J19)", () => {
  const track = goalTrack("jewellery", SHIPPED);
  assert.deepEqual(track.slice(0, 8), ["J1", "J2", "J3", "J4", "J5", "J6", "J7", "J15"]);
  assert.equal(todayLesson("jewellery", done(["J1", "J2", "J3", "J4", "J5", "J6", "J7"]), SHIPPED), "J15");
  assert.equal(lessonOpen("J8", "jewellery", done(["J1", "J2", "J3", "J4", "J5", "J6", "J7"]), SHIPPED), false);
});

test("foundation 今日 is the shipped order, untouched", () => {
  const progress = {};
  for (const id of SHIPPED.slice(0, 20)) {
    assert.equal(todayLesson("foundation", progress, SHIPPED), id);
    progress[id] = { at: "x", xp: 1 };
  }
});

test("hidden lessons never open and are never 今日", () => {
  const all = done(SHIPPED);
  for (const goal of GOALS) {
    for (const id of HIDDEN) assert.equal(lessonOpen(id, goal, all, SHIPPED), false, `${goal} ${id}`);
    assert.equal(todayLesson(goal, all, SHIPPED), null, `${goal} all done`);
  }
});

test("nothing that was open before is locked now", () => {
  const rand = seeded(7);
  for (let round = 0; round < 400; round += 1) {
    const p = rand();
    const progress = done(SHIPPED.filter(() => rand() < p));
    for (const goal of GOALS) {
      for (const id of SHIPPED) {
        if (oldOpen(id, goal, progress)) assert.ok(lessonOpen(id, goal, progress, SHIPPED), `${goal} ${id} round ${round}`);
      }
      assert.ok(lessonOpen("F1", goal, progress, SHIPPED));
    }
  }
});

test("switching goals only ever closes the old goal's unstarted first lesson", () => {
  const rand = seeded(11);
  for (let round = 0; round < 300; round += 1) {
    const p = rand() * 0.6;
    const progress = done(SHIPPED.filter(() => rand() < p));
    for (const from of GOALS) {
      for (const to of GOALS) {
        const after = new Set(openSet(to, progress));
        const lost = openSet(from, progress).filter((id) => !after.has(id));
        assert.ok(lost.every((id) => id === FIRST[from]), `${from} → ${to} closed ${lost} (round ${round})`);
      }
    }
  }
  // Earned track lessons survive a switch: J1–J3 done under jewellery, J4 still open under travel.
  assert.ok(lessonOpen("J4", "travel", done(["J1", "J2", "J3"]), SHIPPED));
  // A finished lesson stays open after the switch even if nothing before it is done.
  assert.ok(lessonOpen("J1", "travel", done(["J1"]), SHIPPED));
});

test("a lesson part-way through stays open after a goal switch", () => {
  assert.equal(lessonOpen("J1", "travel", {}, SHIPPED), false);
  assert.equal(lessonOpen("J1", "travel", {}, SHIPPED, "J1"), true);
  assert.equal(lessonOpen("T20", "travel", {}, SHIPPED, "T20"), false, "a hidden cursor opens nothing");
});

test("the app routes 今日, the path and lesson gates through these rules", () => {
  const pages = fs.readFileSync(path.join(root, "web/src/pages.tsx"), "utf8");
  const lesson = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(data, /const order = SHIPPED as readonly string\[\];\n  return lessonOpen\(id, goal, progress, order, startedId\)/);
  assert.match(pages, /todayLessonId\(profile\.goal, progress, started\)/);
  assert.doesNotMatch(pages, /SHIPPED\.find\(/);
  assert.match(lesson, /isLessonOpen\(lesson\.id, profile\.goal, progress, started\)/);
  assert.match(lesson, /nextLessonAfter\(lesson, profile\?\.goal, progress\)/);
});
