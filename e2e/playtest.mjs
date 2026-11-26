import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export async function checkPlaytest(engine, origin, { downloadPack = true } = {}) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await page.goto(origin + "?trial=1");
    await page.getByRole("button", { name: "即試第一課" }).click();
    await page.getByRole("button", { name: "入去場景" }).click();
    const starter = page.getByRole("region", { name: "起步聆聽" });
    const wordAudio = page.waitForResponse(r => /\/(?:ship|sheep)-noun-word\.mp3$/.test(r.url()) && r.ok());
    await starter.getByRole("button", { name: "只聽聲揀意思" }).click();
    const word = (await wordAudio).url().includes("/ship-") ? "船" : "羊";
    const slow = page.waitForResponse(r => /\/(?:ship|sheep)-noun-word-slow\.mp3$/.test(r.url()) && r.ok());
    await starter.getByRole("button", { name: "慢速重播" }).click();
    await slow;
    await starter.getByRole("button", { name: word === "船" ? "羊" : "船", exact: true }).click();
    await starter.getByText("再聽一次，再揀過。").waitFor();
    await starter.getByRole("button", { name: word, exact: true }).click();
    await starter.getByText("聽啱咗。").waitFor();
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), 0);
    await page.reload();
    await page.getByRole("heading", { name: "繼續呢課？" }).waitFor();
    await page.getByRole("button", { name: "繼續", exact: true }).click();
    await page.getByRole("button", { name: "去聽" }).waitFor();

    await page.goto(origin + "?trial=1#/settings");
    const install = page.getByRole("button", { name: "下載完整課程包" });
    await install.waitFor();
    if (downloadPack) {
      await install.click();
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await page.getByRole("region", { name: "離線學習" }).getByRole("status").filter({ hasText: /正在下載|已齊備/ }).waitFor();
    }
    await page.getByRole("link", { name: "幫手盲聽錄音" }).click();
    const clip = page.locator("audio");
    const first = await clip.getAttribute("src");
    await page.waitForFunction(() => document.querySelector("audio").duration > 0);
    await clip.evaluate(async audio => { audio.muted = true; await audio.play(); audio.pause(); });
    await page.locator("#heard").fill("first answer");
    await page.locator("#next").click();
    const second = await clip.getAttribute("src");
    await page.locator("#heard").fill("unfinished");
    await page.locator("#note").fill("word ending");
    await page.reload();
    assert.equal(await clip.getAttribute("src"), second);
    assert.equal(await page.locator("#heard").inputValue(), "unfinished");
    assert.equal(await page.locator("#note").inputValue(), "word ending");
    const downloading = page.waitForEvent("download");
    await page.locator("#download").click();
    const csv = await readFile(await (await downloading).path(), "utf8");
    assert.ok(csv.includes(first.replace("english-quest/", "")));
    assert.ok(csv.includes("first answer"));
    assert.ok(!csv.includes("unfinished"));
    console.log(engine.name(), "passed quick F1, normal and slow audio, correction, resume and blind-listening export");
  } finally {
    await browser.close();
  }
}
