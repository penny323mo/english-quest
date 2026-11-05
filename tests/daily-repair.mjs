// A stored draw for today that is not three valid, distinct cards is repaired
// (review finding 5): valid cards keep their place, the rest are drawn again, the
// day's done status and history are kept (so its XP is never given twice), and a
// draw that is already fine is returned as the same object.
import assert from "node:assert/strict";
import test from "node:test";
import { DAILY_COUNT, NOT_DRAWN, repairDay } from "../web/src/daily.mjs";

const pool = ["a-noun", "b-noun", "c-noun", "d-noun", "e-noun", "f-noun", "g-noun", "jewelry-noun"];
const preferred = ["b-noun", "c-noun"];
const day = (ids, extra = {}) => ({ date: "2026-11-05", ids, done: false, history: [], ...extra });
const valid = (ids) =>
  ids.length === DAILY_COUNT && new Set(ids).size === DAILY_COUNT && ids.every((id) => pool.includes(id) && !NOT_DRAWN.has(id));

test("a valid draw is left exactly as it is", () => {
  const daily = day(["a-noun", "b-noun", "c-noun"]);
  assert.equal(repairDay(daily, { preferred, pool }), daily);
});

test("duplicates are replaced and the first copy keeps its place", () => {
  const out = repairDay(day(["d-noun", "d-noun", "e-noun"]), { preferred, pool });
  assert.ok(valid(out.ids), out.ids.join());
  assert.deepEqual(out.ids.slice(0, 2), ["d-noun", "e-noun"]);
});

test("unknown ids and cards that are never drawn are replaced", () => {
  const out = repairDay(day(["gone-noun", "jewelry-noun", "a-noun"]), { preferred, pool });
  assert.ok(valid(out.ids), out.ids.join());
  assert.equal(out.ids[0], "a-noun");
});

test("too few or too many cards become three", () => {
  assert.ok(valid(repairDay(day(["a-noun"]), { preferred, pool }).ids));
  assert.ok(valid(repairDay(day([]), { preferred, pool }).ids));
  const many = repairDay(day(["a-noun", "b-noun", "c-noun", "d-noun", "e-noun"]), { preferred, pool });
  assert.deepEqual(many.ids, ["a-noun", "b-noun", "c-noun"]);
});

test("a finished day stays finished, with its date and history", () => {
  const history = [{ date: "2026-11-04", ids: ["f-noun", "g-noun", "e-noun"] }];
  const out = repairDay(day(["a-noun", "a-noun", "gone-noun"], { done: true, history }), { preferred, pool });
  assert.equal(out.done, true);
  assert.equal(out.date, "2026-11-05");
  assert.deepEqual(out.history, history);
  assert.ok(valid(out.ids));
});

test("replacements avoid the last week's cards when there are enough others", () => {
  const history = [{ date: "2026-11-04", ids: ["b-noun", "c-noun", "d-noun"] }];
  const out = repairDay(day(["a-noun", "gone-noun", "gone-2-noun"], { history }), { preferred, pool });
  assert.ok(valid(out.ids));
  assert.ok(out.ids.every((id) => !history[0].ids.includes(id)), out.ids.join());
});

test("the repair is the same every time for the same inputs", () => {
  const broken = day(["a-noun", "a-noun", "gone-noun"]);
  assert.deepEqual(repairDay(broken, { preferred, pool }).ids, repairDay(structuredClone(broken), { preferred, pool }).ids);
});

test("a tiny deck gives as many distinct cards as it has", () => {
  const out = repairDay(day(["a-noun", "a-noun", "a-noun"]), { preferred: [], pool: ["a-noun", "b-noun"] });
  assert.deepEqual([...out.ids].sort(), ["a-noun", "b-noun"]);
  const same = day(["a-noun", "b-noun"]);
  assert.equal(repairDay(same, { preferred: [], pool: ["a-noun", "b-noun"] }), same);
});
