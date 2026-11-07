import { openDB, type IDBPDatabase } from "idb";
import { create } from "zustand";
import { Rating, type Grade } from "ts-fsrs";
import { makeNewCard, reviewStored } from "./fsrs";
import { DAILY_XP, addDays, macauDate, startDay } from "./daily.mjs";
import { createPersistence, exportJson, importJson, type LessonCursor, type Persisted, type SaveStatus } from "./persist.mjs";
import { FALLBACK_LEARNER } from "./learner";
import type { Goal, Level, Profile } from "./types";

type Store = Persisted & {
  ready: boolean;
  writable: boolean;
  /** Another tab is the one saving. Kept apart from saveStatus so a save result never clears it. */
  paused: boolean;
  saveStatus: SaveStatus;
  resumeArmed: boolean;
  setProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeLesson: (id: string, xp: number) => void;
  setLessonCursor: (cursor: LessonCursor | null) => void;
  armResume: () => void;
  enqueueLemmas: (ids: string[]) => void;
  gradeCard: (id: string, rating: Grade) => void;
  touchToday: () => void;
  /** Store the day's 每日抽卡 draw. A draw already stored for that date is kept. */
  startDaily: (date: string, ids: string[]) => void;
  /** Replace today's cards with a repaired set (repairDay). Keeps done; never awards XP. */
  repairDaily: (date: string, ids: string[]) => void;
  /** Finish the day's draw: 打卡, XP, and the cards join 生字回顧. Once per day. */
  finishDaily: (date: string) => void;
  reset: () => void;
  retrySave: () => void;
  exportSnapshot: () => string;
  previewImport: (raw: string) => { ok: true } | { ok: false; message: string };
  applyImport: (raw: string) => { ok: true } | { ok: false; message: string };
};

export function bumpStreak(profile: Profile, now = new Date()): Profile {
  // The streak counts Macau calendar days, the same day 每日抽卡 uses, so a learner
  // abroad never sees the streak and the daily draw roll over at different times.
  const today = macauDate(now);
  if (profile.lastActive === today) return profile;
  const streak = profile.lastActive === addDays(today, -1) ? profile.streak + 1 : 1;
  return { ...profile, streak, lastActive: today };
}

const DB_VERSION = 2;

function openBrowserDb() {
  if (typeof indexedDB === "undefined") {
    const err = new Error("no indexedDB");
    err.name = "SecurityError";
    return Promise.reject(err);
  }
  return openDB("english-quest", DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    },
    terminated() {
      persistence.drop();
    },
  }).then((db) => wrapDb(db));
}

function wrapDb(db: IDBPDatabase): {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<unknown>;
  putIf(key: string, matches: (current: unknown) => boolean, value: unknown): Promise<boolean>;
  close(): void;
  onclose: (() => void) | null;
  onversionchange: (() => void) | null;
} {
  let onclose: (() => void) | null = null;
  let onversionchange: (() => void) | null = null;
  db.onclose = () => {
    onclose?.();
  };
  db.onversionchange = () => {
    onversionchange?.();
  };
  return {
    get: (key) => db.get("kv", key),
    put: (key, value) => db.put("kv", value, key),
    // Read, compare and write in one readwrite transaction, so no other tab can write in between.
    putIf: async (key, matches, value) => {
      const tx = db.transaction("kv", "readwrite");
      const current = await tx.store.get(key);
      if (!matches(current)) {
        await tx.done;
        return false;
      }
      await tx.store.put(value, key);
      await tx.done;
      return true;
    },
    close: () => db.close(),
    get onclose() {
      return onclose;
    },
    set onclose(fn) {
      onclose = fn;
    },
    get onversionchange() {
      return onversionchange;
    },
    set onversionchange(fn) {
      onversionchange = fn;
    },
  };
}

const persistence = createPersistence(openBrowserDb);

function snapshot(): Persisted {
  const s = useStore.getState();
  return {
    schemaVersion: s.schemaVersion,
    profile: s.profile,
    progress: s.progress,
    cards: s.cards,
    lessonCursor: s.lessonCursor,
    daily: s.daily,
  };
}

/*
 * One tab saves at a time. A tab that opens, comes back into view, or is told to
 * continue becomes the writer: it first loads the latest saved record, then tells the
 * other tabs (BroadcastChannel), which stop saving until they become the writer again.
 * The channel is only a notice: every write is still checked against the stored record
 * in the same IndexedDB transaction (persist.mjs). That check detects a write by an
 * older cached build afterwards; it cannot stop one. Older builds neither check nor
 * listen to this channel (see the known limit in persist.mjs).
 */
