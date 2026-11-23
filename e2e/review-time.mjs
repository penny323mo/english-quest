// Exercise the real FSRS/store/UI with a controlled clock. No reload or navigation
// may be needed for a card to become reviewable while the learner waits here.
import assert from "node:assert/strict";
import { preview } from "vite";
import { chromium, webkit } from "playwright";
import { createEmptyCard } from "ts-fsrs";

const server = await preview({ preview: { host: "127.0.0.1", port: 0, strictPort: false } });
const origin = `http://127.0.0.1:${server.httpServer.address().port}/english-quest/`;
const start = new Date("2026-11-23T10:00:00Z");

async function seed(page, cards) {
  await page.goto(origin);
  await page.getByLabel("點稱呼你？").waitFor();
  await page.evaluate(async (cards) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("english-quest", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put({
        schemaVersion: 3,
        profile: { name: "Penny", goal: "foundation", minutes: 10, level: "new", jyutping: false, sound: false, xp: 0, streak: 0, lastActive: null },
        progress: {}, cards, lessonCursor: null, daily: null,
      }, "state");
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, cards);
  await page.goto(`${origin}#/review`);
  await page.reload();
  await page.getByRole("heading", { name: "到期先再睇" }).waitFor();
}

async function saved(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("english-quest", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction("kv").objectStore("kv").get("state");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
}

async function run(browserType, name) {
  const browser = await browserType.launch(name === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {});
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    context.setDefaultTimeout(10000);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.clock.install({ time: start });
    await page.clock.pauseAt(new Date(start.getTime() + 1000));
    const now = await page.evaluate(() => Date.now());
    const card = (id, due) => JSON.parse(JSON.stringify({ id, ...createEmptyCard(new Date(due)) }));
    await seed(page, { "fee-noun": card("fee-noun", now) });
    const fee = page.getByRole("heading", { name: "fee", exact: true });
    await fee.waitFor();
    await page.getByRole("button", { name: "揭曉意思" }).click();
    await page.getByRole("button", { name: "再來", exact: true }).click();
    await page.getByText(/今次溫完 1 張/).waitFor();
    const afterGrade = await saved(page);
    assert.equal(afterGrade.cards["fee-noun"].reps, 1);
    const delay = Date.parse(afterGrade.cards["fee-noun"].due) - await page.evaluate(() => Date.now());
    assert.ok(delay > 0, "Again must schedule a future review");
    await page.clock.runFor(delay - 1);
    assert.equal(await fee.count(), 0, "do not reveal a card before its due time");
    await page.clock.runFor(1);
    await fee.waitFor({ timeout: 2000 });
    assert.equal(await page.getByRole("button", { name: "揭曉意思" }).count(), 1, "the returning card starts with its answer hidden");
    assert.deepEqual(await saved(page), afterGrade, "the timer does not grade cards, award XP or write progress");
    console.log(`${name}: Again card returns exactly when due without a reload`);

    // A second rating must replace the previous deadline with the new schedule.
    await page.getByRole("button", { name: "揭曉意思" }).click();
    await page.getByRole("button", { name: "好", exact: true }).click();
    await page.getByText(/今次溫完 2 張/).waitFor();
    const gradedAgain = await saved(page);
    const next = Date.parse(gradedAgain.cards["fee-noun"].due);
    await page.clock.runFor(next - await page.evaluate(() => Date.now()) - 1);
    assert.equal(await fee.count(), 0);
    await page.clock.runFor(1);
    await fee.waitFor({ timeout: 2000 });
    console.log(`${name}: changing the schedule replaces the timer`);
    await context.close();

    // Simulate returning after sleep: wall time changes without timer callbacks.
    for (const event of ["focus", "visibilitychange"]) {
      const resumed = await browser.newContext({ serviceWorkers: "block" });
      resumed.setDefaultTimeout(10000);
      const tab = await resumed.newPage();
      tab.on("pageerror", error => errors.push(error.message));
      await tab.clock.install({ time: start });
      await tab.clock.pauseAt(new Date(start.getTime() + 1000));
      const due = start.getTime() + 60000;
      await seed(tab, { "led-verb": card("led-verb", due) });
      assert.equal(await tab.getByRole("heading", { name: "led", exact: true }).count(), 0);
      await tab.clock.setSystemTime(new Date(due + 1000));
      await tab.evaluate(event => (event === "focus" ? window : document).dispatchEvent(new Event(event)), event);
      await tab.getByRole("heading", { name: "led", exact: true }).waitFor({ timeout: 2000 });
      console.log(`${name}: ${event} refreshes after a suspended clock`);
      await resumed.close();
    }

    // FSRS can schedule farther ahead than the browser's maximum timeout delay.
    const longWait = await browser.newContext({ serviceWorkers: "block" });
    longWait.setDefaultTimeout(10000);
    const tab = await longWait.newPage();
    tab.on("pageerror", error => errors.push(error.message));
    await tab.clock.install({ time: start });
    await tab.clock.pauseAt(new Date(start.getTime() + 1000));
    const farDue = start.getTime() + 31 * 24 * 60 * 60 * 1000;
    await seed(tab, { "led-verb": card("led-verb", farDue) });
    const led = tab.getByRole("heading", { name: "led", exact: true });
    await tab.clock.fastForward(2 ** 31 - 1);
    assert.equal(await led.count(), 0);
    await tab.clock.fastForward(farDue - await tab.evaluate(() => Date.now()) - 1);
    assert.equal(await led.count(), 0);
    await tab.clock.runFor(1);
    await led.waitFor({ timeout: 2000 });
    console.log(`${name}: long review intervals re-arm after the timeout limit`);
    await longWait.close();
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}

try {
  for (const name of (process.env.EQ_BROWSERS || "chromium,webkit").split(",")) {
    await run({ chromium, webkit }[name], name);
  }
} finally { await new Promise(resolve => server.httpServer.close(resolve)); }
console.log("review-time e2e ok");
