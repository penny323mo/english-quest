import assert from "node:assert/strict";
import test from "node:test";
import {
  SCHEMA_VERSION,
  createPersistence,
  exportJson,
  importJson,
  migrate,
} from "../web/src/persist.mjs";

const profile = {
  name: "阿琳",
  goal: "jewellery",
  minutes: 15,
  level: "some",
  jyutping: false,
  sound: false,
  xp: 40,
  streak: 3,
  lastActive: "2026-10-29",
};

const progress = { F1: { at: "2026-10-29T01:02:03.000Z", xp: 12 } };

const cards = {
  "gold-noun": {
    id: "gold-noun",
    due: "2026-10-30T00:00:00.000Z",
    stability: 1.5,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2,
    last_review: "2026-10-29T01:02:03.000Z",
  },
};

function memoryDb(initial) {
  const box = new Map();
  if (initial !== undefined) box.set("state", initial);
  let opens = 0;
  let current = null;
  function open() {
    opens += 1;
    const db = {
      closed: false,
      onclose: null,
      onversionchange: null,
      async get() {
        if (this.closed) {
          const err = new Error("closed");
          err.name = "InvalidStateError";
          throw err;
        }
        return box.get("state");
      },
      async put(_key, value) {
        if (this.closed) {
          const err = new Error("closed");
          err.name = "InvalidStateError";
          throw err;
        }
        if (db.failPut) {
          const err = new Error("quota");
          err.name = "QuotaExceededError";
          throw err;
        }
        box.set("state", value);
      },
      close() {
        if (this.closed) return;
        this.closed = true;
        if (typeof this.onclose === "function") this.onclose();
      },
    };
    current = db;
    return db;
  }
  return { box, open, opens: () => opens, current: () => current };
}

test("migrate v1 to current keeps xp, streak, lessons, and cards", () => {
  const v1 = { profile, progress, cards };
  const once = migrate(1, SCHEMA_VERSION, v1);
  assert.equal(once.schemaVersion, SCHEMA_VERSION);
  assert.equal(once.profile.xp, 40);
  assert.equal(once.profile.streak, 3);
  assert.equal(once.profile.sound, false);
  assert.deepEqual(once.progress, progress);
  assert.deepEqual(once.cards, cards);
  const twice = migrate(SCHEMA_VERSION, SCHEMA_VERSION, once);
  assert.deepEqual(twice, once);
  assert.throws(() => migrate(SCHEMA_VERSION + 1, SCHEMA_VERSION, once), /較新版本/);
});

test("export JSON imports back to the same persisted fields", () => {
  const stored = migrate(1, SCHEMA_VERSION, { profile, progress, cards });
  const back = importJson(exportJson(stored));
  assert.equal(back.schemaVersion, stored.schemaVersion);
  assert.deepEqual(back.profile, stored.profile);
  assert.deepEqual(back.progress, stored.progress);
  assert.deepEqual(back.cards, stored.cards);
  assert.throws(() => importJson("{"), /有效/);
  assert.throws(() => importJson(JSON.stringify({ schemaVersion: 99, profile, progress, cards })), /較新版本/);
});

test("hydrate failure does not write over an existing record", async () => {
  const kept = { schemaVersion: 1, profile, progress, cards };
  const db = memoryDb(kept);
  db.open = () => {
    const conn = {
      onclose: null,
      onversionchange: null,
      async get() {
        const err = new Error("read failed");
        err.name = "AbortError";
        throw err;
      },
      async put() {
        throw new Error("put should not run");
      },
      close() {},
    };
    return conn;
  };
  const persistence = createPersistence(() => db.open());
  const result = await persistence.hydrate();
  assert.equal(result.ok, false);
  assert.equal(persistence.mode, "readonly");
  assert.equal(persistence.status.kind, "readonly");
  const saved = await persistence.save({ schemaVersion: SCHEMA_VERSION, profile: null, progress: {}, cards: {} });
  assert.equal(saved.ok, false);
  assert.equal(db.box.get("state"), kept);
});

test("save failure surfaces an unsaved status and leaves the old record", async () => {
  const db = memoryDb({ schemaVersion: SCHEMA_VERSION, profile, progress, cards });
  const persistence = createPersistence(db.open);
  const hydrated = await persistence.hydrate();
  assert.equal(hydrated.ok, true);
  db.current().failPut = true;
  const next = {
    schemaVersion: SCHEMA_VERSION,
    profile: { ...profile, xp: 99 },
    progress,
    cards,
  };
  const saved = await persistence.save(next);
  assert.equal(saved.ok, false);
  assert.equal(persistence.status.kind, "unsaved");
  assert.match(persistence.status.reason, /空間唔夠/);
  assert.equal(db.box.get("state").profile.xp, 40);
  db.current().failPut = false;
  const retried = await persistence.retrySave();
  assert.equal(retried.ok, true);
  assert.equal(persistence.status.kind, "ok");
  assert.equal(db.box.get("state").profile.xp, 99);
});

test("a closed database is reopened on the next write", async () => {
  const db = memoryDb({ schemaVersion: SCHEMA_VERSION, profile, progress, cards });
  const persistence = createPersistence(db.open);
  await persistence.hydrate();
  assert.equal(db.opens(), 1);
  db.current().close();
  const saved = await persistence.save(persistence.snapshot);
  assert.equal(saved.ok, true);
  assert.equal(db.opens(), 2);
  db.current().onversionchange();
  await persistence.save(persistence.snapshot);
  assert.equal(db.opens(), 3);
});
