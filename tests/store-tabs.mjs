// The real store.ts and persist.mjs, run as two tabs in node (each import is its own
// module instance), with BroadcastChannel and a serial fake IndexedDB. Covers three
// ways the single-writer flow lost progress or got stuck (review of #28):
// 1. saves queued before a conflict must not run once the tab has reloaded;
// 2. a save finishing after another tab took over must not clear the pause;
// 3. in memory mode (no IndexedDB) taking over must not wipe the session.
import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { freshDb, noDb } from "./helpers/fake-idb.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "eq-store-")), "store.mjs");
await build({
  entryPoints: [path.join(root, "web/src/store.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  alias: { idb: path.join(root, "tests/helpers/fake-idb.mjs") },
  logLevel: "silent",
});

// Every tab's channel, so each test can close them (and the process can exit).
const channels = [];
const Native = globalThis.BroadcastChannel;
globalThis.BroadcastChannel = class extends Native {
  constructor(name) {
    super(name);
    channels.push(this);
  }
};

let n = 0;
async function openTab() {
  n += 1;
  const mod = await import(`${pathToFileURL(out).href}?tab=${n}`);
  await mod.hydrate();
  return mod;
}
const settle = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
function closeTabs() {
  for (const channel of channels.splice(0)) channel.close();
}

const profile = { name: "Penny", goal: "foundation", minutes: 15, level: "new", jyutping: false, sound: true, xp: 0, streak: 0, lastActive: null };
const record = (extra = {}) => ({ schemaVersion: 3, profile, progress: {}, cards: {}, lessonCursor: null, daily: null, ...extra });

test("saves queued before a conflict are dropped once the tab reloads", async (t) => {
  t.after(closeTabs);
  const db = freshDb(record());
  const tab = await openTab();
  // Another tab saves J1 (its writer notice did not reach this tab).
  const stored = db.box.get("state");
  db.box.set("state", { ...stored, progress: { J1: { at: "2026-11-05T01:00:00.000Z", xp: 15 } }, rev: (stored.rev || 0) + 1 });
  // This tab, still on its old copy, changes the name several times in a row.
  for (const name of ["P", "Pe", "Pen", "Penn"]) tab.useStore.getState().updateProfile({ name });
  await settle(120);
  assert.ok(db.box.get("state").progress.J1, "the other tab's J1 is kept");
  assert.ok(tab.useStore.getState().progress.J1, "this tab now shows J1");
  // After reloading it edits on top of the latest copy, and that save goes through.
  tab.useStore.getState().updateProfile({ name: "Ling" });
  await settle();
  assert.equal(db.box.get("state").profile.name, "Ling");
  assert.ok(db.box.get("state").progress.J1);
});

test("a save that finishes after another tab took over keeps this tab paused", async (t) => {
  t.after(closeTabs);
  const db = freshDb(record());
  const one = await openTab();
  // Hold this tab's write in flight.
  let release;
  db.gate = new Promise((resolve) => { release = resolve; });
  one.useStore.getState().updateProfile({ name: "Ling" });
  await settle();
  // Another tab (which read the record before this write began) becomes the writer now.
  const other = new BroadcastChannel("english-quest-progress");
  other.postMessage({ type: "writer", id: "another-tab" });
  await settle();
  assert.equal(one.useStore.getState().paused, true, "paused by the other tab");
  release();
  await settle();
  const s = one.useStore.getState();
  assert.equal(s.paused, true, "the finished save does not clear the pause");
  assert.equal(s.writable, false);
  // Continuing still works: it reloads, becomes the writer and tells the other tab.
  const notices = [];
  other.onmessage = (event) => notices.push(event.data);
  await one.takeOver();
  await settle();
  assert.equal(one.useStore.getState().paused, false);
  assert.equal(one.useStore.getState().writable, true);
  assert.equal(one.useStore.getState().profile.name, "Ling", "its own finished save is what it reloads");
  assert.ok(notices.some((n) => n.type === "writer"));
  other.close();
});

test("in memory mode, taking over keeps this tab's session", async (t) => {
  t.after(closeTabs);
  noDb(); // IndexedDB is unavailable: the app runs in memory mode
  const tab = await openTab();
  tab.useStore.getState().setProfile({ ...profile, name: "Ling" });
  tab.useStore.getState().completeLesson("F1", 15);
  await settle();
  await tab.takeOver();
  const s = tab.useStore.getState();
  assert.equal(s.profile?.name, "Ling");
  assert.ok(s.progress.F1, "F1 is still there");
  // A writer notice from another tab does not pause a memory-only tab either.
  const other = new BroadcastChannel("english-quest-progress");
  other.postMessage({ type: "writer", id: "someone-else" });
  await settle();
  other.close();
  assert.notEqual(tab.useStore.getState().paused, true);
  assert.equal(tab.useStore.getState().writable, true);
});
