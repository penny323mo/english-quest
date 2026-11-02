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
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return Boolean(reg?.active && navigator.serviceWorker.controller);
  });
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
  const finalShot = path.join(shotsDir(browserType, scheme), "final.png");
  await page.screenshot({ path: finalShot });
  console.log("shot", finalShot);
  await browser.close();
  return reloads;
}

function shotsDir(browserType, scheme) {
  return path.join(shots, `migrate-${browserType.name()}-${scheme}`);
}

try {
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
