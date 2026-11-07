// The bottom-right build stamp: build time (Macau) and commit, 最新 when the server has
// the same build, 有新版本 (tap to reload) when it has a later one, and only this build
// when version.json is missing. It must not cover the 我 tab, 每日任務 or lesson buttons.
// Chromium and WebKit at 390px.
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
let serverVersion = "dist";
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
  if (rel === "/version.json" && serverVersion !== "dist") {
    if (serverVersion === "missing") {
      res.writeHead(404);
      res.end("missing");
      return;
    }
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify(serverVersion));
    return;
  }
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
const shots = process.env.EQ_SHOTS;
const own = JSON.parse(fs.readFileSync(path.join(dist, "version.json"), "utf8"));
const macau = (time) => {
  const t = new Date(Date.parse(time) + 8 * 3600 * 1000).toISOString();
  return `${t.slice(0, 10)} ${t.slice(11, 16)}`;
};
const label = `${macau(own.time).slice(5)} · ${own.sha}`;

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

const badge = (page) => page.locator(".version-badge");
const overlaps = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  const launch = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // Onboarding shows this build in the corner.
    serverVersion = "dist";
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "情景英文" }).waitFor();
    await badge(page).waitFor();
    check(`${tag} onboarding shows the build`, (await badge(page).innerText()).includes(label), await badge(page).innerText());

    // Same build on the server: 最新.
    await onboard(page);
    await page.locator('.version-badge[data-version="latest"]').waitFor({ timeout: 10000 }).catch(() => undefined);
    const text = await badge(page).innerText();
    check(`${tag} the path shows the build time, commit and 最新`, text.includes(label) && text.includes("最新"), text);
    const box = await badge(page).boundingBox();
    const tabs = await page.locator("nav.tabs[aria-label=\"主要\"]").boundingBox();
    const me = await page.locator("nav.tabs[aria-label=\"主要\"] a", { hasText: "我" }).boundingBox();
    const meIcon = await page.locator("nav.tabs[aria-label=\"主要\"] a", { hasText: "我" }).locator("svg").boundingBox();
    check(`${tag} the stamp sits in the tab bar's bottom-right`, box && tabs && box.y >= tabs.y && box.y + box.height <= tabs.y + tabs.height + 0.5 && box.x + box.width <= tabs.x + tabs.width && box.x + box.width > me.x + me.width / 2, JSON.stringify(box));
    const labels = await page.locator('nav.tabs[aria-label="主要"] a').evaluateAll((els) => els.map((el) => {
      const range = document.createRange();
      range.selectNodeContents(el.lastChild);
      const r = range.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, text: el.textContent.trim() };
    }));
    const covered = labels.filter((l) => overlaps(box, l)).map((l) => l.text);
    check(`${tag} the stamp is below every tab label`, covered.length === 0, covered.join(","));
    check(`${tag} the stamp does not cover the 我 icon`, !overlaps(box, meIcon), JSON.stringify(meIcon));
    const floatBox = await page.locator(".daily-float").boundingBox().catch(() => null);
    check(`${tag} the stamp does not cover 每日任務`, !overlaps(box, floatBox));
    if (shots) await page.screenshot({ path: path.join(shots, `version-${tag}-path.png`) });

    // A lesson has no stamp, so it never covers the lesson's buttons.
    await page.evaluate(() => { location.hash = "#/lesson/F1"; });
    await page.getByRole("button", { name: "入去場景" }).waitFor();
    check(`${tag} a lesson shows no stamp over its buttons`, (await badge(page).count()) === 0);
    if (shots) await page.screenshot({ path: path.join(shots, `version-${tag}-lesson.png`) });

    // The server has a later build: 有新版本, and tapping reloads.
    serverVersion = { time: new Date(Date.parse(own.time) + 3600 * 1000).toISOString(), sha: "abc1234" };
    await page.goto(`${origin}#/`, { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    const newer = page.locator('.version-badge[data-version="newer"]');
    await newer.waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} a later build on the server shows 有新版本`, (await newer.count()) === 1 && (await newer.innerText()).includes("有新版本"));
    if (await newer.count()) {
      const nb = await newer.boundingBox();
      const tabLabels = await page.locator('nav.tabs[aria-label="主要"] a').evaluateAll((els) => els.map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el.lastChild);
        const r = range.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, text: el.textContent.trim() };
      }));
      const hidden = tabLabels.filter((l) => overlaps(nb, l)).map((l) => l.text);
      check(`${tag} 有新版本 does not cover a tab label`, hidden.length === 0, hidden.join(","));
    }
    if (shots) await page.screenshot({ path: path.join(shots, `version-${tag}-newer.png`) });
    if (await newer.count()) {
      const reloaded = page.waitForEvent("framenavigated", { timeout: 10000 }).then(() => true, () => false);
      await newer.click();
      check(`${tag} tapping 有新版本 reloads`, await reloaded);
      await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    }

    // No version.json (an old server, or offline): just this build, no 最新.
    serverVersion = "missing";
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    await page.waitForTimeout(800);
    const plain = await badge(page).innerText();
    check(`${tag} without version.json it shows only this build`, plain.includes(label) && !plain.includes("最新") && !plain.includes("新版本"), plain);
    await context.close();

    // A check that fails after 最新 (server without version.json, then offline) must not
    // keep saying 最新: it goes back to showing only this build.
    const later = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const again = await later.newPage();
    again.setDefaultTimeout(30000);
    await again.clock.install();
    serverVersion = "dist";
    await onboard(again);
    await again.locator('.version-badge[data-version="latest"]').waitFor({ timeout: 10000 });
    const recheck = async () => {
      await again.clock.fastForward(61_000);
      await again.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      await again.waitForTimeout(800);
    };
    serverVersion = "missing";
    await recheck();
    const afterMissing = await badge(again).innerText();
    check(`${tag} after 最新, a missing version.json clears 最新`, !afterMissing.includes("最新") && afterMissing.includes(label), afterMissing);
    serverVersion = "dist";
    await recheck();
    check(`${tag} the next good check says 最新 again`, (await badge(again).innerText()).includes("最新"));
    await later.setOffline(true);
    await recheck();
    const afterOffline = await badge(again).innerText();
    check(`${tag} after 最新, going offline clears 最新`, !afterOffline.includes("最新") && afterOffline.includes(label), afterOffline);
    await later.close();
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
  console.error(`version e2e: ${failures} failed`);
  process.exit(1);
}
console.log("version e2e ok");
