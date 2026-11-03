export const QUIZ_BEAT: number;
export function quizResumePoint(
  beat: number,
  sub: number,
  answeredCurrent: boolean,
  quizLength: number,
): { beat: number; sub: number };
export const ITEM_BEATS: Record<number, string>;
export function itemCounts(lesson: {
  understand: unknown[];
  chunks: unknown[];
  build: unknown[];
  roleplay: { turns: unknown[] };
  quiz: unknown[];
}): Record<number, number>;
export function clampResumePoint(
  beat: number,
  sub: number,
  counts: Record<number, number>,
): { beat: number; sub: number; restart: boolean };
