import { createEmptyCard, fsrs, type Card, type Grade } from "ts-fsrs";
import type { StoredCard } from "./types";

const engine = fsrs();

function serialize(id: string, card: Card): StoredCard {
  return {
    id,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  };
}

function deserialize(stored: StoredCard): Card {
  return {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsed_days,
    scheduled_days: stored.scheduled_days,
    learning_steps: stored.learning_steps,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state as Card["state"],
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  };
}

export function makeNewCard(id: string, now = new Date()): StoredCard {
  return serialize(id, createEmptyCard(now));
}

export function reviewStored(stored: StoredCard, rating: Grade, now = new Date()): StoredCard {
  const result = engine.next(deserialize(stored), now, rating);
  return serialize(stored.id, result.card);
}

export function isDue(stored: StoredCard, now = new Date()): boolean {
  return new Date(stored.due).getTime() <= now.getTime();
}
