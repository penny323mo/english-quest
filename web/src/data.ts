import lexFile from "../../content/lexicon.json";
import pathFile from "../../content/path.json";
import f1 from "../../content/lessons/f1.json";
import f2 from "../../content/lessons/f2.json";
import j1 from "../../content/lessons/j1.json";
import j2 from "../../content/lessons/j2.json";
import t1 from "../../content/lessons/t1.json";
import r1 from "../../content/lessons/r1.json";
import type { Goal, Lesson, LexItem, PathFile } from "./types";

export const lexicon = lexFile as unknown as { items: LexItem[]; license: string; accent: string };
export const pathData = pathFile as unknown as PathFile;
export const lessons = [f1, f2, j1, j2, t1, r1] as unknown as Lesson[];

export const SHIPPED = ["F1", "F2", "J1", "J2", "T1", "R1"] as const;

export const lessonById: Record<string, Lesson> = Object.fromEntries(lessons.map((l) => [l.id, l]));
export const lexById: Record<string, LexItem> = Object.fromEntries(lexicon.items.map((i) => [i.id, i]));

export const GOAL_LABEL: Record<Goal, string> = {
  foundation: "打好基礎",
  jewellery: "珠寶櫃檯",
  travel: "旅行登機",
  restaurant: "餐廳入座",
};

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
