/** Progress durability. IndexedDB details stay behind this seam so tests can fake it. */
import { normalizeDaily } from "./daily.mjs";

// `daily` (每日抽卡) is an optional, additive field on version 3. It does not bump the
// version: an older cached build keeps reading the record (it ignores the field)
// instead of refusing it as 較新版本.
export const SCHEMA_VERSION = 3;
export const STATE_KEY = "state";
const CONFLICT_REASON = "另一個分頁（或者舊版）改咗進度，已經載入最新嗰份，啱啱嗰下未儲存。";

const GOALS = new Set(["foundation", "jewellery", "travel", "restaurant"]);
/**
 * A goal this build does not know (for example one added by a newer build) reads
 * as this neutral goal instead of refusing the whole record: the learner keeps
 * every finished lesson, card, XP and streak, and can pick a goal again in 設定.
 */
export const FALLBACK_GOAL = "foundation";
const LEVELS = new Set(["new", "some", "work"]);
const MINUTES = new Set([10, 15, 20]);
const CARD_NUMS = ["stability", "difficulty", "elapsed_days", "scheduled_days", "learning_steps", "reps", "lapses", "state"];

export function emptyPersisted() {
  return { schemaVersion: SCHEMA_VERSION, profile: null, progress: {}, cards: {}, lessonCursor: null, daily: null };
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
  if (!MINUTES.has(profile.minutes)) throw bad("進度格式唔啱。");
  if (!LEVELS.has(profile.level)) throw bad("進度格式唔啱。");
  if (typeof profile.xp !== "number" || typeof profile.streak !== "number") throw bad("進度格式唔啱。");
  return {
    name: profile.name,
    goal: GOALS.has(profile.goal) ? profile.goal : FALLBACK_GOAL,
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

function normalizeCursor(cursor) {
  if (cursor == null) return null;
  if (typeof cursor !== "object" || Array.isArray(cursor)) throw bad("進度格式唔啱。");
  if (typeof cursor.lessonId !== "string" || !/^[A-Za-z0-9_-]{1,12}$/.test(cursor.lessonId)) throw bad("進度格式唔啱。");
  const beat = cursor.beat;
  const sub = cursor.sub;
  const quizScore = cursor.quizScore;
  const quizAnswered = cursor.quizAnswered;
  if (!Number.isInteger(beat) || beat < 1 || beat > 9) throw bad("進度格式唔啱。");
  if (!Number.isInteger(sub) || sub < 0 || sub > 40) throw bad("進度格式唔啱。");
  if (!Number.isInteger(quizScore) || quizScore < 0 || quizScore > 40) throw bad("進度格式唔啱。");
  if (!Number.isInteger(quizAnswered) || quizAnswered < 0 || quizAnswered > 40) throw bad("進度格式唔啱。");
  if (quizScore > quizAnswered) throw bad("進度格式唔啱。");
  return { lessonId: cursor.lessonId, beat, sub, quizScore, quizAnswered };
}

function stamp(data) {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: normalizeProfile(data?.profile),
    progress: normalizeProgress(data?.progress),
    cards: normalizeCards(data?.cards),
    lessonCursor: normalizeCursor(data?.lessonCursor),
    // Lenient: a malformed daily draw is dropped, never a reason to refuse progress.
    daily: normalizeDaily(data?.daily),
  };
}

/**
 * Recap copy. A quiz the learner never answered is 跳過小測.
 * A quiz they answered and missed still shows 0%.
 */
export function quizRecapLine(score, total, answered) {
  if (total > 0 && answered === 0) return "跳過小測";
  const accuracy = total ? Math.round((score / total) * 100) : 0;
  return `小測 ${score} / ${total} · 準確 ${accuracy}%`;
}

/**
 * Upgrade a stored record from `from` to `to`.
 * Version 1 is the original profile/progress/cards object, with or without schemaVersion.
 * Version 2 stamps schemaVersion and normalizes those fields.
 * Version 3 adds lessonCursor. A record with no cursor stays null.
 *   It later gained the optional `daily` field; a record without it reads as null.
 * No step drops XP, streak, finished lessons, or cards.
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
    if (version === 2 || version === 3) current = stamp(current);
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
    lessonCursor: body.lessonCursor,
    daily: body.daily ?? null,
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
    /**
     * Write `value` only if the stored record still passes `matches`, checked and
     * written in one readwrite transaction (db.putIf). Resolves true when written.
     */
    putStateIf(matches, value) {
      return run(async (db) => {
        if (typeof db.putIf === "function") return db.putIf(STATE_KEY, matches, value);
        // Test doubles without transactions: same check, not atomic.
        if (!matches(await db.get(STATE_KEY))) return false;
        await db.put(STATE_KEY, value);
        return true;
      });
    },
  };
}

