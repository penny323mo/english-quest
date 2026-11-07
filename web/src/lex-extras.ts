import { useEffect, useState } from "react";
import type { LexExtras } from "./types";

/**
 * The 更多 part of each word card (later examples, mini-dialogue) is its own chunk,
 * fetched the first time any card opens 更多. The service worker precaches the chunk
 * like any other script, so it also opens offline.
 */
type ExtrasById = Record<string, LexExtras>;

let loaded: ExtrasById | null = null;
let pending: Promise<ExtrasById> | null = null;
const listeners = new Set<() => void>();

export function loadLexExtras(): Promise<ExtrasById> {
  if (loaded) return Promise.resolve(loaded);
  if (!pending) {
    pending = import("virtual:lexicon-extras")
      .then((mod) => {
        loaded = mod.default;
        for (const fn of listeners) fn();
        return loaded;
      })
      .catch((err) => {
        pending = null; // let a later 更多 try again
        throw err;
      });
  }
  return pending;
}

/** Already-loaded extras, or null. */
export function lexExtrasNow(): ExtrasById | null {
  return loaded;
}

/** Subscribe to the extras arriving (media.ts rebuilds its lookup then). */
export function onLexExtras(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The card's extras once `want` is true and the chunk has loaded; null until then. */
export function useLexExtras(id: string, want: boolean): LexExtras | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!want || loaded) return;
    let live = true;
    loadLexExtras().then(() => live && setTick((n) => n + 1), () => undefined);
    return () => {
      live = false;
    };
  }, [want]);
  return want && loaded ? loaded[id] || { examples: [], miniDialogue: [] } : null;
}
