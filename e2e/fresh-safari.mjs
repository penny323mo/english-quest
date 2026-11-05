import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webkit } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const shots = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(shots, { recursive: true });

const BANNED = ["路線", "詞庫", "未開"];
const SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
}

function walkJs(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkJs(full, out);
    else if (name.endsWith(".js")) out.push(full);
  }
}

const bundles = [];
walkJs(dist, bundles);
if (!bundles.length) {
  console.error("dist has no JS bundles");
  process.exit(1);
}
for (const file of bundles) {
  const text = fs.readFileSync(file, "utf8");
  for (const token of BANNED) {
    if (text.includes(token)) {
      console.error(`${path.relative(dist, file)} contains ${token}`);
      process.exit(1);
    }
  }
}
console.log(`assert bundles omit dark-shell labels: pass (${bundles.length} files)`);

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
  if (!file.startsWith(dist) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
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

function creamish(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  return r > 220 && g > 200 && b > 180 && b < 250;
}

try {
  const browser = await webkit.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
    userAgent: SAFARI_UA,
  });
  page.setDefaultTimeout(30000);
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  const ua = await page.evaluate(() => navigator.userAgent);
  const uaOk = ua.includes("Version/") && ua.includes("Safari") && !ua.includes("CriOS");
  console.log(`assert iPhone Safari UA: ${uaOk ? "pass" : "FAIL"} ${ua}`);
  if (!uaOk) throw new Error(`expected Version/ Safari without CriOS, got ${ua}`);
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill("Penny");
  await page.getByRole("button", { name: "下一步" }).click();
  // No goal is preselected: pick one before the next step.
  await page.getByRole("radio", { name: /打好基礎/ }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
  await page.waitForFunction(() => document.documentElement.classList.contains("eq-ready"));
  const home = await page.locator(".phone").innerText();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector(".phone") || document.body).backgroundColor);
  const want = ["Penny", "0 XP", "學習路徑", "今日未打卡", "今日目標 15 分鐘", "打好基礎", "路徑", "生字", "練習"];
  for (const bit of want) {
    const ok = home.includes(bit);
    console.log(`assert fresh home ${bit}: ${ok ? "pass" : "FAIL"}`);
    if (!ok) throw new Error(`fresh home missing ${bit}`);
  }
  for (const bit of ["完成一課就記低今日", "路線", "重溫", "詞庫", "未開"]) {
    const ok = !home.includes(bit);
    console.log(`assert fresh home omits ${bit}: ${ok ? "pass" : "FAIL"}`);
    if (!ok) throw new Error(`fresh home still shows ${bit}`);
  }
  await page.getByRole("img", { name: "小燈" }).waitFor();
  const tabs = await page.locator("nav.tabs").innerText();
  const tabOk = tabs.includes("路徑") && tabs.includes("生字") && tabs.includes("練習") && tabs.includes("我");
  console.log(`assert mockup-v1 tabs: ${tabOk ? "pass" : "FAIL"} ${tabs.replace(/\s+/g, " ")}`);
  if (!tabOk) throw new Error(`tabs ${tabs}`);
  const light = creamish(bg);
  console.log(`assert light home under dark mode: ${light ? "pass" : "FAIL"} ${bg}`);
  if (!light) throw new Error(`phone background ${bg}`);
  console.log(`assert 390px scroll width: ${width <= 390 ? "pass" : "FAIL"} ${width}`);
  if (width > 390) throw new Error(`scroll width ${width}`);
  const shot = path.join(shots, "webkit-safari-fresh-home.png");
  await page.screenshot({ path: shot });
  console.log("shot", shot);
  await browser.close();
  console.log("fresh safari home ok");
} finally {
  server.close();
}
