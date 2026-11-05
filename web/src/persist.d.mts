import type { Profile, LessonDone, StoredCard } from "./types";
import type { DailyState } from "./daily.mjs";

export const SCHEMA_VERSION: number;
export const STATE_KEY: string;
export const FALLBACK_GOAL: "foundation";

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
  /** 每日抽卡. Optional and additive: records saved before it read as null. */
  daily?: DailyState | null;
};

export type SaveStatus =
  | { kind: "ok" }
  | { kind: "unsaved"; reason: string }
  | { kind: "readonly"; reason: string }
  /** Another tab or an older build wrote first; this tab must load the latest record. */
  | { kind: "conflict"; reason: string }
  /** Another tab is the writer; this tab shows its last state and does not save. */
  | { kind: "paused" };

export type PersistMode = "booting" | "ready" | "memory" | "readonly";

export type KvConn = {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<unknown>;
  /** Check and write in one readwrite transaction; resolves true when written. */
  putIf?(key: string, matches: (current: unknown) => boolean, value: unknown): Promise<boolean>;
  close(): void;
  onclose: (() => void) | null;
  onversionchange: (() => void) | null;
};

export function emptyPersisted(): Persisted;
export function fingerprint(record: unknown): string;
export function quizRecapLine(score: number, total: number, answered: number): string;
export function migrate(from: number, to: number, data: unknown): Persisted;
export function exportJson(data: Persisted): string;
export function checkImported(data: Persisted): Persisted;
export function importJson(raw: string): Persisted;
export function isMemoryOnlyError(err: unknown): boolean;
export function saveReason(err: unknown): string;
export function requestPersist(): void;
export function createKv(open: () => Promise<KvConn>): {
  drop(): void;
  getState(): Promise<unknown>;
  putState(value: unknown): Promise<unknown>;
  putStateIf(matches: (current: unknown) => boolean, value: unknown): Promise<boolean>;
};
export function createPersistence(open: () => Promise<KvConn>): {
  readonly mode: PersistMode;
  readonly status: SaveStatus;
  readonly snapshot: Persisted;
  drop(): void;
  hydrate(): Promise<{ ok: boolean; empty?: boolean; memory?: boolean }>;
  save(next: Persisted): Promise<{ ok: boolean; conflict?: boolean }>;
  saveNow(next: Persisted): Promise<{ ok: boolean; conflict?: boolean }>;
  retrySave(): Promise<{ ok: boolean }>;
};
