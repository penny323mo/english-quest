// The onboarding goal drives 今日 and opens its track, at 390px in Chromium and WebKit.
// Onboarding preselects no goal and lists basics and daily life first. Each fresh
// profile picks a goal and must land on the goal's header, the goal's first lesson
// as 今日 (open, in view), and F1 still open. Then: finishing the track's first lesson
// moves 今日 along the track; 打好基礎 runs F1–F6 without J1 or R1; and changing the
// goal under 我 → 設定 updates the header and 今日 without a reload.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const shots = process.env.EQ_SHOTS || "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(shots, { recursive: true });

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
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
function checkAs(label, ok, detail = "") {
  console.log(`assert ${label}: ${ok ? "pass" : "FAIL"}${detail ? ` ${detail}` : ""}`);
  if (!ok) failures += 1;
}

const SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
const ORDER = ["打好基礎", "日常生活", "旅行登機", "餐廳入座", "返工職場", "珠寶櫃檯"];
const GOALS = [
  { label: "打好基礎", first: "F1", second: "F2" },
  // Path order, not the number: D4 is the first daily-life lesson, W1 the first work one.
  { label: "日常生活", first: "D4", second: "D5" },
  { label: "旅行登機", first: "T1", second: "T2" },
  // R10 sits in 起步, R2 in 上路.
  { label: "餐廳入座", first: "R1", second: "R10" },
  { label: "返工職場", first: "W1", second: "W4" },
  { label: "珠寶櫃檯", first: "J1", second: "J2" },
];