/** The exact record as stored, for comparing what a tab last saw with what is there now. */
export function fingerprint(record) {
  return record == null ? "" : JSON.stringify(record);
}

function revOf(record) {
  return record && Number.isInteger(record.rev) && record.rev >= 0 ? record.rev : 0;
}

/**
 * Hydrate / save policy.
 * mode ready: may write.
 * mode memory: private-mode style first run, keep the session, never call put.
 * mode readonly: a read failed, so put is refused and the previous database bytes stay put.
 *
 * Several tabs (or an older cached build) can share the record. Every write checks,
 * in the same transaction, that the stored record is exactly the one this instance
 * last read or wrote (`seen`); otherwise nothing is written, status becomes
 * "conflict", and the caller must hydrate again before editing. Each write also
 * stores `rev`, the previous revision + 1. Saves from one instance run one at a time.
 *
 * What this guarantees, and what it does not:
 * - Between tabs running this build (or later): a stale save is refused, so no
 *   tab overwrites progress another tab saved.
 * - After an older cached build writes: this build notices (the record no longer
 *   matches) and reloads it instead of writing over it.
 * - Known limit: it cannot stop an older cached build from writing. Builds from
 *   before this check write the whole record unconditionally and ignore the
 *   BroadcastChannel notice, so an old tab left open can still replace progress a
 *   newer tab saved after that old tab last loaded. tests/single-writer.mjs pins
 *   this ordering down. The window closes once every open tab has reloaded onto
 *   this build or later.
 */
export function createPersistence(open) {
  const kv = createKv(open);
  let mode = "booting";
  let status = { kind: "ok" };
  let snapshot = emptyPersisted();
  let asked = false;
  let seen = "";
  let seenRev = 0;
  let queue = Promise.resolve();

  async function writeChecked(body) {
    const expected = seen;
    const record = { ...body, rev: seenRev + 1 };
    const written = await kv.putStateIf((current) => fingerprint(current) === expected, record);
    if (!written) return false;
    seen = fingerprint(record);
    seenRev = record.rev;
    return true;
  }

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
        seen = fingerprint(raw);
        seenRev = revOf(raw);
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
            if (!(await writeChecked(snapshot))) status = { kind: "conflict", reason: CONFLICT_REASON };
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
    save(next) {
      // One write at a time, so a tab's own back-to-back saves never look like a conflict.
      const run = queue.then(() => this.saveNow(next));
      queue = run.catch(() => undefined);
      return run;
    },
    async saveNow(next) {
      if (mode === "readonly" || mode === "booting") {
        status = {
          kind: "readonly",
          reason: status.reason || "讀唔到已儲存嘅進度。",
        };
        return { ok: false };
      }
      let body;
      try {
        body = stamp(next);
      } catch (err) {
        // A record that fails validation is not written; the last good snapshot
        // stays, and the learner sees 未儲存 instead of a silent stop.
        status = { kind: "unsaved", reason: err instanceof Error && err.name === "ProgressError" ? err.message : "進度格式唔啱。" };
        return { ok: false };
      }
      snapshot = body;
      if (mode === "memory") {
        status = { kind: "unsaved", reason: "呢個瀏覽器而家存唔到資料。" };
        return { ok: false };
      }
      try {
        if (!(await writeChecked(body))) {
          status = { kind: "conflict", reason: CONFLICT_REASON };
          return { ok: false, conflict: true };
        }
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
