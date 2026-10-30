import lexFile from "../../content/lexicon.json";
import pathFile from "../../content/path.json";
import f1 from "../../content/lessons/f1.json";
import f2 from "../../content/lessons/f2.json";
import f3 from "../../content/lessons/f3.json";
import f4 from "../../content/lessons/f4.json";
import j1 from "../../content/lessons/j1.json";
import j2 from "../../content/lessons/j2.json";
import j3 from "../../content/lessons/j3.json";
import j4 from "../../content/lessons/j4.json";
import j5 from "../../content/lessons/j5.json";
import j6 from "../../content/lessons/j6.json";
import j7 from "../../content/lessons/j7.json";
import t1 from "../../content/lessons/t1.json";
import t2 from "../../content/lessons/t2.json";
import t3 from "../../content/lessons/t3.json";
import r1 from "../../content/lessons/r1.json";
import r2 from "../../content/lessons/r2.json";
import r3 from "../../content/lessons/r3.json";
import t4 from "../../content/lessons/t4.json";
import t5 from "../../content/lessons/t5.json";
import r4 from "../../content/lessons/r4.json";
import r5 from "../../content/lessons/r5.json";
import w1 from "../../content/lessons/w1.json";
import j8 from "../../content/lessons/j8.json";
import j9 from "../../content/lessons/j9.json";
import j10 from "../../content/lessons/j10.json";
import t6 from "../../content/lessons/t6.json";
import d1 from "../../content/lessons/d1.json";
import w2 from "../../content/lessons/w2.json";
import w3 from "../../content/lessons/w3.json";
import decksFile from "../../content/decks.json";
import type { DeckFile, Goal, Lesson, LexItem, PathFile } from "./types";

export const lexicon = lexFile as unknown as { items: LexItem[]; license: string; accent: string };
export const pathData = pathFile as unknown as PathFile;
export const lessons = [f1, f2, f3, f4, j1, r1, j2, t1, j3, t2, r2, j4, j5, t3, r3, t4, r4, j6, j7, t5, r5, w1, d1, j8, j9, j10, t6, w2, w3] as unknown as Lesson[];
export const decks = decksFile as unknown as DeckFile;

export const SHIPPED = ["F1", "F2", "F3", "F4", "J1", "R1", "J2", "T1", "J3", "T2", "R2", "J4", "J5", "T3", "R3", "T4", "R4", "J6", "J7", "T5", "R5", "W1", "D1", "J8", "J9", "J10", "T6", "W2", "W3"] as const;

export const lessonById: Record<string, Lesson> = Object.fromEntries(lessons.map((l) => [l.id, l]));
export const lexById: Record<string, LexItem> = Object.fromEntries(lexicon.items.map((i) => [i.id, i]));

export { GOAL_LABEL } from "./goals";

export const CAST_LABEL: Record<string, string> = {
  mei: "Mei",
  tom: "Tom",
  ana: "Ana",
  kai: "Kai",
  ling: "你",
};

export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return base + path.replace(/^\//, "");
}

export function isLessonOpen(id: string, goal: Goal, progress: Record<string, unknown>): boolean {
  if (!lessonById[id]) return false;
  if (id === "F1") return true;
  const order = SHIPPED as readonly string[];
  const idx = order.indexOf(id);
  const prev = idx > 0 ? order[idx - 1] : "";
  if (prev && progress[prev]) return true;
  if (goal === "jewellery" && id === "J1") return true;
  if (goal === "jewellery" && id === "J2" && progress.J1) return true;
  if (goal === "travel" && id === "T1") return true;
  if (goal === "restaurant" && id === "R1") return true;
  return false;
}

export function go(hash: string) {
  const next = hash.startsWith("#") ? hash : `#${hash}`;
  if (location.hash !== next) location.hash = next;
  else window.dispatchEvent(new HashChangeEvent("hashchange"));
}
