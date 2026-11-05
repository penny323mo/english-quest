export type DailyDay = { date: string; ids: string[] };
export type DailyState = DailyDay & { done: boolean; history: DailyDay[] };

export const DAILY_COUNT: number;
export const NO_REPEAT_DAYS: number;
export const DAILY_XP: number;
export const NOT_DRAWN: Set<string>;
export function macauDate(now?: Date): string;
export function addDays(date: string, days: number): string;
export function recentIds(history: DailyDay[] | undefined, date: string): Set<string>;
export function drawDaily(input: {
  date: string;
  preferred: readonly string[];
  pool: readonly string[];
  history?: DailyDay[];
  count?: number;
  keep?: readonly string[];
}): string[];
export function repairDay(
  daily: DailyState,
  input: { preferred: readonly string[]; pool: readonly string[]; count?: number },
): DailyState;
export function startDay(daily: DailyState | null | undefined, date: string, ids: string[]): DailyState;
export function normalizeDaily(daily: unknown): DailyState | null;
