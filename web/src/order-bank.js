import { seededOrder } from './choice-order.js';

/** Shuffle identities, not labels. Rendered labels handle learner placeholders.
 * Stable for a fixed seed; never mutate content or reshuffle after a click.
 * Some banks (including equivalent phrase blocks) have no different visible order.
 */
export function orderTokenIndices(tokens, answer, seed, labels = tokens, answerLabels = answer) {
  const order = seededOrder(tokens.length, seed);
  if (order.map(i => labels[i]).join(' ') === answerLabels.join(' ')) {
    for (let a = 0; a < order.length; a++) {
      for (let b = a + 1; b < order.length; b++) {
        [order[a], order[b]] = [order[b], order[a]];
        if (order.map(i => labels[i]).join(' ') !== answerLabels.join(' ')) return order;
        // Different blocks may still join to identical text; undo and try another pair.
        [order[a], order[b]] = [order[b], order[a]];
      }
    }
  }
  return order;
}
