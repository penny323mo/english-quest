/** Progress durability. IndexedDB details stay behind this seam so tests can fake it. */

export const SCHEMA_VERSION = 2;
export const STATE_KEY = "state";

const GOALS = new Set(["foundation", "jewellery", "travel", "restaurant"]);
const LEVELS = new Set(["new", "some", "work"]);
const MINUTES = new Set([10, 15, 20]);
const CARD_NUMS = ["stability", "difficulty", "elapsed_days", "scheduled_days", "learning_steps", "reps", "lapses", "state"];

export function emptyPersisted() {
  return { schemaVersion: SCHEMA_VERSION, profile: null, progress: {}, cards: {} };
}

function bad(message) {
  const err = new Error(message);
  err.name = "ProgressError";
  return err;
}

function normalizeProfile(profile) {
  if (profile == null) return null;
  if (typeof profile !== "object" || Array.isArray(profile)) throw bad("進度格式唔啱。");
  if (typeof profile.name !== "string") throw bad("進度格式唔啱。");
  if (!GOALS.has(profile.goal)) throw bad("進度格式唔啱。");
  if (!MINUTES.has(profile.minutes)) throw bad("進度格式唔啱。");
  if (!LEVELS.has(profile.level)) throw bad("進度格式唔啱。");
  if (typeof profile.xp !== "number" || typeof profile.streak !== "number") throw bad("進度格式唔啱。");
  return {
    name: profile.name,
    goal: profile.goal,
    minutes: profile.minutes,
    level: profile.level,
    jyutping: Boolean(profile.jyutping),
    sound: profile.sound !== false,
    xp: profile.xp,
    streak: profile.streak,
    lastActive: typeof profile.lastActive === "string" ? profile.lastActive : null,
  };
}

function normalizeProgress(progress) {
  if (progress == null) return {};
  if (typeof progress !== "object" || Array.isArray(progress)) throw bad("進度格式唔啱。");
  const out = {};
  for (const [id, row] of Object.entries(progress)) {
    if (!row || typeof row !== "object" || typeof row.at !== "string" || typeof row.xp !== "number") {
      throw bad("進度格式唔啱。");
    }
    out[id] = { at: row.at, xp: row.xp };
  }
  return out;
}

function normalizeCards(cards) {
  if (cards == null) return {};
  if (typeof cards !== "object" || Array.isArray(cards)) throw bad("進度格式唔啱。");
  const out = {};
  for (const [id, card] of Object.entries(cards)) {
    if (!card || typeof card !== "object" || typeof card.due !== "string") throw bad("進度格式唔啱。");
    const next = { id: typeof card.id === "string" ? card.id : id, due: card.due };
    for (const key of CARD_NUMS) {
      if (typeof card[key] !== "number" || Number.isNaN(card[key])) throw bad("進度格式唔啱。");
      next[key] = card[key];
    }
    if (card.last_review != null) {
      if (typeof card.last_review !== "string") throw bad("進度格式唔啱。");
      next.last_review = card.last_review;
    }
    out[id] = next;
  }
  return out;
}

function stamp(data) {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: normalizeProfile(data?.profile),
    progress: normalizeProgress(data?.progress),
    cards: normalizeCards(data?.cards),
  };
}

/**
 * Upgrade a stored record from `from` to `to`.
 * Version 1 is the original profile/progress/cards object, with or without schemaVersion.
 * Version 2 stamps schemaVersion and normalizes the same fields. It does not drop XP, streak, lessons, or cards.
 */
export function migrate(from, to, data) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1) throw bad("進度格式唔啱。");
  if (from > to) throw bad("呢份檔案係較新版本，呢個版本讀唔到。");
  if (to !== SCHEMA_VERSION) throw bad("進度格式唔啱。");
  let version = from;
  let current = data && typeof data === "object" ? data : {};
  if (from === to) return stamp(current);
  while (version < to) {
    version += 1;
    if (version === 2) current = stamp(current);
    else throw bad("進度格式唔啱。");
  }
  return current;
}

export function exportJson(data) {
  const body = data.schemaVersion === SCHEMA_VERSION ? data : migrate(data.schemaVersion ?? 1, SCHEMA_VERSION, data);
  return JSON.stringify({
    schemaVersion: body.schemaVersion,
    profile: body.profile,
    progress: body.progress,
    cards: body.cards,
  });
}

export function importJson(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw bad("呢份檔案唔係有效嘅進度。");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw bad("呢份檔案唔係有效嘅進度。");
  const version = data.schemaVersion == null ? 1 : data.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version)) throw bad("進度格式唔啱。");
  return migrate(version, SCHEMA_VERSION, data);
}

