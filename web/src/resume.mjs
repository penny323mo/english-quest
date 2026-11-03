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

/** Beats that show one item at a time, and the lesson list each one walks. */
export const ITEM_BEATS = { 3: "understand", 4: "chunks", 6: "build", 7: "roleplay", 8: "quiz" };

/** How many items each item beat has in this lesson. */
export function itemCounts(lesson) {
  return {
    3: lesson.understand.length,
    4: lesson.chunks.length,
    6: lesson.build.length,
    7: lesson.roleplay.turns.length,
    8: lesson.quiz.length,
  };
}

/**
 * Make a saved step safe to resume.
 *
 * A cursor can point past a beat's last item: the lesson was edited after it
 * was saved, or it came from an import or an older build. The player then
 * rendered nothing and showed no buttons. A step past the end moves on to
 * the next beat (again if that is empty too); a beat outside the resumable
 * range 1–9 restarts the lesson from the hook.
 *
 * @param {number} beat
 * @param {number} sub
 * @param {Record<number, number>} counts  from itemCounts(lesson)
 * @returns {{ beat: number, sub: number, restart: boolean }}
 */
export function clampResumePoint(beat, sub, counts) {
  if (!Number.isInteger(beat) || beat < 1 || beat > 9) return { beat: 0, sub: 0, restart: true };
  let b = beat;
  let s = Number.isInteger(sub) && sub >= 0 ? sub : 0;
  while (b <= 9 && b in counts && s >= counts[b]) {
    b += 1;
    s = 0;
  }
  if (!(b in counts)) s = 0;
  return { beat: b, sub: s, restart: false };
}
