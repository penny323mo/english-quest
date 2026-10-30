import type { Profile, LessonDone, StoredCard } from "./types";

export const SCHEMA_VERSION: number;
export const STATE_KEY: string;

export type LessonCursor = {
  lessonId: string;
  beat: number;
  sub: number;
  quizScore: number;
  quizAnswered: number;
};

export type Persisted = {
  schemaVersion: number;
  profile: Profile | null;
  progress: Record<string, LessonDone>;
  cards: Record<string, StoredCard>;
  lessonCursor: LessonCursor | null;
};

export type SaveStatus =
  | { kind: "ok" }
  | { kind: "unsaved"; reason: string }
  | { kind: "readonly"; reason: string };

export type PersistMode = "booting" | "ready" | "memory" | "readonly";

export type KvConn = {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<unknown>;
  close(): void;
  onclose: (() => void) | null;
  onversionchange: (() => void) | null;
};

export function emptyPersisted(): Persisted;
export function quizRecapLine(score: number, total: number, answered: number): string;
export function migrate(from: number, to: number, data: unknown): Persisted;
export function exportJson(data: Persisted): string;
export function importJson(raw: string): Persisted;
export function isMemoryOnlyError(err: unknown): boolean;
export function saveReason(err: unknown): string;
export function requestPersist(): void;
export function createKv(open: () => Promise<KvConn>): {
  drop(): void;
  getState(): Promise<unknown>;
  putState(value: unknown): Promise<unknown>;
};
export function createPersistence(open: () => Promise<KvConn>): {
  readonly mode: PersistMode;
  readonly status: SaveStatus;
  readonly snapshot: Persisted;
  drop(): void;
  hydrate(): Promise<{ ok: boolean; empty?: boolean; memory?: boolean }>;
  save(next: Persisted): Promise<{ ok: boolean }>;
  retrySave(): Promise<{ ok: boolean }>;
};
