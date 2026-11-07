/// <reference types="vite/client" />

/** Set by vite.config.ts: when this build was made and from which commit. */
declare const __EQ_BUILD__: { time: string; sha: string };

/** content/lexicon.json without the 更多 extras (vite.config.ts, splitLexicon). */
declare module "virtual:lexicon" {
  const lexicon: { items: import("./types").LexItem[]; license: string; accent: string };
  export default lexicon;
}

/** The 更多 extras of each card, by card id: examples after the first two, and the mini-dialogue. */
declare module "virtual:lexicon-extras" {
  const extras: Record<string, import("./types").LexExtras>;
  export default extras;
}
