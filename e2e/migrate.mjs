import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const legacy = path.join(root, "e2e", "legacy");
const shots = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(shots, { recursive: true });

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
}
if (!fs.existsSync(path.join(legacy, "sw.js"))) {
  console.error("e2e/legacy missing the 09e3b72 shell");
  process.exit(1);
}

const newHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const newBundle = newHtml.match(/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
if (!newBundle) {
  console.error("new bundle name missing from dist/index.html");
  process.exit(1);
}
const oldBundle = "assets/index-SU0XYAkO.js";

let site = "legacy";
function resolveFile(rel) {
  const clean = rel.replace(/^\/+/, "");
  const legacyFile = path.join(legacy, clean);
  if (site === "legacy" && fs.existsSync(legacyFile) && fs.statSync(legacyFile).isFile()) return legacyFile;
  const repoFile = path.join(root, clean);
  if (fs.existsSync(repoFile) && fs.statSync(repoFile).isFile()) return repoFile;
  const publicFile = path.join(root, "public", clean);
  if (fs.existsSync(publicFile) && fs.statSync(publicFile).isFile()) return publicFile;
  if (site === "new") {
    const built = path.join(dist, clean);
    if (fs.existsSync(built) && fs.statSync(built).isFile()) return built;
  }
  return null;
}

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
  const file = resolveFile(rel);
  if (!file) {
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

function isOldShell(html) {
  return html.includes(oldBundle) || html.includes("舊版深色");
}

const SEEDED_STATE = {
  schemaVersion: 3,
  profile: {
    name: "Penny",
    goal: "jewellery",
    minutes: 15,
    level: "some",
    jyutping: false,
    sound: true,
    xp: 48,
    streak: 3,
    lastActive: "2026-11-01",
  },
  progress: {
    F1: { at: "2026-11-01T01:00:00.000Z", xp: 20 },
    F2: { at: "2026-11-01T02:00:00.000Z", xp: 28 },
  },
  cards: {},
  lessonCursor: { lessonId: "F3", beat: 2, sub: 1, quizScore: 0, quizAnswered: 1 },
};

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function dumpStorage() {
  const local = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    local[key] = localStorage.getItem(key);
  }
  const session = {};
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key === "eq-skip-claim") continue;
    session[key] = sessionStorage.getItem(key);
  }
  const databases = ["english-quest", "eq-canary-db"];
  const idb = {};
  for (const name of databases) {
    idb[name] = await new Promise((resolve, reject) => {
      const req = indexedDB.open(name);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const names = [...db.objectStoreNames];
        if (!names.length) {
          db.close();
          resolve({});
          return;
        }
        const tx = db.transaction(names, "readonly");
        const out = {};
        let left = names.length;
        for (const storeName of names) {
          const store = tx.objectStore(storeName);
          const keysReq = store.getAllKeys();
          const valsReq = store.getAll();
          let keys = null;
          let vals = null;
          const finish = () => {
            if (!keys || !vals) return;
            const rows = {};
            keys.forEach((key, index) => {
              rows[String(key)] = vals[index];
            });
            out[storeName] = rows;
            left -= 1;
            if (left === 0) {
              db.close();
              resolve(out);
            }
          };
          keysReq.onsuccess = () => { keys = keysReq.result; finish(); };
          valsReq.onsuccess = () => { vals = valsReq.result; finish(); };
          keysReq.onerror = () => reject(keysReq.error);
          valsReq.onerror = () => reject(valsReq.error);
        }
      };
    });
  }
  return { local, session, idb };
}

async function cacheHoldsOldShell() {
  const keys = await caches.keys();
  const sample = [];
  for (const key of keys) {
    const cache = await caches.open(key);
    const requests = await cache.keys();
    sample.push(`${key} ${requests.length}`);
    for (const request of requests) {
      if (!/index\.html|SU0XYAkO|DPrmcngt|shell-/.test(request.url)) continue;
      const response = await cache.match(request);
      if (!response) continue;
      const text = await response.text();
      if (text.includes("index-SU0XYAkO") || text.includes("shell-DPrmcngt")) {
        return { found: true, sample, hit: request.url };
      }
    }
  }
  return {
    found: false,
    sample,
    controller: navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : "none",
  };
}