const TAB_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const channel: BroadcastChannel | null = (() => {
  try {
    return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("english-quest-progress");
  } catch {
    return null;
  }
})();

/** Tabs share one record only when IndexedDB works; in memory mode each tab is on its own. */
function sharesRecord(): boolean {
  return persistence.mode === "ready";
}

function announceWriter() {
  if (!sharesRecord()) return;
  try {
    channel?.postMessage({ type: "writer", id: TAB_ID });
  } catch {
    /* A closed channel only loses the notice; the transaction check still protects the record. */
  }
}

channel?.addEventListener("message", (event: MessageEvent) => {
  const data = event.data as { type?: string; id?: string } | null;
  if (!data || data.type !== "writer" || data.id === TAB_ID) return;
  const s = useStore.getState();
  if (!s.ready || !sharesRecord()) return;
  useStore.setState({ writable: false, paused: true });
});

let takingOver: Promise<void> | null = null;

/** Become the tab that saves: reload the latest saved record before any edit. */
export function takeOver(): Promise<void> {
  if (takingOver) return takingOver;
  takingOver = (async () => {
    // Memory mode keeps this tab's session: there is no shared record to reload, and
    // hydrating again would replace the session with an empty one.
    if (!sharesRecord()) {
      useStore.setState({ paused: false });
      return;
    }
    useStore.setState({ writable: false });
    // Saves queued before this reload belong to the old copy: persistence drops them.
    const result = await persistence.hydrate();
    if (!result.ok) {
      useStore.setState({ writable: false, paused: false, saveStatus: persistence.status });
      return;
    }
    applyPersistence();
    useStore.setState({ paused: false });
    announceWriter();
  })().finally(() => {
    takingOver = null;
  });
  return takingOver;
}

if (typeof document !== "undefined") {
  const resume = () => {
    if (document.visibilityState === "visible" && useStore.getState().paused) void takeOver();
  };
  document.addEventListener("visibilitychange", resume);
  window.addEventListener("focus", resume);
}

async function save(data: Persisted) {
  let result: { ok: boolean; conflict?: boolean; stale?: boolean } = { ok: false };
  try {
    result = await persistence.save(data);
  } catch {
    /* persistence.save already records the failure and does not throw. */
  }
  // Queued before the last reload and dropped unwritten: nothing to report.
  if (result.stale) return;
  if (result.conflict) {
    // Someone else wrote first: never overwrite it. Load it and say so.
    const notice = persistence.status;
    await takeOver();
    // Only claim the latest copy is loaded if the reload worked; otherwise keep its own status.
    if (persistence.status.kind === "ok") useStore.setState({ saveStatus: notice });
    return;
  }
  const status = persistence.status;
  if (useStore.getState().saveStatus !== status) useStore.setState({ saveStatus: status });
}

