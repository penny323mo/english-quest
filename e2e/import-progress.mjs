// Only complete progress backups may reach the overwrite confirmation. Exercise
// the real file input and verify rejected files cannot replace persisted progress.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { preview } from "vite";
import { chromium, webkit } from "playwright";

const server = await preview({ preview: { host: "127.0.0.1", port: 0, strictPort: false } });
const origin = `http://127.0.0.1:${server.httpServer.address().port}/english-quest/`;

async function exported(page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出進度", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await download).path(), "utf8"));
}

async function pick(page, data) {
  await page.locator('input[type="file"]').setInputFiles({
    name: "progress.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(data)),
  });
}

async function run(browserType, name) {
  const browser = await browserType.launch(name === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {});
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, serviceWorkers: "block" });
    context.setDefaultTimeout(10000);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.goto(origin);
    await page.getByLabel("點稱呼你？").fill("Penny");
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByRole("radio", { name: /打好基礎/ }).click();
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByRole("button", { name: "開始", exact: true }).click();
    await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    await page.goto(`${origin}#/settings`);
    await page.getByRole("heading", { name: "設定" }).waitFor();

    const backup = await exported(page);
    backup.profile.xp = 42;
    backup.progress.F1 = { at: "2026-11-23T08:00:00.000Z", xp: 42 };
    const confirm = page.getByRole("button", { name: "確定匯入", exact: true });
    await pick(page, backup);
    await confirm.click();
    await page.getByText("已匯入呢部機。", { exact: true }).waitFor();
    assert.deepEqual(await exported(page), backup);

    const incomplete = structuredClone(backup);
    delete incomplete.progress;
    for (const data of [{}, { theme: "dark" }, incomplete, { ...backup, cards: null }]) {
      // Invalid input must also clear an earlier, still-unconfirmed valid file.
      await pick(page, { ...backup, profile: { ...backup.profile, name: "Ling" } });
      await confirm.waitFor();
      await pick(page, data);
      await page.getByText(/呢份檔案入面有啲進度唔啱，冇覆蓋/).waitFor();
      await confirm.waitFor({ state: "hidden" });
      assert.equal(await page.getByLabel("名字", { exact: true }).inputValue(), "Penny");
      assert.deepEqual(await exported(page), backup);
    }
    await page.reload();
    await page.getByRole("heading", { name: "設定" }).waitFor();
    assert.deepEqual(await exported(page), backup, "rejected files leave saved progress intact after reload");
    console.log(`${name}: unrelated, incomplete and null-container files are rejected without changing progress`);

    // A complete legacy backup still restores through the same UI.
    const legacy = { profile: { ...backup.profile, name: "Ling" }, progress: backup.progress, cards: backup.cards };
    await pick(page, legacy);
    await confirm.click();
    await page.getByText("已匯入呢部機。", { exact: true }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "設定" }).waitFor();
    assert.deepEqual(await exported(page), { ...backup, profile: legacy.profile });
    assert.deepEqual(errors, []);
    console.log(`${name}: complete legacy backups still restore and persist`);
    await context.close();
  } finally { await browser.close(); }
}

try {
  for (const name of (process.env.EQ_BROWSERS || "chromium,webkit").split(",")) await run({ chromium, webkit }[name], name);
} finally { await new Promise(resolve => server.httpServer.close(resolve)); }
console.log("import-progress e2e ok");
