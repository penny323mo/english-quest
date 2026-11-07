// Fixes from the overall review: on-demand word-card extras (finding 1), the lexicon
// split out of the shell bundle (finding 2), the startup art preload (finding 3), and
// one calendar day for the streak and 每日抽卡 (finding 4).
import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { EXTRAS_CACHE, extraKey, isExtraClip, planExtrasPurge } from "../web/src/sw-extras.mjs";
import { isOwnCache } from "../web/src/cache-scope.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const lex = JSON.parse(read("content/lexicon.json"));

test("only 更多 clips are left to on-demand caching", () => {
  assert.equal(isExtraClip("assets/audio/words/silver-noun-ex3.mp3"), true);
  assert.equal(isExtraClip("assets/audio/words/silver-noun-ex3-slow.mp3"), true);
  assert.equal(isExtraClip("https://h/english-quest/assets/audio/words/bow-verb-md0.mp3"), true);
  assert.equal(isExtraClip("assets/audio/words/bow-verb-md12-slow.mp3?x=1"), true);
  // Shown without 更多, or played in lessons and 每日抽卡: stay precached.
  assert.equal(isExtraClip("assets/audio/words/silver-noun-ex2.mp3"), false);
  assert.equal(isExtraClip("assets/audio/words/silver-noun.mp3"), false);
  assert.equal(isExtraClip("assets/audio/words/silver-noun-word.mp3"), false);
  assert.equal(isExtraClip("assets/audio/lines/j1-l1.mp3"), false);
  assert.equal(isExtraClip("assets/audio/lines/j1-md0.mp3"), false);
});

test("every 更多 clip on a card is matched, and no lesson or line plays one", () => {
  for (const item of lex.items) {
    for (const example of (item.examples || []).slice(2)) {
      assert.equal(isExtraClip(example.audio), true, example.audio);
      assert.equal(isExtraClip(example.audioSlow), true, example.audioSlow);
    }
    for (const example of (item.examples || []).slice(0, 2)) assert.equal(isExtraClip(example.audio), false, example.audio);
    assert.equal(isExtraClip(item.audio), false, item.audio);
  }
  for (const name of fs.readdirSync(path.join(root, "content/lessons"))) {
    assert.equal(/-(?:ex[3-9]|md\d+)(?:-slow)?\.mp3/.test(read(`content/lessons/${name}`)), false, name);
  }
});

test("a re-rendered extra gets a new key and the stale copy is purged", () => {
  const url = "https://h/english-quest/assets/audio/words/bow-verb-md0.mp3";
  const old = extraKey(url, "aaa");
  const now = extraKey(url, "bbb");
  assert.notEqual(old, now);
  assert.deepEqual(planExtrasPurge([old, now, `${url}-gone`], [now]), [old, `${url}-gone`]);
  assert.equal(extraKey(url, null), url);
});

test("the extras cache is English Quest's and the activate purge keeps it", () => {
  assert.equal(isOwnCache(EXTRAS_CACHE, "https://h/english-quest/"), true);
  const sw = read("web/src/sw.ts");
  assert.match(sw, /if \(key === EXTRAS_CACHE\) \{/);
  assert.match(sw, /const manifest = built\.filter\(\(entry\) => !isExtraClip\(entryUrl\(entry\)\)\);/);
  assert.match(sw, /planExtrasPurge\(/);
});

test("the shell bundles the lean lexicon; 更多 loads the rest", () => {
  assert.match(read("web/src/data.ts"), /import lexFile from "virtual:lexicon";/);
  assert.match(read("web/src/lex-extras.ts"), /import\("virtual:lexicon-extras"\)/);
  for (const file of ["web/src/Vocab.tsx", "web/src/pages.tsx"]) {
    const src = read(file);
    assert.match(src, /useLexExtras\(/, file);
    assert.equal(/item\.miniDialogue/.test(src), false, `${file} reads the mini-dialogue from the lean card`);
  }
});

test("the shell preloads the next lesson's art only, not every lesson", () => {
  const src = read("web/src/shell.tsx");
  assert.equal(/lessons\.map\(\(lesson\) => asset\(lesson\.hero\)\)/.test(src), false);
  assert.match(src, /preloadArt\(\[/);
});

const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "eq-streak-")), "store.mjs");
await build({
  entryPoints: [path.join(root, "web/src/store.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  alias: { idb: path.join(root, "tests/helpers/fake-idb.mjs") },
  logLevel: "silent",
});
// The store opens a BroadcastChannel on import; close it so the run can exit.
const channels = [];
const Native = globalThis.BroadcastChannel;
globalThis.BroadcastChannel = class extends Native {
  constructor(name) {
    super(name);
    channels.push(this);
  }
};
const { bumpStreak } = await import(pathToFileURL(out).href);
test.after(() => {
  for (const channel of channels.splice(0)) channel.close();
});

test("the streak counts Macau days, the same day as 每日抽卡", () => {
  const base = { name: "Ling", goal: "travel", minutes: 15, level: "new", jyutping: false, sound: true, xp: 0, streak: 3, lastActive: "2026-11-04" };
  // 16:30 UTC on 4 Nov is already 5 Nov in Macau, whatever the device's zone.
  const next = bumpStreak(base, new Date("2026-11-04T16:30:00Z"));
  assert.equal(next.lastActive, "2026-11-05");
  assert.equal(next.streak, 4);
  // 15:59 UTC is still 4 Nov in Macau: same day, no change.
  assert.equal(bumpStreak(base, new Date("2026-11-04T15:59:00Z")), base);
  // A missed Macau day starts again at 1, across a month end too.
  assert.equal(bumpStreak(base, new Date("2026-11-06T02:00:00Z")).streak, 1);
  assert.equal(bumpStreak({ ...base, lastActive: "2026-10-31" }, new Date("2026-11-01T01:00:00Z")).streak, 4);
});
