// Two tabs of the app on one device must never overwrite each other's progress
// (review finding 1). The newest tab saves; the other pauses and shows a notice. A
// paused tab that continues first loads what the other tab saved, including a fresh
// tab still on onboarding. Chromium and WebKit.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
}
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".webmanifest": "application/manifest+json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg" };
const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const prefix = "/english-quest";
  if (!url.pathname.startsWith(prefix)) {
    res.writeHead(404);
    res.end("missing");
    return;
  }
  let rel = decodeURIComponent(url.pathname.slice(prefix.length));
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(dist, rel));
  if (!file.startsWith(dist) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end("missing");
    return;
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}/english-quest/`;

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`assert ${label}: ${ok ? "pass" : "FAIL"}${detail ? ` ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function onboard(page) {
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill("Penny");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByText("打好基礎", { exact: true }).first().click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
}

async function settings(page) {
  await page.goto(`${origin}#/settings`);
  await page.getByRole("heading", { name: "設定" }).waitFor();
}

async function exported(page) {
  await settings(page);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出進度" }).click();
  return JSON.parse(fs.readFileSync(await (await download).path(), "utf8"));
}

const paused = (page) => page.locator('[data-save="paused"]');

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  const launch = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const one = await context.newPage();
    one.setDefaultTimeout(30000);
    await onboard(one);

    // A second tab opens: it becomes the writer and the first tab pauses.
    const two = await context.newPage();
    two.setDefaultTimeout(30000);
    await two.goto(origin, { waitUntil: "domcontentloaded" });
    await two.getByRole("heading", { name: "學習路徑" }).waitFor();
    await paused(one).waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} the first tab pauses when a second tab opens`, (await paused(one).count()) === 1);

    // The second tab saves a change.
    await settings(two);
    await two.getByLabel("名字").fill("Ling");
    await two.getByLabel("名字").blur();
    await two.waitForTimeout(300);

    // The paused first tab tries to change something: it must not save.
    await one.evaluate(() => { location.hash = "#/settings"; });
    await one.getByRole("heading", { name: "設定" }).waitFor();
    check(`${tag} the paused tab still shows its notice`, (await paused(one).count()) === 1);

    // It continues: it loads what the second tab saved before it edits.
    await one.getByRole("button", { name: "喺呢度繼續" }).click();
    await one.waitForFunction(() => !document.querySelector('[data-save="paused"]'), null, { timeout: 10000 }).catch(() => undefined);
    const nameNow = await one.getByLabel("名字").inputValue();
    check(`${tag} continuing loads the other tab's change first`, nameNow === "Ling", nameNow);
    await paused(two).waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} the second tab pauses in turn`, (await paused(two).count()) === 1);
    await one.getByRole("button", { name: "20" }).click();
    await one.waitForTimeout(300);

    const state = await exported(one);
    check(`${tag} both tabs' changes are kept`, state.profile.name === "Ling" && state.profile.minutes === 20, `${state.profile.name} / ${state.profile.minutes}`);
    await context.close();

    // Two fresh tabs, both still on onboarding (no profile yet): the first is paused
    // and must say so there too, and continuing opens what the other tab saved.
    const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const first = await fresh.newPage();
    const second = await fresh.newPage();
    for (const page of [first, second]) page.setDefaultTimeout(30000);
    await first.goto(origin, { waitUntil: "domcontentloaded" });
    await first.getByRole("heading", { name: "情景英文" }).waitFor();
    await second.goto(origin, { waitUntil: "domcontentloaded" });
    await second.getByRole("heading", { name: "情景英文" }).waitFor();
    await paused(first).waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} a paused tab on onboarding shows the notice`, (await paused(first).count()) === 1);
    await onboard(second);
    await first.getByRole("button", { name: "喺呢度繼續" }).click();
    await first.getByRole("heading", { name: "學習路徑" }).waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} continuing from onboarding opens the other tab's profile`, (await first.getByRole("heading", { name: "學習路徑" }).count()) === 1 && (await first.locator(".phone").innerText()).includes("Penny"));
    await fresh.close();
  } finally {
    await browser.close();
  }
}

try {
  const wanted = (process.env.EQ_BROWSERS || "chromium,webkit").split(",");
  if (wanted.includes("chromium")) await runBrowser(chromium, "chromium");
  if (wanted.includes("webkit")) await runBrowser(webkit, "webkit");
} finally {
  server.close();
}
if (failures) {
  console.error(`two-tabs e2e: ${failures} failed`);
  process.exit(1);
}
console.log("two-tabs e2e ok");