export function isMemoryOnlyError(err) {
  return Boolean(err) && typeof err === "object" && err.name === "SecurityError";
}

export function saveReason(err) {
  const name = err && typeof err === "object" ? err.name : "";
  if (name === "QuotaExceededError") return "空間唔夠。";
  if (name === "SecurityError") return "呢個瀏覽器而家存唔到資料。";
  if (name === "InvalidStateError") return "儲存庫已經關閉。";
  return "儲存失敗。";
}

export function requestPersist() {
  try {
    const storage = globalThis.navigator?.storage;
    if (!storage || typeof storage.persist !== "function") return;
    void Promise.resolve(storage.persist()).catch(() => undefined);
  } catch {
    /* A denied or missing Storage API must not break the lesson. */
  }
}

function forget(liveRef, db) {
  if (db && liveRef.current === db) liveRef.current = null;
  liveRef.pending = null;
  if (!db || db._forgotten) return;
  db._forgotten = true;
  try {
    db.close();
  } catch {
    /* Already closed. */
  }
}

/** Open a connection on demand. Drop it on close, versionchange, or a failed op. */
export function createKv(open) {
  const liveRef = { current: null, pending: null };

  async function connection() {
    if (liveRef.current) return liveRef.current;
    if (!liveRef.pending) {
      liveRef.pending = Promise.resolve()
        .then(() => open())
        .then((db) => {
          db.onclose = () => {
            if (liveRef.current === db) liveRef.current = null;
          };
          db.onversionchange = () => {
            forget(liveRef, db);
          };
          liveRef.current = db;
          liveRef.pending = null;
          return db;
        })
        .catch((err) => {
          liveRef.pending = null;
          liveRef.current = null;
          throw err;
        });
    }
    return liveRef.pending;
  }

  async function run(op) {
    let db;
    try {
      db = await connection();
      return await op(db);
    } catch (err) {
      forget(liveRef, db);
      throw err;
    }
  }

  return {
    drop() {
      forget(liveRef, liveRef.current);
    },
    getState() {
      return run((db) => db.get(STATE_KEY));
    },
    putState(value) {
      return run((db) => db.put(STATE_KEY, value));
    },
  };
}

/**
 * Hydrate / save policy.
 * mode ready: may write.
 * mode memory: private-mode style first run, keep the session, never call put.
 * mode readonly: a read failed, so put is refused and the previous database bytes stay put.
 */
export function createPersistence(open) {
  const kv = createKv(open);
  let mode = "booting";
  let status = { kind: "ok" };
  let snapshot = emptyPersisted();
  let asked = false;

  function askPersist() {
    if (asked) return;
    asked = true;
    requestPersist();
  }

  return {
    get mode() {
      return mode;
    },
    get status() {
      return status;
    },
    get snapshot() {
      return snapshot;
    },
    drop() {
      kv.drop();
    },
    async hydrate() {
      try {
        const raw = await kv.getState();
        if (raw == null) {
          snapshot = emptyPersisted();
          mode = "ready";
          status = { kind: "ok" };
          askPersist();
          return { ok: true, empty: true };
        }
        const version = raw.schemaVersion == null ? 1 : raw.schemaVersion;
        snapshot = migrate(version, SCHEMA_VERSION, raw);
        mode = "ready";
        status = { kind: "ok" };
        askPersist();
        if (version < SCHEMA_VERSION) {
          try {
            await kv.putState(snapshot);
          } catch (err) {
            status = { kind: "unsaved", reason: saveReason(err) };
          }
        }
        return { ok: true, empty: false };
      } catch (err) {
        if (isMemoryOnlyError(err)) {
          snapshot = emptyPersisted();
          mode = "memory";
          status = { kind: "ok" };
          return { ok: true, empty: true, memory: true };
        }
        mode = "readonly";
        status = { kind: "readonly", reason: "讀唔到已儲存嘅進度。" };
        return { ok: false };
      }
    },
    async save(next) {
      if (mode === "readonly" || mode === "booting") {
        status = {
          kind: "readonly",
          reason: status.reason || "讀唔到已儲存嘅進度。",
        };
        return { ok: false };
      }
      const body = next?.schemaVersion === SCHEMA_VERSION ? next : stamp(next);
      snapshot = body;
      if (mode === "memory") {
        status = { kind: "unsaved", reason: "呢個瀏覽器而家存唔到資料。" };
        return { ok: false };
      }
      try {
        await kv.putState(snapshot);
        status = { kind: "ok" };
        return { ok: true };
      } catch (err) {
        status = { kind: "unsaved", reason: saveReason(err) };
        return { ok: false };
      }
    },
    retrySave() {
      return this.save(snapshot);
    },
  };
}