export const useStore = create<Store>((set) => ({
  ready: false,
  writable: false,
  paused: false,
  saveStatus: { kind: "ok" },
  schemaVersion: 3,
  profile: null,
  progress: {},
  cards: {},
  lessonCursor: null,
  daily: null,
  resumeArmed: false,
  setProfile: (profile) => set((s) => (s.writable ? { profile } : s)),
  updateProfile: (patch) =>
    set((s) => (s.writable && s.profile ? { profile: { ...s.profile, ...patch } } : s)),
  completeLesson: (id, xp) =>
    set((s) => {
      if (!s.writable || !s.profile) return s;
      const profile = bumpStreak(s.profile);
      const lessonCursor = s.lessonCursor?.lessonId === id ? null : s.lessonCursor;
      if (s.progress[id]) return { profile, lessonCursor };
      return {
        profile: { ...profile, xp: profile.xp + xp },
        progress: { ...s.progress, [id]: { at: new Date().toISOString(), xp } },
        lessonCursor,
      };
    }),
  setLessonCursor: (cursor) => set((s) => (s.writable ? { lessonCursor: cursor } : s)),
  armResume: () => set({ resumeArmed: true }),
  enqueueLemmas: (ids) =>
    set((s) => {
      if (!s.writable) return s;
      const cards = { ...s.cards };
      const now = new Date();
      let changed = false;
      for (const id of ids) {
        if (!cards[id]) {
          cards[id] = makeNewCard(id, now);
          changed = true;
        }
      }
      return changed ? { cards } : s;
    }),
  gradeCard: (id, rating) =>
    set((s) => {
      const cur = s.cards[id];
      if (!s.writable || !cur || !s.profile) return s;
      const next = reviewStored(cur, rating);
      const bonus = rating === Rating.Good || rating === Rating.Easy ? 2 : rating === Rating.Hard ? 1 : 0;
      const profile = bumpStreak(s.profile);
      return {
        cards: { ...s.cards, [id]: next },
        profile: { ...profile, xp: profile.xp + bonus },
      };
    }),
  touchToday: () =>
    set((s) => (s.writable && s.profile ? { profile: bumpStreak(s.profile) } : s)),
  startDaily: (date, ids) =>
    set((s) => {
      if (!s.writable || (s.daily && s.daily.date === date)) return s;
      return { daily: startDay(s.daily, date, ids) };
    }),
  repairDaily: (date, ids) =>
    set((s) => {
      if (!s.writable || !s.daily || s.daily.date !== date) return s;
      if (s.daily.ids.length === ids.length && s.daily.ids.every((id, i) => id === ids[i])) return s;
      if (!s.daily.done) return { daily: { ...s.daily, ids } };
      // A finished day stays finished: no XP or streak again, but the cards it now
      // shows join 生字回顧 as its original cards did.
      const cards = { ...s.cards };
      const now = new Date();
      for (const id of ids) if (!cards[id]) cards[id] = makeNewCard(id, now);
      return { daily: { ...s.daily, ids }, cards };
    }),
  finishDaily: (date) =>
    set((s) => {
      if (!s.writable || !s.profile || !s.daily || s.daily.date !== date || s.daily.done) return s;
      const profile = bumpStreak(s.profile);
      const cards = { ...s.cards };
      const now = new Date();
      for (const id of s.daily.ids) if (!cards[id]) cards[id] = makeNewCard(id, now);
      return {
        profile: { ...profile, xp: profile.xp + DAILY_XP },
        cards,
        daily: { ...s.daily, done: true },
      };
    }),
  reset: () => set((s) => (s.writable ? { profile: null, progress: {}, cards: {}, lessonCursor: null, daily: null } : s)),
  retrySave: () => {
    void save(snapshot());
  },
  exportSnapshot: () => exportJson(snapshot()),
  previewImport: (raw) => {
    try {
      importJson(raw);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "呢份檔案讀唔到。" };
    }
  },
  applyImport: (raw) => {
    const s = useStore.getState();
    if (!s.writable) return { ok: false, message: "而家讀唔到舊進度，未可以覆蓋。" };
    try {
      const data = importJson(raw);
      set({
        profile: data.profile,
        progress: data.progress,
        cards: data.cards,
        lessonCursor: data.lessonCursor,
        daily: data.daily ?? null,
        schemaVersion: data.schemaVersion,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "呢份檔案讀唔到。" };
    }
  },
}));

useStore.subscribe((state, prev) => {
  if (!state.ready || !state.writable) return;
  if (
    state.profile === prev.profile &&
    state.progress === prev.progress &&
    state.cards === prev.cards &&
    state.lessonCursor === prev.lessonCursor &&
    state.daily === prev.daily
  ) {
    return;
  }
  void save({
    schemaVersion: state.schemaVersion,
    profile: state.profile,
    progress: state.progress,
    cards: state.cards,
    lessonCursor: state.lessonCursor,
    daily: state.daily,
  });
});

let hydrating: Promise<void> | null = null;

function applyPersistence() {
  const snap = persistence.snapshot;
  const memory = persistence.mode === "memory";
  useStore.setState({
    schemaVersion: snap.schemaVersion,
    profile: snap.profile,
    progress: snap.progress,
    cards: snap.cards,
    lessonCursor: snap.lessonCursor,
    daily: snap.daily ?? null,
    ready: true,
    writable: false,
    saveStatus: { kind: "ok" },
  });
  useStore.setState({
    writable: persistence.mode === "ready" || memory,
    saveStatus: persistence.status,
  });
}

export function hydrate(): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    const result = await persistence.hydrate();
    if (!result.ok) {
      useStore.setState({
        ready: true,
        writable: false,
        saveStatus: persistence.status,
      });
      return;
    }
    applyPersistence();
    announceWriter();
  })().catch(() => {
    useStore.setState({
      ready: true,
      writable: false,
      saveStatus: { kind: "readonly", reason: "讀唔到已儲存嘅進度。" },
    });
  });
  return hydrating;
}

export function retryHydrate(): Promise<void> {
  hydrating = null;
  useStore.setState({ ready: false, writable: false });
  return hydrate();
}

export function blankProfile(input: {
  name: string;
  goal: Goal;
  minutes: 10 | 15 | 20;
  level: Level;
}): Profile {
  return {
    name: input.name.trim() || FALLBACK_LEARNER,
    goal: input.goal,
    minutes: input.minutes,
    level: input.level,
    jyutping: false,
    sound: true,
    xp: 0,
    streak: 0,
    lastActive: null,
  };
}
