// An imported file must not put values into progress that the scheduler or the
// streak cannot use (review finding 4): invalid dates, card states outside 0–3,
// negative or non-finite numbers, or a card stored under another card's id. Such a
// file is refused as a whole, before anything is replaced. Records already saved on
// this device keep loading as before.
import assert from "node:assert/strict";
import test from "node:test";
import { SCHEMA_VERSION, createPersistence, exportJson, importJson } from "../web/src/persist.mjs";

const card = (id, extra = {}) => ({
  id,
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
  ...extra,
});
// A brand-new card, as makeNewCard stores it (no last_review, all zeros).
const fresh = { id: "ring-noun", due: "2026-11-05T00:00:00.000Z", stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 0, lapses: 0, state: 0 };
const good = {
  schemaVersion: SCHEMA_VERSION,
  profile: { name: "Ling", goal: "jewellery", minutes: 15, level: "some", jyutping: true, sound: false, xp: 120, streak: 4, lastActive: "2026-11-05" },
  progress: { F1: { at: "2026-11-01T00:00:00.000Z", xp: 15 }, J1: { at: "2026-11-02T00:00:00.000Z", xp: 0 } },
  cards: { "gold-noun": card("gold-noun"), "ring-noun": fresh },
  lessonCursor: null,
  daily: null,
};
const file = (change) => {
  const copy = structuredClone(good);
  change(copy);
  return JSON.stringify(copy);
};

test("a real export imports unchanged, including a brand-new card", () => {
  const back = importJson(JSON.stringify(good));
  assert.deepEqual(back.cards, good.cards);
  assert.deepEqual(back.progress, good.progress);
  assert.equal(back.profile.xp, 120);
  assert.deepEqual(importJson(exportJson(back)), back);
});

const invalid = {
  "a card due date that is not a date": (d) => { d.cards["gold-noun"].due = "soon"; },
  "an empty card due date": (d) => { d.cards["gold-noun"].due = ""; },
  "a card last review that is not a date": (d) => { d.cards["gold-noun"].last_review = "2026-13-45T99:00:00Z"; },
  "a card state of 4": (d) => { d.cards["gold-noun"].state = 4; },
  "a card state of -1": (d) => { d.cards["gold-noun"].state = -1; },
  "a fractional card state": (d) => { d.cards["gold-noun"].state = 1.5; },
  "negative stability": (d) => { d.cards["gold-noun"].stability = -1; },
  "negative difficulty": (d) => { d.cards["gold-noun"].difficulty = -0.5; },
  "negative scheduled days": (d) => { d.cards["gold-noun"].scheduled_days = -3; },
  "negative lapses": (d) => { d.cards["gold-noun"].lapses = -1; },
  "fractional reps": (d) => { d.cards["gold-noun"].reps = 1.5; },
  "an infinite number (1e400 in the file)": (d) => { d.cards["gold-noun"].stability = "__INF__"; },
  "a card stored under another card's id": (d) => { d.cards["gold-noun"].id = "ring-noun"; },
  "a lesson finished at a time that is not a date": (d) => { d.progress.F1.at = "yesterday"; },
  "negative lesson XP": (d) => { d.progress.F1.xp = -15; },
  "negative profile XP": (d) => { d.profile.xp = -1; },
  "a fractional streak": (d) => { d.profile.streak = 2.5; },
  "a negative streak": (d) => { d.profile.streak = -2; },
  "a last-active day that is not a day": (d) => { d.profile.lastActive = "2026-02-31x"; },
  "a last-active day that does not exist (31 February)": (d) => { d.profile.lastActive = "2026-02-31"; },
  "a last-active day in a 13th month": (d) => { d.profile.lastActive = "2026-13-01"; },
  "29 February in a year that is not a leap year": (d) => { d.profile.lastActive = "2026-02-29"; },
  "a card due on a day that does not exist": (d) => { d.cards["gold-noun"].due = "2026-02-31T00:00:00.000Z"; },
  "a card last reviewed on 31 April": (d) => { d.cards["gold-noun"].last_review = "2026-04-31T08:00:00.000Z"; },
  "a lesson finished on 30 February": (d) => { d.progress.F1.at = "2026-02-30T12:00:00.000Z"; },
  "a card due date that is not in the app's ISO form": (d) => { d.cards["gold-noun"].due = "Nov 6 2026"; },
};

for (const [label, change] of Object.entries(invalid)) {
  test(`refused: ${label}`, () => {
    const raw = file(change).replace('"__INF__"', "1e400");
    assert.throws(() => importJson(raw), (err) => err.name === "ProgressError" && /冇覆蓋/.test(err.message), label);
  });
}

test("real days still import, including 29 February in a leap year", () => {
  const raw = file((d) => {
    d.profile.lastActive = "2028-02-29";
    d.cards["gold-noun"].due = "2028-02-29T23:59:59.999Z";
    d.progress.F1.at = "2026-12-31T00:00:00.000Z";
  });
  const back = importJson(raw);
  assert.equal(back.profile.lastActive, "2028-02-29");
  assert.equal(back.cards["gold-noun"].due, "2028-02-29T23:59:59.999Z");
});

test("a saved record on this device is not held to the import checks", async () => {
  const stored = structuredClone(good);
  stored.cards["gold-noun"].lapses = -1;
  stored.progress.F1.at = "yesterday";
  const box = new Map([["state", stored]]);
  const persistence = createPersistence(async () => ({
    onclose: null,
    onversionchange: null,
    async get() { return structuredClone(box.get("state")); },
    async put(_key, value) { box.set("state", structuredClone(value)); },
    close() {},
  }));
  const result = await persistence.hydrate();
  assert.equal(result.ok, true);
  assert.equal(persistence.mode, "ready");
  assert.equal(persistence.snapshot.cards["gold-noun"].lapses, -1, "nothing is dropped from a saved record");
});
