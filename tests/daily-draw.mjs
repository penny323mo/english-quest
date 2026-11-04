// 每日抽卡: the day's three cards are seeded by the Asia/Macau date, come from the
// learner's open or seen lessons first, never repeat inside 7 days, and the stored
// draw survives reloads. The daily field is additive: old progress loads unchanged.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  DAILY_COUNT,
  NOT_DRAWN,
  addDays,
  drawDaily,
  macauDate,
  normalizeDaily,
  recentIds,
  startDay,
} from "../web/src/daily.mjs";
import { SCHEMA_VERSION, createPersistence, exportJson, importJson, migrate } from "../web/src/persist.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const lex = read("content/lexicon.json");
const pool = lex.items.filter((item) => !item.hidden).map((item) => item.id);
const f1 = read("content/lessons/f1.json").lemmas;
const j1 = read("content/lessons/j1.json").lemmas;

/** Simulate a learner who draws every day: returns [{date, ids}] per day. */
function run(days, start, preferred) {
  let daily = null;
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    const ids = drawDaily({ date, preferred, pool, history: daily ? [{ date: daily.date, ids: daily.ids }, ...daily.history] : [] });
    daily = startDay(daily, date, ids);
    out.push({ date, ids });
  }
  return out;
}

test("the day is the Asia/Macau date, not the device's", () => {
  assert.equal(macauDate(new Date("2026-11-04T15:59:59Z")), "2026-11-04");
  assert.equal(macauDate(new Date("2026-11-04T16:00:00Z")), "2026-11-05", "midnight in Macau is 16:00 UTC");
  assert.equal(macauDate(new Date("2026-12-31T16:30:00Z")), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("three different cards, the same three for the same inputs", () => {
  const input = { date: "2026-11-04", preferred: f1, pool, history: [] };
  const a = drawDaily(input);
  assert.equal(a.length, DAILY_COUNT);
  assert.equal(new Set(a).size, DAILY_COUNT);
  assert.deepEqual(drawDaily({ ...input }), a);
  assert.deepEqual(drawDaily({ ...input, pool: [...pool].reverse(), preferred: [...f1].reverse() }), a, "input order does not matter");
  assert.notDeepEqual(drawDaily({ ...input, date: "2026-11-05" }), a, "another day, another draw");
});

test("cards come from open or seen lessons first", () => {
  const preferred = [...new Set([...f1, ...j1])].filter((id) => !NOT_DRAWN.has(id));
  for (const day of run(5, "2026-11-01", preferred)) {
    for (const id of day.ids) assert.ok(preferred.includes(id), `${day.date} drew ${id} from outside the open lessons`);
  }
});

test("no card repeats within 7 days, even when the open lessons run out", () => {
  const small = f1.slice(0, 8); // fewer than a week of draws: the rest of the pool fills in
  for (const preferred of [small, f1, pool]) {
    const days = run(60, "2026-10-01", preferred);
    for (let i = 0; i + 7 <= days.length; i += 1) {
      const week = days.slice(i, i + 7).flatMap((day) => day.ids);
      assert.equal(new Set(week).size, 7 * DAILY_COUNT, `repeat in the 7 days from ${days[i].date}`);
    }
    // Open-lesson cards still come first whenever they are free.
    if (preferred === small) {
      const first = days[0].ids;
      assert.ok(first.every((id) => small.includes(id)));
    }
  }
  assert.deepEqual([...recentIds([{ date: "2026-11-01", ids: ["x"] }, { date: "2026-10-28", ids: ["y"] }], "2026-11-04")], ["x"]);
});

test("hidden cards and the American-spelling contrast cards are never drawn", () => {
  const hidden = new Set(lex.items.filter((item) => item.hidden).map((item) => item.id));
  const days = run(30, "2026-11-01", [...NOT_DRAWN, ...pool.slice(0, 40)]);
  for (const day of days) for (const id of day.ids) {
    assert.equal(NOT_DRAWN.has(id), false, id);
    assert.equal(hidden.has(id), false, id);
  }
});

test("a stored draw is kept for its day; the next day moves it into history", () => {
  const today = startDay(null, "2026-11-04", ["a", "b", "c"]);
  assert.deepEqual(today, { date: "2026-11-04", ids: ["a", "b", "c"], done: false, history: [] });
  assert.equal(startDay(today, "2026-11-04", ["x", "y", "z"]), today, "reopening the same day changes nothing");
  const next = startDay({ ...today, done: true }, "2026-11-05", ["d", "e", "f"]);
  assert.deepEqual(next.history, [{ date: "2026-11-04", ids: ["a", "b", "c"] }]);
  assert.equal(next.done, false);
  const later = startDay(next, "2026-11-30", ["g", "h", "i"]);
  assert.deepEqual(later.history, [], "history keeps two weeks");
});

const profile = { name: "Ling", goal: "jewellery", minutes: 15, level: "new", jyutping: false, sound: true, xp: 40, streak: 2, lastActive: "2026-11-03" };
const daily = { date: "2026-11-04", ids: ["gold-noun", "ring-noun", "hello-intj"], done: true, history: [{ date: "2026-11-03", ids: ["a-art", "the-art", "my-det"] }] };

test("records saved before 每日抽卡 load unchanged, with no daily draw", () => {
  const v1 = { profile, progress: { F1: { at: "2026-11-01T00:00:00Z", xp: 15 } }, cards: {} };
  for (const [version, data] of [[1, v1], [2, { ...v1, schemaVersion: 2 }], [3, { ...v1, schemaVersion: 3, lessonCursor: null }]]) {
    const out = migrate(version, SCHEMA_VERSION, data);
    assert.equal(out.daily, null, `v${version}`);
    assert.equal(out.profile.xp, 40);
    assert.deepEqual(out.progress, v1.progress);
  }
});

test("the daily field is additive: version 3 stays, and old builds can still read the record", () => {
  assert.equal(SCHEMA_VERSION, 3, "bumping the version would make cached older builds refuse the record");
  const out = migrate(3, 3, { schemaVersion: 3, profile, progress: {}, cards: {}, lessonCursor: null, daily });
  assert.deepEqual(out.daily, daily);
  // An older build keeps only the fields it knows; everything else survives.
  const { daily: _dropped, ...older } = out;
  assert.deepEqual(migrate(3, 3, older), { ...out, daily: null });
});

test("export and import keep the daily draw", () => {
  const back = importJson(exportJson({ schemaVersion: 3, profile, progress: {}, cards: {}, lessonCursor: null, daily }));
  assert.deepEqual(back.daily, daily);
});

test("a malformed daily draw is dropped, never a reason to refuse progress", () => {
  for (const bad of [5, "x", [], { date: "4 Nov", ids: [] }, { date: "2026-11-04", ids: "a" }, { date: "2026-11-04", ids: ["<b>"] }]) {
    assert.equal(normalizeDaily(bad), null, JSON.stringify(bad));
    const out = migrate(3, 3, { schemaVersion: 3, profile, progress: {}, cards: {}, lessonCursor: null, daily: bad });
    assert.equal(out.profile.xp, 40);
    assert.equal(out.daily, null);
  }
  const trimmed = normalizeDaily({ ...daily, done: "yes", history: [...daily.history, { date: "bad", ids: [] }, null] });
  assert.equal(trimmed.done, false);
  assert.deepEqual(trimmed.history, daily.history);
});

test("save and hydrate keep the daily draw in IndexedDB", async () => {
  const box = new Map();
  const open = async () => ({
    onclose: null,
    onversionchange: null,
    async get() { return box.get("state"); },
    async put(_key, value) { box.set("state", structuredClone(value)); },
    close() {},
  });
  const first = createPersistence(open);
  await first.hydrate();
  await first.save({ schemaVersion: 3, profile, progress: {}, cards: {}, lessonCursor: null, daily });
  const second = createPersistence(open);
  await second.hydrate();
  assert.deepEqual(second.snapshot.daily, daily);
  assert.equal(second.snapshot.profile.xp, 40);
});
