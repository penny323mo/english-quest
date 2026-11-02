import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const oldDir = path.join(root, "e2e", "old");
const shots = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(shots, { recursive: true });

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
}

let siteDir = oldDir;
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
  const file = path.normalize(path.join(siteDir, rel));
  if (!file.startsWith(siteDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("missing");
    return;
  }
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
  res.writeHead(200, {
    "content-type": types[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}/english-quest/`;
const { defaultBrowserType: _browser, ...iphone } = devices["iPhone 13"];

function creamish(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  return r > 220 && g > 200 && b > 180 && b < 250;
}

async function phoneBackground(page) {
  return page.evaluate(() => {
    const node = document.querySelector(".phone") || document.body;
    return getComputedStyle(node).backgroundColor;
  });
}

async function shot(page, name) {
  const file = path.join(shots, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("shot", file);
}

async function onboard(page, name) {
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill(name);
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
}

async function openLessonHear(page) {
  await page.waitForFunction(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("english-quest");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction("kv", "readonly");
    const state = await new Promise((resolve) => {
      const req = tx.objectStore("kv").get("state");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    db.close();
    return Boolean(state && state.profile && state.profile.name);
  });
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("english-quest");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction("kv", "readwrite");
    const store = tx.objectStore("kv");
    const state = await new Promise((resolve, reject) => {
      const req = store.get("state");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    state.progress.F1 = { at: new Date().toISOString(), xp: 12 };
    await new Promise((resolve, reject) => {
      const req = store.put(state, "state");
      req.onsuccess = () => resolve(undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /打招呼同名字/ }).click();
  const enter = page.getByRole("button", { name: "入去場景" });
  await enter.waitFor();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.includes("入去場景"));
    return button && !button.disabled;
  }, null, { timeout: 8000 });
  await enter.click();
  await page.getByRole("button", { name: "去聽" }).click();
  const penny = page.getByText("My name is Penny");
  await penny.waitFor();
  await penny.scrollIntoViewIfNeeded();
}

async function screens(browserType, scheme) {
  const browser = await browserType.launch();
  const page = await browser.newPage({ ...iphone, colorScheme: scheme });
  await page.addInitScript(() => {
    const night = new Date("2026-11-02T15:52:00+08:00");
    const Real = Date;
    class Fixed extends Real {
      constructor(...args) {
        if (args.length === 0) super(night.getTime());
        else super(...args);
      }
      static now() { return night.getTime(); }
    }
    Fixed.parse = Real.parse;
    Fixed.UTC = Real.UTC;
    globalThis.Date = Fixed;
  });
  await onboard(page, "Penny");
  const homeBg = await phoneBackground(page);
  if (!creamish(homeBg)) throw new Error(`${browserType.name()} ${scheme} home background ${homeBg}`);
  const body = await page.locator("body").innerText();
  if (body.includes("阿林") || body.includes("舊版深色")) throw new Error("old shell still visible");
  await shot(page, `${browserType.name()}-${scheme}-home`);
  await page.getByRole("link", { name: "生字", exact: true }).click();
  await page.getByRole("heading", { name: "生字回顧" }).waitFor();
  await shot(page, `${browserType.name()}-${scheme}-vocab`);
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await openLessonHear(page);
  const lessonText = await page.locator(".sheet").innerText();
  if (!lessonText.includes("Penny")) throw new Error("lesson did not show Penny");
  if (lessonText.includes("阿林") || lessonText.includes("Ling")) throw new Error(`lesson still names Ling: ${lessonText.slice(0, 400)}`);
  await shot(page, `${browserType.name()}-${scheme}-lesson`);
  await browser.close();
}

async function oldToNew(browserType, scheme) {
  siteDir = oldDir;
  const browser = await browserType.launch();
  const page = await browser.newPage({ ...iphone, colorScheme: scheme });
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "阿林" }).waitFor();
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return Boolean(reg?.active);
  });
  siteDir = dist;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const heading = document.querySelector("h1")?.textContent || "";
    return heading.includes("情景英文") || heading.includes("學習路徑");
  }, null, { timeout: 25000 });
  const text = await page.locator("body").innerText();
  if (text.includes("舊版深色") || text.includes("阿林")) throw new Error(`${browserType.name()} stayed on the old shell`);
  const bg = await phoneBackground(page);
  if (!creamish(bg)) throw new Error(`${browserType.name()} ${scheme} after update background ${bg}`);
  await shot(page, `${browserType.name()}-${scheme}-after-old-sw`);
  await browser.close();
}

try {
  siteDir = dist;
  for (const scheme of ["light", "dark"]) {
    await screens(webkit, scheme);
    await screens(chromium, scheme);
  }
  for (const scheme of ["light", "dark"]) {
    await oldToNew(webkit, scheme);
    await oldToNew(chromium, scheme);
  }
  console.log("e2e ok");
} finally {
  server.close();
}
