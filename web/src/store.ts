import { openDB, type IDBPDatabase } from "idb";
import { create } from "zustand";
import { Rating, type Grade } from "ts-fsrs";
import { makeNewCard, reviewStored } from "./fsrs";
import { createPersistence, exportJson, importJson, type Persisted, type SaveStatus } from "./persist.mjs";
import type { Goal, Level, Profile } from "./types";

type Store = Persisted & {
  ready: boolean;
  writable: boolean;
  saveStatus: SaveStatus;
  setProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeLesson: (id: string, xp: number) => void;
  enqueueLemmas: (ids: string[]) => void;
  gradeCard: (id: string, rating: Grade) => void;
  touchToday: () => void;
  reset: () => void;
  retrySave: () => void;
  exportSnapshot: () => string;
  previewImport: (raw: string) => { ok: true } | { ok: false; message: string };
  applyImport: (raw: string) => { ok: true } | { ok: false; message: string };
};

function todayKey(d = new Date()): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function bumpStreak(profile: Profile, now = new Date()): Profile {
  const today = todayKey(now);
  if (profile.lastActive === today) return profile;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const streak = profile.lastActive === todayKey(y) ? profile.streak + 1 : 1;
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
  return { schemaVersion: s.schemaVersion, profile: s.profile, progress: s.progress, cards: s.cards };
}

async function save(data: Persisted) {
  try {
    await persistence.save(data);
  } catch {
    /* persistence.save already records the failure and does not throw. */
  }
  const status = persistence.status;
  if (useStore.getState().saveStatus !== status) useStore.setState({ saveStatus: status });
}

export const useStore = create<Store>((set) => ({
  ready: false,
  writable: false,
  saveStatus: { kind: "ok" },
  schemaVersion: 2,
  profile: null,
  progress: {},
  cards: {},
  setProfile: (profile) => set((s) => (s.writable ? { profile } : s)),
  updateProfile: (patch) =>
    set((s) => (s.writable && s.profile ? { profile: { ...s.profile, ...patch } } : s)),
  completeLesson: (id, xp) =>
    set((s) => {
      if (!s.writable || !s.profile) return s;
      const profile = bumpStreak(s.profile);
      if (s.progress[id]) return { profile };
      return {
        profile: { ...profile, xp: profile.xp + xp },
        progress: { ...s.progress, [id]: { at: new Date().toISOString(), xp } },
      };
    }),
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
  reset: () => set((s) => (s.writable ? { profile: null, progress: {}, cards: {} } : s)),
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
      set({ profile: data.profile, progress: data.progress, cards: data.cards, schemaVersion: data.schemaVersion });
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
    state.cards === prev.cards
  ) {
    return;
  }
  void save({
    schemaVersion: state.schemaVersion,
    profile: state.profile,
    progress: state.progress,
    cards: state.cards,
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
    name: input.name.trim() || "阿琳",
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
