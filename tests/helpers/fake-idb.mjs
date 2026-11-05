// A stand-in for the idb package, for tests that run the real store.ts in node.
// One shared database per test (globalThis.__fakeIdb), transactions run one at a
// time like IndexedDB's, and a test can hold writes at a gate to order events.
function shared() {
  const db = globalThis.__fakeIdb;
  if (!db) throw Object.assign(new Error("no indexedDB"), { name: "SecurityError" });
  return db;
}

async function locked(work) {
  const db = shared();
  const run = db.lock.then(work);
  db.lock = run.catch(() => undefined);
  return run;
}

const clone = (value) => (value === undefined ? undefined : structuredClone(value));

export async function openDB() {
  shared();
  return {
    onclose: null,
    onversionchange: null,
    get: (_store, key) => locked(async () => clone(shared().box.get(key))),
    put: (_store, value, key) =>
      locked(async () => {
        await shared().gate;
        shared().box.set(key, clone(value));
        shared().writes += 1;
      }),
    transaction() {
      let release;
      const done = new Promise((resolve) => { release = resolve; });
      const db = shared();
      const ready = db.lock;
      db.lock = ready.then(() => done);
      return {
        store: {
          get: async (key) => { await ready; return clone(db.box.get(key)); },
          put: async (value, key) => { await ready; await db.gate; db.box.set(key, clone(value)); db.writes += 1; },
        },
        get done() {
          return ready.then(() => { release(); });
        },
      };
    },
    close() {},
  };
}

/** No IndexedDB at all: the app runs in memory mode. */
export function noDb() {
  delete globalThis.__fakeIdb;
  delete globalThis.indexedDB;
}

export function freshDb(record) {
  const box = new Map();
  if (record !== undefined) box.set("state", structuredClone(record));
  globalThis.__fakeIdb = { box, lock: Promise.resolve(), gate: Promise.resolve(), writes: 0 };
  // store.ts checks that indexedDB exists before it opens the database.
  globalThis.indexedDB = globalThis.indexedDB || {};
  return globalThis.__fakeIdb;
}
