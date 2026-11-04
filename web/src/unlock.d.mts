type Goal = "foundation" | "jewellery" | "travel" | "restaurant";
type Progress = Record<string, unknown>;

export const TRACK_PREFIX: Record<Exclude<Goal, "foundation">, string>;
export function goalTrack(goal: Goal, order: readonly string[]): string[];
export function lessonOpen(
  id: string,
  goal: Goal,
  progress: Progress,
  order: readonly string[],
  startedId?: string | null,
): boolean;
export function nextInGoalTrack(
  goal: Goal,
  progress: Progress,
  order: readonly string[],
  startedId?: string | null,
): string | null;
export function todayLesson(
  goal: Goal,
  progress: Progress,
  order: readonly string[],
  startedId?: string | null,
): string | null;
