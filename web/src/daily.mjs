// 每日抽卡: which three vocab cards a learner draws on a given day.
// Pure so node tests can import it. The draw is seeded by the Asia/Macau date,
// so the same inputs give the same cards; the app also stores the day's draw,
// so reopening it that day shows the same three even if new lessons opened since.

export const DAILY_COUNT = 3;
/** No card comes back within this many days: any 7 days in a row show 21 different cards. */
export const NO_REPEAT_DAYS = 7;
export const DAILY_XP = 10;
/** Cards that teach an American spelling on purpose (contrast cards). Never drawn. */
export const NOT_DRAWN = new Set(["jewelry-noun", "elevator-noun"]);
const HISTORY_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date in Asia/Macau (UTC+8 all year, no daylight saving) as YYYY-MM-DD. */
export function macauDate(now = new Date()) {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function addDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Ids drawn on the NO_REPEAT_DAYS - 1 days before `date`. */
export function recentIds(history, date) {
  const from = addDays(date, -(NO_REPEAT_DAYS - 1));
  const out = new Set();
  for (const row of history || []) {
    if (row.date >= from && row.date < date) for (const id of row.ids) out.add(id);
  }
  return out;
}

function hash32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(ids, seed) {
  const out = [...ids].sort();
  const next = random(hash32(seed));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw the day's cards.
 * preferred: cards from lessons the learner has open or has seen; drawn first.
 * pool: every drawable card; fills in when preferred runs short.
 * history: earlier draws [{ date, ids }]; nothing from the last NO_REPEAT_DAYS - 1 days repeats.
 */
export function drawDaily({ date, preferred, pool, history = [], count = DAILY_COUNT }) {
  const drawable = new Set(pool.filter((id) => !NOT_DRAWN.has(id)));
  const recent = recentIds(history, date);
  const picked = [];
  const take = (ids, tier) => {
    for (const id of seededShuffle(ids, `${date}:${tier}`)) {
      if (picked.length >= count) return;
      if (drawable.has(id) && !recent.has(id) && !picked.includes(id)) picked.push(id);
    }
  };
  take([...new Set(preferred)], "preferred");
  take([...drawable], "pool");
  // Only a pool smaller than a week of draws reaches this: repeat rather than show fewer.
  if (picked.length < count) {
    for (const id of seededShuffle([...drawable], `${date}:repeat`)) {
      if (picked.length >= count) break;
      if (!picked.includes(id)) picked.push(id);
    }
  }
  return picked;
}

/** The stored daily state after drawing `ids` on `date`. Yesterday's draw moves into history. */
export function startDay(daily, date, ids) {
  if (daily && daily.date === date) return daily;
  const older = daily ? [{ date: daily.date, ids: daily.ids }, ...(daily.history || [])] : [];
  const keepFrom = addDays(date, -HISTORY_DAYS);
  return {
    date,
    ids,
    done: false,
    history: older.filter((row) => row.date >= keepFrom && row.date < date).slice(0, HISTORY_DAYS),
  };
}

/** Lenient read of a stored daily record: anything malformed becomes null, never an error. */
export function normalizeDaily(daily) {
  if (!daily || typeof daily !== "object" || Array.isArray(daily)) return null;
  const ids = (list) =>
    Array.isArray(list) && list.length <= 10 && list.every((id) => typeof id === "string" && /^[a-z0-9-]{1,64}$/.test(id))
      ? [...list]
      : null;
  if (typeof daily.date !== "string" || !DATE.test(daily.date)) return null;
  const today = ids(daily.ids);
  if (!today) return null;
  const history = [];
  for (const row of Array.isArray(daily.history) ? daily.history.slice(0, HISTORY_DAYS) : []) {
    const rowIds = row && typeof row === "object" ? ids(row.ids) : null;
    if (rowIds && typeof row.date === "string" && DATE.test(row.date)) history.push({ date: row.date, ids: rowIds });
  }
  return { date: daily.date, ids: today, done: daily.done === true, history };
}
