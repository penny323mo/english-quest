import lexFile from "../../content/lexicon.json";
import pathFile from "../../content/path.json";
import f1 from "../../content/lessons/f1.json";
import f2 from "../../content/lessons/f2.json";
import f3 from "../../content/lessons/f3.json";
import f4 from "../../content/lessons/f4.json";
import f5 from "../../content/lessons/f5.json";
import f6 from "../../content/lessons/f6.json";
import j1 from "../../content/lessons/j1.json";
import j2 from "../../content/lessons/j2.json";
import j3 from "../../content/lessons/j3.json";
import j4 from "../../content/lessons/j4.json";
import j5 from "../../content/lessons/j5.json";
import j6 from "../../content/lessons/j6.json";
import j7 from "../../content/lessons/j7.json";
import t1 from "../../content/lessons/t1.json";
import r10 from "../../content/lessons/r10.json";
import t2 from "../../content/lessons/t2.json";
import t11 from "../../content/lessons/t11.json";
import t3 from "../../content/lessons/t3.json";
import r1 from "../../content/lessons/r1.json";
import r2 from "../../content/lessons/r2.json";
import r3 from "../../content/lessons/r3.json";
import t4 from "../../content/lessons/t4.json";
import t5 from "../../content/lessons/t5.json";
import r4 from "../../content/lessons/r4.json";
import d6 from "../../content/lessons/d6.json";
import r9 from "../../content/lessons/r9.json";
import r5 from "../../content/lessons/r5.json";
import w1 from "../../content/lessons/w1.json";
import j8 from "../../content/lessons/j8.json";
import j9 from "../../content/lessons/j9.json";
import j10 from "../../content/lessons/j10.json";
import t6 from "../../content/lessons/t6.json";
import d1 from "../../content/lessons/d1.json";
import d2 from "../../content/lessons/d2.json";
import t7 from "../../content/lessons/t7.json";
import w2 from "../../content/lessons/w2.json";
import w3 from "../../content/lessons/w3.json";
import w8 from "../../content/lessons/w8.json";
import d3 from "../../content/lessons/d3.json";
import d8 from "../../content/lessons/d8.json";
import t10 from "../../content/lessons/t10.json";
import d4 from "../../content/lessons/d4.json";
import d5 from "../../content/lessons/d5.json";
import d7 from "../../content/lessons/d7.json";
import j12 from "../../content/lessons/j12.json";
import t8 from "../../content/lessons/t8.json";
import j11 from "../../content/lessons/j11.json";
import w4 from "../../content/lessons/w4.json";
import r8 from "../../content/lessons/r8.json";
import w7 from "../../content/lessons/w7.json";
import r6 from "../../content/lessons/r6.json";
import w5 from "../../content/lessons/w5.json";
import j14 from "../../content/lessons/j14.json";
import r7 from "../../content/lessons/r7.json";
import w6 from "../../content/lessons/w6.json";
import t9 from "../../content/lessons/t9.json";
import j13 from "../../content/lessons/j13.json";
import j15 from "../../content/lessons/j15.json";
import t12 from "../../content/lessons/t12.json";
import d9 from "../../content/lessons/d9.json";
import r11 from "../../content/lessons/r11.json";
import w9 from "../../content/lessons/w9.json";
import j16 from "../../content/lessons/j16.json";
import t13 from "../../content/lessons/t13.json";
import d10 from "../../content/lessons/d10.json";
import j17 from "../../content/lessons/j17.json";
import r12 from "../../content/lessons/r12.json";
import w10 from "../../content/lessons/w10.json";
import t14 from "../../content/lessons/t14.json";
import r13 from "../../content/lessons/r13.json";
import j18 from "../../content/lessons/j18.json";
import d11 from "../../content/lessons/d11.json";
import d12 from "../../content/lessons/d12.json";
import t15 from "../../content/lessons/t15.json";
import w11 from "../../content/lessons/w11.json";
import decksFile from "../../content/decks.json";
import type { DeckFile, Goal, Lesson, LexItem, PathFile } from "./types";

export const lexicon = lexFile as unknown as { items: LexItem[]; license: string; accent: string };
export const pathData = pathFile as unknown as PathFile;
export const lessons = [f1, f2, f3, f4, f5, j1, r1, f6, j2, t1, r10, d4, d5, d7, j3, t2, t11, r2, j4, j5, t3, r3, t4, r4, d6, r9, r13, j6, j7, j15, j18, t5, t12, t15, t13, r12, r5, r11, w1, d1, d12, d2, t7, w4, r8, d10, w7, j8, d9, d11, j9, j10, j16, j17, t6, r6, j12, r7, t8, w2, w3, w9, w8, w11, d3, d8, t10, t14, w5, w10, j14, j11, w6, t9, j13] as unknown as Lesson[];
export const decks = decksFile as unknown as DeckFile;

export const SHIPPED = ["F1", "F2", "F3", "F4", "F5", "J1", "R1", "F6", "J2", "T1", "R10", "D4", "D5", "D7", "J3", "T2", "T11", "R2", "J4", "J5", "T3", "R3", "T4", "R4", "D6", "R9", "R13", "J6", "J7", "J15", "J18", "T5", "T12", "T15", "T13", "R12", "R5", "R11", "W1", "D1", "D12", "D2", "T7", "W4", "R8", "D10", "W7", "J8", "D9", "D11", "J9", "J10", "J16", "J17", "T6", "R6", "J12", "R7", "T8", "W2", "W3", "W9", "W8", "W11", "D3", "D8", "T10", "T14", "W5", "W10", "J14", "J11", "W6", "T9", "J13"] as const;

export const lessonById: Record<string, Lesson> = Object.fromEntries(lessons.map((l) => [l.id, l]));
export const lexById: Record<string, LexItem> = Object.fromEntries(lexicon.items.map((i) => [i.id, i]));

export { GOAL_LABEL } from "./goals";

export const CAST_LABEL: Record<string, string> = {
  mei: "Mei",
  tom: "Tom",
  ana: "Ana",
  kai: "Kai",
  ling: "你",
  jo: "Jo",
  sam: "Sam",
  kim: "Kim",
  ray: "Ray",
  noa: "Noa",
  may: "May",
  pat: "Pat",
  nia: "Nia",
  ada: "Ada",
  owen: "Owen",
  wen: "Wen",
  ben: "Ben",
  lea: "Lea",
  ren: "Ren",
  mina: "Mina",
  cole: "Cole",
  suki: "Suki",
  ruth: "Ruth",
  hugh: "Hugh",
  zuri: "Zuri",
  lina: "Lina",
  pesi: "Pesi",
  nori: "Nori",
  eddy: "Eddy",
  reid: "Reid",
  ines: "Ines",
  opal: "Opal",
  hugo: "Hugo",
  wynn: "Wynn",
  beau: "Beau",
  niles: "Niles",
  sora: "Sora",
  ida: "Ida",
  gus: "Gus",
  mira: "Mira",
  cleo: "Cleo",
  otto: "Otto",
  hana: "Hana",
  glen: "Glen",
  nell: "Nell",
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
