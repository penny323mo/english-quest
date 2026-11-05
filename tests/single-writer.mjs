// Two tabs must never silently overwrite each other's progress (review finding 1).
// Each save checks, in the same IndexedDB transaction that writes, that the stored
// record is exactly the one this tab last read or wrote. A tab that loses the race
// (or a write from an older cached build that knows nothing of revisions) makes the
// save fail with a conflict instead of discarding the other tab's progress.
import assert from "node:assert/strict";
import test from "node:test";
import { createPersistence } from "../web/src/persist.mjs";

const profile = { name: "Ling", goal: "jewellery", minutes: 15, level: "some", jyutping: false, sound: true, xp: 0, streak: 0, lastActive: null };
const done = (at) => ({ at, xp: 15 });

/** One shared fake IndexedDB; every tab opens its own connection to it. */
function sharedDb(initial) {
  const box = new Map();
  if (initial !== undefined) box.set("state", structuredClone(initial));
  let writes = 0;
  const open = async () => ({
    onclose: null,
    onversionchange: null,
    async get(key) {
      return structuredClone(box.get(key));
    },
    async put(key, value) {
      writes += 1;
      box.set(key, structuredClone(value));
    },
    // The real store.ts does this inside one readwrite transaction.
    async putIf(key, matches, value) {
      const current = box.get(key);
      if (!matches(current === undefined ? undefined : structuredClone(current))) return false;
      writes += 1;
      box.set(key, structuredClone(value));
      return true;
    },
    close() {},
  });
  return { box, open, writes: () => writes };
}

const record = (progress, extra = {}) => ({ schemaVersion: 3, profile, progress, cards: {}, lessonCursor: null, daily: null, ...extra });

test("two tabs: the second, stale save is refused and the first tab's progress stays", async () => {
  const db = sharedDb(record({}));
  const tabA = createPersistence(db.open);
  const tabB = createPersistence(db.open);
  await tabA.hydrate();
  await tabB.hydrate();
  assert.equal((await tabA.save(record({ F1: done("a") }))).ok, true);
  const stale = await tabB.save(record({ J1: done("b") }));
  assert.equal(stale.ok, false);
  assert.equal(stale.conflict, true);
  assert.equal(tabB.status.kind, "conflict");
  assert.deepEqual(Object.keys(db.box.get("state").progress), ["F1"], "tab A's F1 was not overwritten");
  // Tab B loads the latest record before editing again, then both lessons are kept.
  await tabB.hydrate();
  assert.deepEqual(Object.keys(tabB.snapshot.progress), ["F1"]);
  assert.equal((await tabB.save(record({ ...tabB.snapshot.progress, J1: done("b") }))).ok, true);
  assert.deepEqual(Object.keys(db.box.get("state").progress).sort(), ["F1", "J1"]);
});

test("each save bumps a revision; a tab's own saves never conflict with each other", async () => {
  const db = sharedDb();
  const tab = createPersistence(db.open);
  await tab.hydrate();
  // Fire-and-forget saves in quick succession, as the store does on every change.
  const results = await Promise.all([1, 2, 3, 4].map((n) => tab.save(record({ [`F${n}`]: done(String(n)) }))));
  assert.ok(results.every((r) => r.ok), JSON.stringify(results));
  assert.equal(db.box.get("state").rev, 4);
  assert.deepEqual(Object.keys(db.box.get("state").progress), ["F4"], "the last save wins within one tab");
});

test("a write from an older cached build (no revision) is detected, not overwritten", async () => {
  const db = sharedDb(record({ F1: done("x") }));
  const tab = createPersistence(db.open);
  await tab.hydrate();
  assert.equal((await tab.save(record({ F1: done("x"), F2: done("y") }))).ok, true);
  // An older build reads, drops fields it does not know (rev, daily) and writes its own copy.
  const { rev: _rev, daily: _daily, ...older } = structuredClone(db.box.get("state"));
  older.progress.J1 = done("old");
  db.box.set("state", older);
  const result = await tab.save(record({ F1: done("x"), F2: done("y"), F3: done("z") }));
  assert.equal(result.conflict, true);
  assert.ok(db.box.get("state").progress.J1, "the older build's J1 is kept");
  await tab.hydrate();
  assert.ok(tab.snapshot.progress.J1 && tab.snapshot.progress.F2);
});

test("the very first save into an empty database still works, and a second tab then sees it", async () => {
  const db = sharedDb();
  const tabA = createPersistence(db.open);
  const tabB = createPersistence(db.open);
  await tabA.hydrate();
  await tabB.hydrate();
  assert.equal((await tabA.save(record({ F1: done("a") }))).ok, true);
  assert.equal((await tabB.save(record({ J1: done("b") }))).conflict, true, "B started from an empty database that is no longer empty");
  assert.deepEqual(Object.keys(db.box.get("state").progress), ["F1"]);
});

test("an older build reads the record with its revision unchanged otherwise", async () => {
  const db = sharedDb();
  const tab = createPersistence(db.open);
  await tab.hydrate();
  await tab.save(record({ F1: done("a") }));
  const stored = db.box.get("state");
  assert.equal(stored.rev, 1);
  assert.equal(stored.schemaVersion, 3, "no schema bump: older builds keep reading it");
  assert.deepEqual(stored.progress, { F1: done("a") });
});
