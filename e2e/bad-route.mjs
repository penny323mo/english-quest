// A link with broken percent-encoding (#/lesson/%) opens the path instead of a blank
// screen (review finding 8). Chromium and WebKit.
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

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  const launch = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await onboard(page);
    for (const hash of ["#/lesson/%", "#/word/%E0%A4%A", "#/vocab/%/quiz"]) {
      errors.length = 0;
      await page.evaluate((h) => { location.hash = h; }, hash);
      const home = await page.getByRole("heading", { name: "學習路徑" }).waitFor({ timeout: 5000 }).then(() => true, () => false);
      check(`${tag} ${hash} opens the path`, home && errors.length === 0, errors.join(" | "));
    }
    // A fresh load straight onto a broken link renders too.
    errors.length = 0;
    await page.goto(`${origin}#/lesson/%`, { waitUntil: "domcontentloaded" });
    const fresh = await page.getByRole("heading", { name: "學習路徑" }).waitFor({ timeout: 10000 }).then(() => true, () => false);
    check(`${tag} loading #/lesson/% opens the path`, fresh && errors.length === 0, errors.join(" | "));
    // A valid link still works afterwards.
    await page.evaluate(() => { location.hash = "#/settings"; });
    check(`${tag} a valid link still opens`, await page.getByRole("heading", { name: "設定" }).waitFor({ timeout: 5000 }).then(() => true, () => false));
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
  console.error(`bad-route e2e: ${failures} failed`);
  process.exit(1);
}
console.log("bad-route e2e ok");
