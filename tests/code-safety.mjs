// Update and save safety fixes from review/v1-audit.md (P1-3, P1-4, P1-6).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { planPrecachePurge } from "../web/src/sw-purge.mjs";
import { QUIZ_BEAT, quizResumePoint } from "../web/src/resume.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "web/index.html"), "utf8");
const killScript = html.match(/<script>\s*([\s\S]*?eq-sw-kill[\s\S]*?)<\/script>/)[1];

/**
 * Run the inline kill-switch with a fake service worker that answers the ping
 * after `replyAfter` ms (or never), on a fake clock.
 */
async function runKillSwitch({ replyAfter }) {
  const timers = [];
  let now = 0;
  const calls = { unregister: 0, cachesDeleted: 0, reloads: 0, pings: 0 };
  const session = new Map();
  const controller = {
    postMessage(message, ports) {
      calls.pings += 1;
      if (replyAfter == null) return;
      timers.push({ at: now + replyAfter, fn: () => ports[0].onmessageReply({ eq: 2 }) });
    },
  };
  class MessageChannel {
    constructor() {
      const port1 = { onmessage: null };
      this.port1 = port1;
      this.port2 = { onmessageReply: (data) => port1.onmessage && port1.onmessage({ data }) };
    }
  }
  const sandbox = {
    window: {},
    navigator: {
      serviceWorker: {
        controller,
        addEventListener() {},
        getRegistrations: async () => [{ unregister: async () => { calls.unregister += 1; } }],
      },
    },
    caches: { keys: async () => ["a", "b"], delete: async () => { calls.cachesDeleted += 1; } },
    location: { reload() { calls.reloads += 1; } },
    sessionStorage: { getItem: (k) => session.get(k) ?? null, setItem: (k, v) => session.set(k, v) },
    MessageChannel,
    setTimeout: (fn, ms) => { const t = { at: now + ms, fn }; timers.push(t); return t; },
    clearTimeout: (t) => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
    Promise,
  };
  sandbox.window.caches = sandbox.caches;
  vm.createContext(sandbox);
  vm.runInContext(killScript, sandbox);
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  let finished = false;
  sandbox.window.__eqKill.then(() => { finished = true; });
  await settle();
  // Advance the fake clock to 10 s in 100 ms steps.
  for (let step = 0; step <= 100 && !finished && calls.reloads === 0; step += 1) {
    now = step * 100;
    for (const t of timers.filter((t) => t.at <= now)) {
      timers.splice(timers.indexOf(t), 1);
      t.fn();
    }
    await settle();
  }
  return { ...calls, finished, session };
}

test("a slow but healthy service worker is not killed (P1-3)", async () => {
  const slow = await runKillSwitch({ replyAfter: 3000 });
  assert.equal(slow.finished, true);
  assert.equal(slow.unregister, 0, "no unregister");
  assert.equal(slow.cachesDeleted, 0, "Cache Storage kept");
  assert.equal(slow.reloads, 0);
  assert.deepEqual([...slow.session.keys()], ["eq-skip-claim"], "only the existing skip-claim flag is written");
});

test("a worker that never answers is still replaced", async () => {
  const dead = await runKillSwitch({ replyAfter: null });
  assert.equal(dead.unregister, 1);
  assert.equal(dead.cachesDeleted, 2);
  assert.equal(dead.reloads, 1);
});

test("the precache purge drops stale revisions of current files (P1-4)", () => {
  const base = "https://penny323mo.github.io/english-quest/";
  const keep = [
    `${base}assets/audio/words/gold-noun.mp3?__WB_REVISION__=new`,
    `${base}assets/index-abc12345.js`,
  ];
  const cached = [
    ...keep,
    `${base}assets/audio/words/gold-noun.mp3?__WB_REVISION__=old`,
  ];
  assert.deepEqual(planPrecachePurge(cached, keep), {
    remove: [`${base}assets/audio/words/gold-noun.mp3?__WB_REVISION__=old`],
    shellChanged: false,
  });
  const withOldShell = [...cached, `${base}index.html?__WB_REVISION__=1`];
  const plan = planPrecachePurge(withOldShell, keep);
  assert.equal(plan.remove.length, 2);
  assert.equal(plan.shellChanged, true, "a file that left the manifest still reloads open windows");
  assert.deepEqual(planPrecachePurge(keep, keep), { remove: [], shellChanged: false });
});

test("sw.ts purges by full cache key", () => {
  const sw = fs.readFileSync(path.join(root, "web/src/sw.ts"), "utf8");
  assert.match(sw, /planPrecachePurge\(/);
  assert.match(sw, /getURLsToCacheKeys\(\)/);
});

test("a resumed quiz does not ask an answered question again (P1-6)", () => {
  assert.equal(QUIZ_BEAT, 8);
  assert.deepEqual(quizResumePoint(8, 2, false, 5), { beat: 8, sub: 2 }, "unanswered: stay");
  assert.deepEqual(quizResumePoint(8, 2, true, 5), { beat: 8, sub: 3 }, "answered: next question");
  assert.deepEqual(quizResumePoint(8, 4, true, 5), { beat: 9, sub: 0 }, "last answered: next beat");
  assert.deepEqual(quizResumePoint(6, 1, true, 5), { beat: 6, sub: 1 }, "other beats unchanged");
  const lesson = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(lesson, /quizResumePoint\(beat, sub, answeredAt === sub, lesson\.quiz\.length\)/);
  assert.match(lesson, /setAnsweredAt\(sub\)/);
});
