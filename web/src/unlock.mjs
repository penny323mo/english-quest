// Which lessons are open, and which one is 今日, given the learner's goal.
// Pure so node tests can import it; data.ts wraps it with the shipped order.
//
// Rules (each only ever opens more, never closes):
// - F1 is always open.
// - A finished lesson stays open.
// - The lesson the learner is part-way through (the saved cursor) stays open.
// - Linear: finishing a lesson opens the next one in the shipped order.
// - Goal: the first lesson of the chosen goal's track is open from the start.
// - Track: finishing a jewellery, travel or restaurant lesson opens the next
//   lesson of that track (path order), whatever the goal is now. Switching goals
//   therefore never closes a lesson the learner earned.

export const TRACK_PREFIX = { jewellery: "J", travel: "T", restaurant: "R" };
const PREFIXES = new Set(Object.values(TRACK_PREFIX));

/** The goal's track in path order, or [] for foundation. */
export function goalTrack(goal, order) {
  const prefix = TRACK_PREFIX[goal];
  return prefix ? order.filter((id) => id[0] === prefix) : [];
}

export function lessonOpen(id, goal, progress, order, startedId = null) {
  const idx = order.indexOf(id);
  if (idx < 0) return false;
  if (id === "F1") return true;
  if (progress[id]) return true;
  if (startedId && id === startedId) return true;
  if (idx > 0 && progress[order[idx - 1]]) return true;
  const prefix = id[0];
  if (!PREFIXES.has(prefix)) return false;
  const track = order.filter((other) => other[0] === prefix);
  const at = track.indexOf(id);
  if (at === 0) return TRACK_PREFIX[goal] === prefix;
  return Boolean(progress[track[at - 1]]);
}

/** The first unfinished lesson of the goal's track, or null once it is done (or for foundation). */
export function nextInGoalTrack(goal, progress, order, startedId = null) {
  return goalTrack(goal, order).find((id) => !progress[id] && lessonOpen(id, goal, progress, order, startedId)) ?? null;
}

/** 今日: the goal's track first; the shipped order once that track is done or for foundation. */
export function todayLesson(goal, progress, order, startedId = null) {
  return (
    nextInGoalTrack(goal, progress, order, startedId) ??
    order.find((id) => !progress[id] && lessonOpen(id, goal, progress, order, startedId)) ??
    null
  );
}
