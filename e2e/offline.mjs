// Online, a reload always shows the newest deploy, even though index.html is
// served with max-age=600 like GitHub Pages. Offline, the app still opens from
// the copy the service worker kept. IndexedDB progress is the same throughout.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
}

let version = "v1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
};
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
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("missing");
    return;
  }
  const ext = path.extname(file);
  if (ext === ".html") {
    // Like GitHub Pages: the page may be reused from the HTTP cache for 10 minutes.
    const body = fs.readFileSync(file, "utf8").replace("</head>", `<meta name="eq-test-version" content="${version}" /></head>`);
    res.writeHead(200, { "content-type": types[ext], "cache-control": "max-age=600" });
    res.end(body);
    return;
  }
  res.writeHead(200, {
    "content-type": types[ext] || "application/octet-stream",
    "content-length": fs.statSync(file).size,
    "cache-control": ext === ".js" && rel.endsWith("sw.js") ? "max-age=600" : "no-store",
  });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}/english-quest/`;
const { defaultBrowserType: _browser, ...iphone } = devices["iPhone 13"];

function assert(ok, message) {
  if (!ok) throw new Error(message);
  console.log(`assert ${message}: pass`);
}

const shownVersion = (page) => page.evaluate(() => document.querySelector('meta[name="eq-test-version"]')?.getAttribute("content"));
const ready = (page) => page.waitForFunction(() => document.documentElement.classList.contains("eq-ready"), null, { timeout: 30000 });

async function readState(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("english-quest");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (!db.objectStoreNames.contains("kv")) { db.close(); return null; }
    const state = await new Promise((resolve, reject) => {
      const req = db.transaction("kv", "readonly").objectStore("kv").get("state");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return JSON.stringify(state ?? null);
  });
}

async function run(browserType) {
  const name = browserType.name();
  version = "v1";
  const browser = await browserType.launch();
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await ready(page);
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill("Penny");
  await page.getByRole("button", { name: "下一步" }).click();
  // No goal is preselected: pick one before the next step.
  await page.getByRole("radio", { name: /打好基礎/ }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 60000 });

  // A controlled load keeps the offline copy; the app's own scripts must be precached too.
  await page.reload({ waitUntil: "domcontentloaded" });
  await ready(page);
  await page.waitForFunction(async () => {
    const scripts = [...document.querySelectorAll("script[src], link[rel=stylesheet][href]")]
      .map((node) => node.src || node.href)
      .filter((url) => url.includes("/assets/"));
    const names = await caches.keys();
    const shell = names.includes("eq-shell-v1") && (await (await caches.open("eq-shell-v1")).keys()).length > 0;
    if (!shell) return false;
    for (const url of scripts) {
      let hit = false;
      for (const cacheName of names) if (await (await caches.open(cacheName)).match(url, { ignoreSearch: true })) hit = true;
      if (!hit) return false;
    }
    return true;
  }, null, { timeout: 180000, polling: 1000 });
  const before = await readState(page);
  assert(before && before.includes("Penny"), `${name} progress saved before the test`);

  // A new deploy. Opening the app again (a normal navigation, as from the home
  // screen, not a reload) must show it despite max-age=600.
  version = "v2";
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await ready(page);
  assert((await shownVersion(page)) === "v2", `${name} online open shows the newest deploy`);

  // Offline: the app still opens from the kept copy.
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await ready(page);
  await page.getByRole("heading", { name: "學習路徑" }).waitFor({ timeout: 30000 });
  assert((await shownVersion(page)) === "v2", `${name} offline reload opens the last page that loaded`);
  assert((await readState(page)) === before, `${name} IndexedDB progress unchanged`);
  await context.setOffline(false);

  // Back online: newest again.
  version = "v3";
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await ready(page);
  assert((await shownVersion(page)) === "v3", `${name} back online shows the newest deploy`);
  assert((await readState(page)) === before, `${name} IndexedDB progress still unchanged`);
  await browser.close();
}

try {
  const only = process.argv[2];
  for (const browserType of [chromium, webkit]) {
    if (only && only !== browserType.name()) continue;
    await run(browserType);
  }
  console.log("offline e2e ok");
} finally {
  server.close();
}
