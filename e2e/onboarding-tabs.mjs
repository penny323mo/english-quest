// #27 (onboarding: no preselected goal, new goals) with #28 (one tab saves at a time).
// Two fresh tabs on onboarding: the newer saves, the older pauses and cannot overwrite
// the saved profile; continuing loads it and opens the path; a goal change in one tab
// is loaded by the other before it edits. Chromium and WebKit.
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

const paused = (page) => page.locator('[data-save="paused"]');

/** Read the saved record straight from IndexedDB (what any tab will load). */
const stored = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("english-quest");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("kv")) { db.close(); resolve(null); return; }
          const get = db.transaction("kv").objectStore("kv").get("state");
          get.onsuccess = () => { db.close(); resolve(get.result ?? null); };
          get.onerror = () => reject(get.error);
        };
      }),
  );

/** Fill onboarding up to 開始 with a name and a goal (no goal is preselected). */
async function fillOnboarding(page, name, goal) {
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill(name);
  await page.getByRole("button", { name: "下一步" }).click();
  check(`goal must be picked before 下一步 (${name})`, await page.getByRole("button", { name: "下一步" }).isDisabled());
  await page.getByRole("radio", { name: goal }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
}

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  const launch = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const one = await context.newPage();
    const two = await context.newPage();
    for (const page of [one, two]) page.setDefaultTimeout(30000);
    const errors = [];
    for (const page of [one, two]) page.on("pageerror", (error) => errors.push(String(error)));

    // Two fresh tabs, both on onboarding: the newer one saves, the first pauses.
    await one.goto(origin, { waitUntil: "domcontentloaded" });
    await one.getByRole("heading", { name: "情景英文" }).waitFor();
    await two.goto(origin, { waitUntil: "domcontentloaded" });
    await two.getByRole("heading", { name: "情景英文" }).waitFor();
    await paused(one).waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} the first onboarding tab pauses when a second opens`, (await paused(one).count()) === 1);
    check(`${tag} the second onboarding tab is not paused`, (await paused(two).count()) === 0);

    // The second tab finishes onboarding with a new goal (日常生活, stored as daily).
    await fillOnboarding(two, "Ling", /日常生活/);
    await two.getByRole("button", { name: "開始" }).click();
    await two.getByRole("heading", { name: "學習路徑" }).waitFor();
    await two.waitForTimeout(300);
    let rec = await stored(two);
    check(`${tag} the new tab's profile is saved`, rec?.profile?.name === "Ling" && rec?.profile?.goal === "daily" && rec?.rev >= 1, JSON.stringify(rec?.profile));

    // The paused tab finishes its own onboarding without continuing first: nothing is saved.
    await fillOnboarding(one, "Penny", /打好基礎/);
    await one.getByRole("button", { name: "開始" }).click();
    await one.waitForTimeout(500);
    rec = await stored(one);
    check(`${tag} a paused tab's onboarding does not overwrite the saved profile`, rec?.profile?.name === "Ling" && rec?.profile?.goal === "daily", JSON.stringify(rec?.profile));
    check(`${tag} the paused tab still says it is paused`, (await paused(one).count()) === 1);

    // It continues: it loads the saved profile and opens the path, not onboarding again.
    await one.getByRole("button", { name: "喺呢度繼續" }).click();
    await one.getByRole("heading", { name: "學習路徑" }).waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} continuing opens the path with the saved profile`, (await one.getByRole("heading", { name: "學習路徑" }).count()) === 1 && (await one.locator(".phone").innerText()).includes("Ling"));
    await paused(two).waitFor({ timeout: 10000 }).catch(() => undefined);
    check(`${tag} the other tab pauses in turn`, (await paused(two).count()) === 1);

    // Change the goal in 設定 on this tab (to 返工職場, stored as work), then continue in the other.
    await one.evaluate(() => { location.hash = "#/settings"; });
    await one.getByRole("heading", { name: "設定" }).waitFor();
    await one.getByRole("radio", { name: /返工職場/ }).click();
    await one.waitForTimeout(300);
    rec = await stored(one);
    check(`${tag} a goal change is saved`, rec?.profile?.goal === "work", rec?.profile?.goal);
    await two.getByRole("button", { name: "喺呢度繼續" }).click();
    await two.waitForFunction(() => !document.querySelector('[data-save="paused"]'), null, { timeout: 10000 }).catch(() => undefined);
    await two.evaluate(() => { location.hash = "#/settings"; });
    await two.getByRole("heading", { name: "設定" }).waitFor();
    const checked = await two.getByRole("radio", { name: /返工職場/ }).getAttribute("aria-checked");
    check(`${tag} the other tab loads the new goal before editing`, checked === "true", checked);

    // Reload: one profile, the last goal, nothing lost, no conflict notice.
    await two.reload({ waitUntil: "domcontentloaded" });
    await two.getByRole("heading", { name: "設定" }).waitFor();
    rec = await stored(two);
    check(`${tag} after reload the record holds Ling and work`, rec?.profile?.name === "Ling" && rec?.profile?.goal === "work", JSON.stringify(rec?.profile));
    check(`${tag} no conflict notice on a clean reload`, (await two.locator('[data-save="conflict"]').count()) === 0);
    check(`${tag} no page errors`, errors.length === 0, errors.join(" | "));
    await context.close();
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
  console.error(`onboarding-tabs e2e: ${failures} failed`);
  process.exit(1);
}
console.log("onboarding-tabs e2e ok");
