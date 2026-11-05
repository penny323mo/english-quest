import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
if (!fs.existsSync(path.join(dist, "index.html")) || !fs.existsSync(path.join(dist, "sw.js"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
}

// Shipped workers, oldest first. Round 19 (1dfee5cb) is the dark UI in the
// screenshot and imports workbox-9c191d2f.js. Night-1 imports the other file.
const HISTORICAL = ["workbox-835c8c05.js", "workbox-9c191d2f.js"];

const oldHtml = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#071426" />
  <title>舊版</title>
  <style>html,body{margin:0;background:#071426;color:#f4efe6;font-family:sans-serif}main{padding:24px}</style>
</head>
<body>
  <main>
    <p>今日 15 分鐘</p>
    <h1>Penny</h1>
    <p>完成一課就記低今日</p>
    <p>0 XP</p>
    <nav>路線 重溫 詞庫 我</nav>
  </main>
  <script>
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/english-quest/sw.js", { scope: "/english-quest/" });
      });
    }
  </script>
</body>
</html>`;

function oldSw(workbox) {
  return `importScripts("/english-quest/${workbox}");
const CACHE = "eq-historical-dark";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/english-quest/index.html"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/sw.js") || url.pathname.includes("/workbox-") || url.pathname.endsWith("/registerSW.js")) return;
  if (event.request.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(caches.match("/english-quest/index.html").then((hit) => hit || fetch(event.request)));
  }
});
`;
}

// Another project on the same github.io origin, with its own worker and caches.
// English Quest's clean-up must leave all of it alone (review finding 3).
const otherHtml = `<!doctype html><html><head><meta charset="utf-8"><title>other</title></head><body><p>other app</p>
<script>navigator.serviceWorker.register("/other-app/sw.js", { scope: "/other-app/" });</script></body></html>`;
const otherSw = `self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([
    caches.open("other-app-v1").then((c) => c.put("/other-app/", new Response("other"))),
    caches.open("workbox-precache-v2-" + self.registration.scope).then((c) => c.put("/other-app/a", new Response("a"))),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
`;
const OTHER_CACHES = (port) => ["other-app-v1", `workbox-precache-v2-http://127.0.0.1:${port}/other-app/`];

let phase = "old";
let workboxName = HISTORICAL[0];
const swFetches = [];

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
  if (phase === "new" && url.pathname.endsWith("/sw.js")) swFetches.push(url.pathname);
  if (url.pathname === "/other-app/" || url.pathname === "/other-app/sw.js") {
    const isSw = url.pathname.endsWith("sw.js");
    res.writeHead(200, { "content-type": isSw ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(isSw ? otherSw : otherHtml);
    return;
  }
  const prefix = "/english-quest";
  if (!url.pathname.startsWith(prefix)) {
    res.writeHead(404);
    res.end("missing");
    return;
  }
  let rel = decodeURIComponent(url.pathname.slice(prefix.length)).replace(/^\/+/, "");
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  if (phase === "old") {
    let body = null;
    let type = "text/javascript; charset=utf-8";
    if (rel === "index.html") {
      body = oldHtml;
      type = "text/html; charset=utf-8";
    } else if (rel === "sw.js") body = oldSw(workboxName);
    else if (rel === workboxName) body = "/* historical workbox stub */\n";
    if (body == null) {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "max-age=600" });
      res.end("missing");
      return;
    }
    res.writeHead(200, { "content-type": type, "cache-control": "max-age=600" });
    res.end(body);
    return;
  }
  const file = path.normalize(path.join(dist, rel));
  if (!file.startsWith(dist) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "max-age=600" });
    res.end("missing");
    return;
  }
  res.writeHead(200, {
    "content-type": types[path.extname(file)] || "application/octet-stream",
    "cache-control": "max-age=600",
  });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}/english-quest/`;

const SEEDED = {
  schemaVersion: 3,
  profile: {
    name: "Penny",
    goal: "jewellery",
    minutes: 15,
    level: "some",
    jyutping: false,
    sound: true,
    xp: 0,
    streak: 0,
    lastActive: null,
  },
  progress: {},
  cards: {},
  lessonCursor: null,
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
    if (key === "eq-skip-claim" || key === "eq-reg-kill") continue;
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
            keys.forEach((key, index) => { rows[String(key)] = vals[index]; });
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

async function seedStorage(state) {
  localStorage.setItem("eq-canary", "penny-local");
  sessionStorage.setItem("eq-session-canary", "penny-session");
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
    tx.objectStore("kv").put("penny-idb", "eq-canary");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  app.close();
  const extra = await open("eq-canary-db", 1, (db) => {
    if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
  });
  await new Promise((resolve, reject) => {
    const tx = extra.transaction("kv", "readwrite");
    tx.objectStore("kv").put({ marker: "penny-idb-db" }, "canary");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  extra.close();
}

function isNewDocument(html) {
  return html.includes('name="eq-source"') && html.includes("eq-sw-kill") && !html.includes("完成一課就記低今日");
}

async function migrate(browserType, workbox) {
  phase = "old";
  workboxName = workbox;
  swFetches.length = 0;
  const launch = browserType.name() === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
  page.setDefaultTimeout(30000);
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("page error", msg.text());
  });
  page.on("pageerror", (error) => console.log("pageerror", String(error)));
  const docs = [];
  let recording = false;
  page.on("response", (res) => {
    if (!recording) return;
    if (res.request().resourceType() !== "document") return;
    if (!res.url().includes("/english-quest")) return;
    docs.push(res.text().then((body) => body).catch(() => ""));
  });
  await page.goto(`http://127.0.0.1:${port}/other-app/`);
  await page.waitForFunction(async (names) => {
    const reg = await navigator.serviceWorker.getRegistration("/other-app/");
    const have = await caches.keys();
    return Boolean(reg && reg.active) && names.every((name) => have.includes(name));
  }, OTHER_CACHES(port));
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.getByText("完成一課就記低今日").waitFor();
  const via = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? reg.updateViaCache : "missing";
  });
  console.log(`assert ${browserType.name()} ${workbox} updateViaCache imports: ${via === "imports" ? "pass" : "FAIL"} ${via}`);
  if (via !== "imports") throw new Error(`historical updateViaCache ${via}`);
  await page.evaluate(seedStorage, SEEDED);
  const before = await page.evaluate(dumpStorage);
  recording = true;
  phase = "new";
  swFetches.length = 0;
  const reloadOnce = () => page.reload({ waitUntil: "domcontentloaded", timeout: 15000 }).catch((error) => {
    const message = String(error);
    if (!message.includes("ERR_ABORTED") && !message.includes("NS_BINDING") && !message.includes("Timeout")) {
      throw error;
    }
  });
  await reloadOnce();
  const ready = async () => page.evaluate(() => {
    return document.documentElement.classList.contains("eq-ready")
      && !!document.querySelector('meta[name="eq-source"]');
  }).catch(() => false);
  const waitReady = async () => {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (await ready()) return true;
      await page.waitForTimeout(250).catch(() => undefined);
    }
    return false;
  };
  if (!(await waitReady())) {
    console.log("not ready after first reload; reloading once more");
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }).catch(() => {});
    await reloadOnce();
    await waitReady();
  }
  const arrived = await ready();
  if (!arrived) {
    const debug = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return {
        text: document.body ? document.body.innerText.slice(0, 400) : "",
        controller: navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : "",
        active: reg && reg.active ? reg.active.scriptURL : "",
        waiting: reg && reg.waiting ? reg.waiting.scriptURL : "",
        installing: reg && reg.installing ? reg.installing.scriptURL : "",
      };
    }).catch((error) => String(error));
    console.log("debug", JSON.stringify(debug), "fetches", swFetches.join(","), "docs", docs.length);
    throw new Error(`${browserType.name()} ${workbox} stayed on the old shell`);
  }
  const bodies = await Promise.all(docs);
  console.log(`${browserType.name()} ${workbox} documents ${bodies.length} sw fetches ${swFetches.length}`);
  const oldDocs = bodies.filter((body) => body.includes("完成一課就記低今日")).length;
  if (oldDocs > 1) throw new Error(`${browserType.name()} ${workbox} showed the dark shell ${oldDocs} times`);
  if (bodies.length > 2) throw new Error(`${browserType.name()} ${workbox} used ${bodies.length} document loads`);
  if (!bodies.length || !isNewDocument(bodies[bodies.length - 1])) {
    throw new Error(`${browserType.name()} ${workbox} did not reach the light shell`);
  }
  const fetched = swFetches.some((item) => item.endsWith("/sw.js"));
  console.log(`assert ${browserType.name()} ${workbox} update fetched sw.js despite max-age=600: ${fetched ? "pass" : "FAIL"}`);
  if (!fetched) throw new Error("service worker update did not fetch sw.js");
  // eq-ready is set on the cream splash, before IndexedDB hydrate and the
  // lazy shell chunk paint the seeded profile. Reading .phone here races that.
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
  const home = await page.locator(".phone").innerText();
  for (const bit of ["Penny", "0 XP", "學習路徑", "路徑"]) {
    if (!home.includes(bit)) throw new Error(`${browserType.name()} home missing ${bit}`);
  }
  if (home.includes("完成一課就記低今日") || home.includes("路線")) {
    throw new Error(`${browserType.name()} still shows the dark shell`);
  }
  const shared = await page.evaluate(async () => ({
    scopes: (await navigator.serviceWorker.getRegistrations()).map((reg) => new URL(reg.scope).pathname),
    caches: await caches.keys(),
  }));
  const otherKept = shared.scopes.includes("/other-app/") && OTHER_CACHES(port).every((name) => shared.caches.includes(name));
  console.log(`assert ${browserType.name()} ${workbox} another app on the origin keeps its worker and caches: ${otherKept ? "pass" : "FAIL"} ${JSON.stringify(shared)}`);
  if (!otherKept) throw new Error("English Quest's clean-up removed another app's worker or caches");
  const oldGone = !shared.caches.includes("eq-historical-dark");
  console.log(`assert ${browserType.name()} ${workbox} English Quest's own old cache is removed: ${oldGone ? "pass" : "FAIL"}`);
  if (!oldGone) throw new Error("the historical dark-shell cache was kept");
  const after = await page.evaluate(dumpStorage);
  for (const part of ["local", "session", "idb"]) {
    const ok = stable(before[part]) === stable(after[part]);
    console.log(`assert ${browserType.name()} ${workbox} ${part} identical: ${ok ? "pass" : "FAIL"}`);
    if (!ok) {
      console.log("before", stable(before[part]));
      console.log("after", stable(after[part]));
      throw new Error(`${part} changed`);
    }
  }
  await browser.close();
}

try {
  const only = process.argv[2];
  const jobs = [
    [webkit, HISTORICAL[0]],
    [chromium, HISTORICAL[0]],
    [webkit, HISTORICAL[1]],
    [chromium, HISTORICAL[1]],
  ].filter(([browserType, workbox]) => !only || only === browserType.name() || only === `${browserType.name()}:${workbox}`);
  for (const [browserType, workbox] of jobs) await migrate(browserType, workbox);
  console.log("oldest service workers ok");
} finally {
  server.close();
}
