export const QUIZ_BEAT: number;
export function quizResumePoint(
  beat: number,
  sub: number,
  answeredCurrent: boolean,
  quizLength: number,
): { beat: number; sub: number };