async function onboard(page, goalLabel) {
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill("Penny");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("radio", { name: new RegExp(goalLabel) }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
}

/** Header label, 今日 lesson, whether it is an open link and in view, and whether F1 is open. */
async function pathState(page) {
  await page.locator(".path-node.current").first().waitFor();
  // Let the scroll-to-今日 effect run.
  await page.waitForTimeout(150);
  return page.evaluate(() => {
    const header = document.querySelector(".path-title-row .fine")?.textContent || "";
    const today = document.querySelectorAll(".path-node.current");
    const node = today[0];
    const box = node?.getBoundingClientRect();
    const tabsTop = document.querySelector(".tabs")?.getBoundingClientRect().top ?? innerHeight;
    const f1 = document.querySelector('.path-node[data-lesson="F1"]');
    return {
      header,
      todayCount: today.length,
      today: node?.getAttribute("data-lesson") || "",
      todayLink: node?.tagName === "A" && node.getAttribute("href") === `#/lesson/${node.getAttribute("data-lesson")}`,
      todayMarked: node?.getAttribute("aria-current") === "step" && (node?.textContent || "").includes("今日"),
      todayInView: Boolean(box && box.top >= 0 && box.bottom <= Math.min(innerHeight, tabsTop)),
      headLine: document.querySelector(".today-line")?.getAttribute("data-today") || "",
      f1Open: f1?.tagName === "A",
      width: document.documentElement.scrollWidth,
    };
  });
}

async function lessonOpens(page, id) {
  await page.goto(`${origin}#/lesson/${id}`);
  await page.waitForTimeout(300);
  const locked = await page.getByText("先完成上一課").count();
  await page.goto(`${origin}#/`);
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
  return locked === 0;
}

async function importProgress(page, progress) {
  // Round-trip through the app's own 匯出/匯入 so the test never writes IndexedDB itself.
  await page.getByRole("link", { name: "我" }).click();
  await page.getByRole("link", { name: "設定" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出進度" }).click();
  const file = await (await download).path();
  const snap = JSON.parse(fs.readFileSync(file, "utf8"));
  snap.progress = { ...snap.progress, ...progress };
  await page.locator('input[type="file"]').setInputFiles({ name: "p.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(snap)) });
  await page.getByRole("button", { name: "確定匯入" }).click();
  await page.getByText("已匯入呢部機。").waitFor();
  await page.getByRole("link", { name: "返我" }).click();
  await page.getByRole("link", { name: "路徑" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
}

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  // CI installs its own browsers; EQ_CHROMIUM points at a preinstalled one elsewhere.
  const launch = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  const newPage = async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: browserName === "webkit",
      hasTouch: true,
      acceptDownloads: true,
      ...(browserName === "webkit" ? { userAgent: SAFARI_UA } : {}),
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    return { context, page };
  };
  const check = (label, ok, detail) => checkAs(`${tag} ${label}`, ok, detail);

  // Onboarding: no goal preselected, neutral order, 下一步 waits for a choice.
  {
    const { context, page } = await newPage();
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "情景英文" }).waitFor();
    await page.waitForFunction(() => document.documentElement.classList.contains("eq-ready"));
    await page.screenshot({ path: path.join(shots, `onboarding-${tag}-1-name.png`) });
    await page.getByLabel("點稱呼你？").fill("Penny");
    await page.getByRole("button", { name: "下一步" }).click();
    const radios = page.getByRole("radio");
    const labels = await radios.evaluateAll((els) => els.map((el) => el.querySelector("strong")?.textContent || ""));
    check("onboarding lists basics and daily life first, jewellery as one of six", JSON.stringify(labels) === JSON.stringify(ORDER), labels.join(" / "));
    const checked = await radios.evaluateAll((els) => els.filter((el) => el.getAttribute("aria-checked") === "true").length);
    check("onboarding preselects no goal", checked === 0, String(checked));
    check("onboarding 下一步 waits for a goal", await page.getByRole("button", { name: "下一步" }).isDisabled());
    await page.screenshot({ path: path.join(shots, `onboarding-${tag}-2-goal-empty.png`) });
    await page.getByRole("radio", { name: /日常生活/ }).click();
    check("onboarding 下一步 opens once a goal is picked", await page.getByRole("button", { name: "下一步" }).isEnabled());
    await page.screenshot({ path: path.join(shots, `onboarding-${tag}-3-goal-picked.png`) });
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByRole("button", { name: "開始" }).click();
    await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    await pathState(page);
    await page.screenshot({ path: path.join(shots, `home-${tag}-daily.png`) });
    await page.evaluate(() => document.querySelector(".screen")?.scrollTo(0, 0));
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(shots, `home-${tag}-top.png`) });
    await context.close();
  }

  for (const goal of GOALS) {
    const { context, page } = await newPage();
    await onboard(page, goal.label);
    const s = await pathState(page);
    check(`${goal.label} header`, s.header.includes(`Penny · ${goal.label}`), s.header);
    check(`${goal.label} 今日 is ${goal.first}`, s.today === goal.first && s.todayCount === 1, s.today);
    check(`${goal.label} 今日 is an open link`, s.todayLink);
    check(`${goal.label} 今日 is marked`, s.todayMarked && s.headLine === goal.first, s.headLine);
    check(`${goal.label} 今日 scrolled into view`, s.todayInView);
    check(`${goal.label} F1 still open`, s.f1Open);
    check(`${goal.label} 390px no sideways scroll`, s.width <= 390, String(s.width));
    await page.screenshot({ path: path.join(shots, `goal-${tag}-${goal.first.toLowerCase()}-home.png`) });
    check(`${goal.label} ${goal.first} opens`, await lessonOpens(page, goal.first));
    check(`${goal.label} ${goal.second} locked before ${goal.first}`, !(await lessonOpens(page, goal.second)));

    // Finishing the first track lesson moves 今日 along the track.
    await importProgress(page, { [goal.first]: { at: new Date().toISOString(), xp: 15 } });
    const after = await pathState(page);
    check(`${goal.label} after ${goal.first}: 今日 is ${goal.second}`, after.today === goal.second, after.today);
    check(`${goal.label} after ${goal.first}: ${goal.second} open`, after.todayLink && (await lessonOpens(page, goal.second)));
    check(`${goal.label} after ${goal.first}: F1 still open`, after.f1Open);
    if (goal.first === "F1") {
      // 打好基礎 is one run: with F1–F5 done, 今日 is F6 and it opens without J1 or R1.
      await importProgress(page, Object.fromEntries(["F2", "F3", "F4", "F5"].map((id) => [id, { at: new Date().toISOString(), xp: 15 }])));
      const basics = await pathState(page);
      check("打好基礎 after F5: 今日 is F6", basics.today === "F6", basics.today);
      check("打好基礎 after F5: F6 opens without J1 or R1", await lessonOpens(page, "F6"));
    }
    await context.close();
  }

  // Changing the goal under 我 → 設定 updates the header and 今日 with no reload.
  {
    const { context, page } = await newPage();
    await onboard(page, "珠寶櫃檯");
    const before = await pathState(page);
    check("switch: starts on J1", before.today === "J1", before.today);
    await page.evaluate(() => { window.__noReload = "kept"; });
    await page.getByRole("link", { name: "我" }).click();
    await page.getByRole("link", { name: "設定" }).click();
    await page.getByRole("radio", { name: /旅行登機/ }).click();
    await page.getByRole("link", { name: "返我" }).click();
    const me = await page.locator(".screen").innerText();
    check("switch: 我 shows 旅行登機", me.includes("旅行登機"));
    await page.getByRole("link", { name: "路徑" }).click();
    const travel = await pathState(page);
    check("switch: header is 旅行登機", travel.header.includes("Penny · 旅行登機"), travel.header);
    check("switch: 今日 is T1", travel.today === "T1" && travel.todayLink, travel.today);
    check("switch: 今日 in view", travel.todayInView);
    check("switch: F1 still open", travel.f1Open);
    await page.getByRole("link", { name: "我" }).click();
    await page.getByRole("link", { name: "設定" }).click();
    await page.getByRole("radio", { name: /打好基礎/ }).click();
    await page.getByRole("link", { name: "返我" }).click();
    await page.getByRole("link", { name: "路徑" }).click();
    const foundation = await pathState(page);
    check("switch: foundation header", foundation.header.includes("Penny · 打好基礎"), foundation.header);
    check("switch: foundation 今日 is F1", foundation.today === "F1", foundation.today);
    check("switch: no reload", (await page.evaluate(() => window.__noReload)) === "kept");
    await page.screenshot({ path: path.join(shots, `goal-${tag}-switch-foundation.png`) });
    await context.close();
  }

  await browser.close();
}

try {
  const wanted = (process.env.EQ_BROWSERS || "chromium,webkit").split(",");
  if (wanted.includes("chromium")) await runBrowser(chromium, "chromium");
  if (wanted.includes("webkit")) await runBrowser(webkit, "webkit");
} finally {
  server.close();
}

if (failures) {
  console.error(`goal e2e: ${failures} failed`);
  process.exit(1);
}
console.log("goal e2e ok");
