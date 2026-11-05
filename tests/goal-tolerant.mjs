// De-specialise P0-2a (review/de-specialise-audit.md): the loader must never refuse a
// saved record because of a goal it does not know. A newer build may add goals
// (daily life, work); a cached older build that reads such a record keeps every
// finished lesson, card, XP and streak, and shows the neutral goal instead.
import assert from "node:assert/strict";
import test from "node:test";
import { FALLBACK_GOAL, SCHEMA_VERSION, createPersistence, exportJson, importJson, migrate } from "../web/src/persist.mjs";

const card = {
  id: "gold-noun",
  due: "2026-11-06T00:00:00.000Z",
  stability: 1.5,
  difficulty: 5,
  elapsed_days: 0,
  scheduled_days: 1,
  learning_steps: 0,
  reps: 1,
  lapses: 0,
  state: 2,
  last_review: "2026-11-05T01:00:00.000Z",
};
const base = {
  profile: { name: "Ling", goal: "jewellery", minutes: 15, level: "some", jyutping: true, sound: false, xp: 120, streak: 4, lastActive: "2026-11-05" },
  progress: { F1: { at: "2026-11-01T00:00:00.000Z", xp: 15 }, J1: { at: "2026-11-02T00:00:00.000Z", xp: 18 } },
  cards: { "gold-noun": card },
  lessonCursor: { lessonId: "J2", beat: 4, sub: 1, quizScore: 0, quizAnswered: 0 },
  daily: { date: "2026-11-05", ids: ["gold-noun", "ring-noun", "seat-noun"], done: true, history: [] },
};
const withGoal = (goal) => ({ ...base, schemaVersion: SCHEMA_VERSION, profile: { ...base.profile, goal } });

test("the fallback goal is the neutral one", () => {
  assert.equal(FALLBACK_GOAL, "foundation");
});

test("an unknown goal reads as the fallback and keeps all progress", () => {
  for (const goal of ["something-new", "retired-goal", "", 7, null, undefined]) {
    const out = migrate(SCHEMA_VERSION, SCHEMA_VERSION, withGoal(goal));
    assert.equal(out.profile.goal, FALLBACK_GOAL, String(goal));
    assert.deepEqual({ ...out.profile, goal: "jewellery" }, base.profile, "every other profile field is kept");
    assert.deepEqual(out.progress, base.progress);
    assert.deepEqual(out.cards, base.cards);
    assert.deepEqual(out.lessonCursor, base.lessonCursor);
    assert.deepEqual(out.daily, base.daily);
  }
});

test("known goals, including the stored value jewellery and the new daily and work, are unchanged", () => {
  for (const goal of ["foundation", "daily", "travel", "restaurant", "work", "jewellery"]) {
    assert.equal(migrate(SCHEMA_VERSION, SCHEMA_VERSION, withGoal(goal)).profile.goal, goal);
  }
});

test("old saves (version 1, 2 and 3) load as before", () => {
  const v1 = { profile: base.profile, progress: base.progress, cards: base.cards };
  const records = [
    [1, v1],
    [2, { ...v1, schemaVersion: 2 }],
    [3, { ...v1, schemaVersion: 3, lessonCursor: base.lessonCursor }],
  ];
  for (const [version, record] of records) {
    const out = migrate(version, SCHEMA_VERSION, record);
    assert.deepEqual(out.profile, base.profile, `v${version} profile`);
    assert.deepEqual(out.progress, base.progress, `v${version} progress`);
    assert.deepEqual(out.cards, base.cards, `v${version} cards`);
  }
  // An old save with an unknown goal also loads.
  assert.equal(migrate(1, SCHEMA_VERSION, { ...v1, profile: { ...base.profile, goal: "something-new" } }).profile.goal, FALLBACK_GOAL);
});

test("an exported file with an unknown goal imports", () => {
  const back = importJson(JSON.stringify(withGoal("something-new")));
  assert.equal(back.profile.goal, FALLBACK_GOAL);
  assert.equal(back.profile.xp, 120);
  assert.deepEqual(back.progress, base.progress);
  assert.equal(JSON.parse(exportJson(back)).profile.goal, FALLBACK_GOAL);
});

test("IndexedDB: a record with an unknown goal hydrates as ready, not read-only", async () => {
  const box = new Map([["state", structuredClone(withGoal("retired-goal"))]]);
  const open = async () => ({
    onclose: null,
    onversionchange: null,
    async get() {
      return box.get("state");
    },
    async put(_key, value) {
      box.set("state", structuredClone(value));
    },
    close() {},
  });
  const persistence = createPersistence(open);
  const result = await persistence.hydrate();
  assert.equal(result.ok, true);
  assert.equal(persistence.mode, "ready");
  assert.equal(persistence.status.kind, "ok");
  assert.equal(persistence.snapshot.profile.goal, FALLBACK_GOAL);
  assert.equal(persistence.snapshot.profile.xp, 120);
  assert.deepEqual(persistence.snapshot.progress, base.progress);
  assert.deepEqual(persistence.snapshot.cards, base.cards);
});
