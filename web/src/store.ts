import { openDB } from "idb";
import { create } from "zustand";
import { Rating, type Grade } from "ts-fsrs";
import { makeNewCard, reviewStored } from "./fsrs";
import type { Goal, LessonDone, Level, Profile, StoredCard } from "./types";

type Persisted = {
  profile: Profile | null;
  progress: Record<string, LessonDone>;
  cards: Record<string, StoredCard>;
};

type Store = Persisted & {
  ready: boolean;
  setProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeLesson: (id: string, xp: number) => void;
  enqueueLemmas: (ids: string[]) => void;
  gradeCard: (id: string, rating: Grade) => void;
  touchToday: () => void;
  reset: () => void;
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

const dbp = openDB("english-quest", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
  },
});

async function save(data: Persisted) {
  try {
    const db = await dbp;
    await db.put("kv", data, "state");
  } catch {
    /* Private mode keeps the session in memory. */
  }
}

export const useStore = create<Store>((set) => ({
  ready: false,
  profile: null,
  progress: {},
  cards: {},
  setProfile: (profile) => set({ profile }),
  updateProfile: (patch) =>
    set((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : s)),
  completeLesson: (id, xp) =>
    set((s) => {
      if (!s.profile) return s;
      const profile = bumpStreak(s.profile);
      if (s.progress[id]) return { profile };
      return {
        profile: { ...profile, xp: profile.xp + xp },
        progress: { ...s.progress, [id]: { at: new Date().toISOString(), xp } },
      };
    }),
  enqueueLemmas: (ids) =>
    set((s) => {
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
      if (!cur || !s.profile) return s;
      const next = reviewStored(cur, rating);
      const bonus = rating === Rating.Good || rating === Rating.Easy ? 2 : rating === Rating.Hard ? 1 : 0;
      const profile = bumpStreak(s.profile);
      return {
        cards: { ...s.cards, [id]: next },
        profile: { ...profile, xp: profile.xp + bonus },
      };
    }),
  touchToday: () =>
    set((s) => (s.profile ? { profile: bumpStreak(s.profile) } : s)),
  reset: () => set({ profile: null, progress: {}, cards: {} }),
}));

useStore.subscribe((state, prev) => {
  if (!state.ready) return;
  if (
    state.profile === prev.profile &&
    state.progress === prev.progress &&
    state.cards === prev.cards
  ) {
    return;
  }
  void save({ profile: state.profile, progress: state.progress, cards: state.cards });
});

let hydrating: Promise<void> | null = null;

export function hydrate(): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const db = await dbp;
      const saved = (await db.get("kv", "state")) as Persisted | undefined;
      useStore.setState({
        profile: saved?.profile ?? null,
        progress: saved?.progress ?? {},
        cards: saved?.cards ?? {},
        ready: true,
      });
    } catch {
      useStore.setState({ ready: true });
    }
  })();
  return hydrating;
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
    xp: 0,
    streak: 0,
    lastActive: null,
  };
}
