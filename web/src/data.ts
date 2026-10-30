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
import decksFile from "../../content/decks.json";
import type { DeckFile, Goal, Lesson, LexItem, PathFile } from "./types";

export const lexicon = lexFile as unknown as { items: LexItem[]; license: string; accent: string };
export const pathData = pathFile as unknown as PathFile;
export const lessons = [f1, f2, f3, f4, j1, j2, j3, j4, j5, j6, j7, t1, t2, t3, r1, r2, r3] as unknown as Lesson[];
export const decks = decksFile as unknown as DeckFile;

export const SHIPPED = ["F1", "F2", "F3", "F4", "J1", "J2", "J3", "J4", "J5", "J6", "J7", "T1", "T2", "T3", "R1", "R2", "R3"] as const;

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
