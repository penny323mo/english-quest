/** Beat numbers in a lesson player (see beats.ts). */
export const QUIZ_BEAT = 8;

/**
 * Where a saved lesson cursor should point.
 *
 * The cursor is saved as the learner moves. In the quiz, quizAnswered goes up
 * the moment a question is answered, but the player stays on that question
 * until 下一題. Saving `sub` as-is meant a resumed lesson asked the answered
 * question again and counted it twice (小測 4 / 3 · 準確 133%). Once the current
 * question is answered, the cursor points at the next one, or at the beat
 * after the quiz if it was the last.
 *
 * @param {number} beat
 * @param {number} sub
 * @param {boolean} answeredCurrent  the question at `sub` has been answered
 * @param {number} quizLength
 * @returns {{ beat: number, sub: number }}
 */
export function quizResumePoint(beat, sub, answeredCurrent, quizLength) {
  if (beat !== QUIZ_BEAT || !answeredCurrent) return { beat, sub };
  if (sub + 1 < quizLength) return { beat, sub: sub + 1 };
  return { beat: beat + 1, sub: 0 };
}
