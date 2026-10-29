import labels from "../../content/sense-labels.json";
import type { LexItem } from "./types";

const posLabel = labels.pos as Record<string, string>;
const senseLabel = labels.sense as Record<string, string>;

export function learnerEyebrow(item: Pick<LexItem, "pos" | "senseId">): string {
  const pos = posLabel[item.pos] || "詞";
  const sense = senseLabel[`${item.pos}:${item.senseId}`];
  return sense ? `${pos} · ${sense}` : pos;
}