function forbidStorageWipes() {
  const files = ["web/index.html", "web/src/sw.ts", "web/src/main.tsx"];
  const banned = ["localStorage.clear", "sessionStorage.clear", "indexedDB.deleteDatabase", "Clear-Site-Data"];
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    for (const token of banned) {
      if (text.includes(token)) hits.push(`${file} ${token}`);
    }
  }
  console.log(`assert kill-switch does not wipe storage: ${hits.length ? "FAIL" : "pass"}`);
  if (hits.length) throw new Error(hits.join("; "));
}

async function migrate(browserType, scheme) {
  site = "legacy";
  const browser = await browserType.launch();
  const page = await browser.newPage({ ...iphone, colorScheme: scheme });
  page.setDefaultTimeout(120000);
  const docs = [];
  let recording = false;
  page.on("response", (res) => {
    if (!recording) return;
    if (res.request().resourceType() !== "document") return;
    if (!res.url().includes("/english-quest")) return;
    docs.push(res.text().then((body) => ({ url: res.url(), body })).catch(() => ({ url: res.url(), body: "" })));
  });
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(1000);
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  const oldCached = await page.evaluate(cacheHoldsOldShell);
  console.log(`assert old cache holds fix-55 shell before migrate: ${oldCached.found ? "pass" : "FAIL"} controller=${oldCached.controller} ${oldCached.sample.join(" | ")}`);
  if (!oldCached.found) throw new Error("old service worker did not cache its shell");
  await page.evaluate(async (state) => {
    localStorage.setItem("eq-canary", "penny-local-48");
    sessionStorage.setItem("eq-session-canary", "penny-session-48");
    const open = (name, version, setup) => new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = () => setup(req.result);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const app = await open("english-quest", 2, (db) => {
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    });
    await new Promise((resolve, reject) => {
      const tx = app.transaction("kv", "readwrite");
      tx.objectStore("kv").put(state, "state");
      tx.objectStore("kv").put("penny-idb-48", "eq-canary");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    app.close();
    const extra = await open("eq-canary-db", 1, (db) => {
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    });
    await new Promise((resolve, reject) => {
      const tx = extra.transaction("kv", "readwrite");
      tx.objectStore("kv").put({ marker: "penny-idb-db-48" }, "canary");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    extra.close();
  }, SEEDED_STATE);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Penny", { exact: false }).first().waitFor();
  await page.getByText("48 XP").waitFor();
  const before = await page.evaluate(dumpStorage);
  recording = true;
  const shots = [];
  let chain = Promise.resolve();
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    if (!frame.url().includes("/english-quest")) return;
    const index = shots.length;
    const url = frame.url();
    shots.push({ url, file: "" });
    chain = chain.then(async () => {
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      const file = path.join(shotsDir(browserType, scheme), `nav-${index}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file });
      const html = await page.content();
      shots[index].file = file;
      shots[index].old = isOldShell(html);
      console.log("shot", file, shots[index].old ? "OLD" : "new", url);
    });
  });

  site = "new";
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/english-quest/sw.js", {
      scope: "/english-quest/",
      updateViaCache: "none",
    });
  }).catch((error) => {
    const message = String(error);
    if (!message.includes("context") && !message.includes("destroyed") && !message.includes("navigation")) {
      throw error;
    }
  });

  await page.waitForFunction(() => {
    return document.documentElement.classList.contains("eq-ready")
      && !!document.querySelector('meta[name="eq-source"]');
  }, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await chain;
  const bodies = await Promise.all(docs);
  const oldFrames = bodies.filter((doc) => isOldShell(doc.body));
  const reloads = bodies.length;
  console.log(`${browserType.name()} ${scheme} reloads ${reloads}`);
  for (const frame of oldFrames) console.log("old document", frame.url);
  if (reloads > 2) throw new Error(`${browserType.name()} ${scheme} used ${reloads} document loads`);
  if (oldFrames.length) throw new Error(`${browserType.name()} ${scheme} showed the old shell`);
  if (shots.some((shot) => shot.old)) throw new Error(`${browserType.name()} ${scheme} screenshot shows the old shell`);
  const html = await page.content();
  if (!html.includes(newBundle)) throw new Error(`${browserType.name()} ${scheme} final bundle is not ${newBundle}`);
  if (html.includes(oldBundle)) throw new Error(`${browserType.name()} ${scheme} final page still references ${oldBundle}`);
  await page.getByText("48 XP").waitFor();
  await page.getByText("2 / 91 課完成").waitFor();
  await page.getByText("未完成：數字、錢同時間").waitFor();
  const home = await page.locator(".phone").innerText();
  const homeBits = ["Penny", "48 XP", "連續 3 日", "2 / 91 課完成", "未完成：數字、錢同時間"];
  for (const bit of homeBits) {
    const ok = home.includes(bit);
    console.log(`assert ${browserType.name()} ${scheme} home ${bit}: ${ok ? "pass" : "FAIL"}`);
    if (!ok) throw new Error(`home missing ${bit}`);
  }
  const after = await page.evaluate(dumpStorage);
  for (const part of ["local", "session", "idb"]) {
    const ok = stable(before[part]) === stable(after[part]);
    console.log(`assert ${browserType.name()} ${scheme} ${part} identical: ${ok ? "pass" : "FAIL"}`);
    if (!ok) {
      console.log("before", stable(before[part]));
      console.log("after", stable(after[part]));
      throw new Error(`${part} changed`);
    }
  }
  let stillCached = await page.evaluate(cacheHoldsOldShell);
  for (let attempt = 0; stillCached.found && attempt < 20; attempt += 1) {
    await page.waitForTimeout(250);
    stillCached = await page.evaluate(cacheHoldsOldShell);
  }
  console.log(`assert ${browserType.name()} ${scheme} old shell left cache: ${stillCached.found ? "FAIL" : "pass"} ${stillCached.hit || ""}`);
  if (stillCached.found) throw new Error(`old shell is still in Cache Storage: ${stillCached.hit}`);
  const sw = await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      count: regs.length,
      scripts: regs.map((reg) => reg.active?.scriptURL || reg.installing?.scriptURL || ""),
      controller: navigator.serviceWorker.controller?.scriptURL || "",
    };
  });
  const swOk = sw.count === 1 && sw.controller.endsWith("/sw.js") && !sw.controller.includes("SU0XYAkO");
  console.log(`assert ${browserType.name()} ${scheme} service worker replaced: ${swOk ? "pass" : "FAIL"} ${sw.controller}`);
  if (!swOk) throw new Error(`service worker registration ${JSON.stringify(sw)}`);
  const homeShot = path.join(shotsDir(browserType, scheme), "home.png");
  await page.screenshot({ path: homeShot });
  console.log("shot", homeShot);
  await browser.close();
  return reloads;
}

function shotsDir(browserType, scheme) {
  return path.join(shots, `migrate-${browserType.name()}-${scheme}`);
}

try {
  forbidStorageWipes();
  const filter = process.argv[2];
  const jobs = [
    [webkit, "light"],
    [chromium, "light"],
    [webkit, "dark"],
    [chromium, "dark"],
  ].filter(([browserType, scheme]) => !filter || filter === `${browserType.name()}-${scheme}`);
  const counts = [];
  for (const [browserType, scheme] of jobs) counts.push(await migrate(browserType, scheme));
  console.log("migrate reloads", counts.join(","));
  console.log("migrate ok");
} finally {
  server.close();
}
