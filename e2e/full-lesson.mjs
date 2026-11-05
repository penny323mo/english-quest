import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const shots = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(shots, { recursive: true });

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/ missing. Run npm run build first.");
  process.exit(1);
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
  const file = path.normalize(path.join(dist, rel));
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
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
  const stat = fs.statSync(file);
  const ext = path.extname(file);
  const range = req.headers.range;
  if (range && ext === ".mp3") {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    const start = match ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : stat.size - 1;
    res.writeHead(206, {
      "content-type": "audio/mpeg",
      "content-range": `bytes ${start}-${end}/${stat.size}`,
      "accept-ranges": "bytes",
      "content-length": end - start + 1,
      "cache-control": "no-store",
    });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    "content-type": types[ext] || "application/octet-stream",
    "content-length": stat.size,
    "accept-ranges": "bytes",
    "cache-control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}/english-quest/`;
const { defaultBrowserType: _browser, ...iphone } = devices["iPhone 13"];

function log(browserName, message) {
  console.log(`[${browserName}] ${message}`);
}

async function readState(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("english-quest");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction("kv", "readonly");
    const state = await new Promise((resolve, reject) => {
      const req = tx.objectStore("kv").get("state");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return state;
  });
}

async function onboard(page) {
  await page.goto(`${origin}#/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill("Penny");
  await page.getByRole("button", { name: "下一步" }).click();
  // No goal is preselected: pick one before the next step.
  await page.getByRole("radio", { name: /打好基礎/ }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
}

async function openF1(page) {
  await page.goto(`${origin}#/lesson/F1`, { waitUntil: "domcontentloaded" });
  const enter = page.getByRole("button", { name: "入去場景" });
  await enter.waitFor();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.includes("入去場景"));
    return button && !button.disabled;
  });
}

async function tap(page, locator, browserName, label) {
  await locator.waitFor({ timeout: 8000 });
  log(browserName, `tap ${label}`);
  await locator.click();
}

async function playHearLines(page, browserName) {
  const plays = page.locator("button.hear-play");
  const count = await plays.count();
  if (!count) return 0;
  for (let i = 0; i < count; i += 1) {
    const button = plays.nth(i);
    await button.scrollIntoViewIfNeeded();
    log(browserName, `audio hear ${i + 1}/${count}`);
    await button.click();
    await page.waitForTimeout(180);
  }
  return count;
}

async function playNamedAudio(page, browserName, names) {
  let played = 0;
  for (const name of names) {
    const button = page.getByRole("button", { name, exact: true });
    if (await button.count()) {
      log(browserName, `audio ${name}`);
      await button.first().click();
      await page.waitForTimeout(200);
      played += 1;
    }
  }
  const play = page.getByRole("button", { name: "播放" });
  if (await play.count()) {
    log(browserName, "audio 播放");
    await play.first().click();
    await page.waitForTimeout(200);
    played += 1;
  }
  return played;
}

async function answerChoices(page, browserName) {
  const choices = page.locator("button.choice");
  const count = await choices.count();
  if (!count) return false;
  log(browserName, `choice 1/${count}`);
  await choices.first().click();
  return true;
}

async function assembleOrder(page, browserName) {
  const tokens = page.locator(".tokens button.token");
  const count = await tokens.count();
  if (!count) return false;
  for (let i = 0; i < count; i += 1) {
    const live = page.locator(".tokens button.token");
    if (!(await live.count())) break;
    log(browserName, `token ${i + 1}/${count}`);
    await live.first().click();
  }
  const check = page.getByRole("button", { name: "對一對" });
  if (await check.count()) {
    log(browserName, "對一對");
    await check.click();
  }
  return true;
}

async function walkLesson(page, browserName) {
  let audioTaps = 0;
  const started = Date.now();
  for (let step = 1; step <= 80; step += 1) {
    if (Date.now() - started > 90000) throw new Error(`${browserName} lesson timed out at step ${step}`);
    const body = await page.locator(".sheet").innerText();
    if (body.includes("搞掂") && /\d+\s*XP/.test(body)) {
      log(browserName, `result at step ${step}`);
      return { audioTaps, body };
    }
    if (await page.getByRole("button", { name: "入去場景" }).count()) {
      const enter = page.getByRole("button", { name: "入去場景" });
      if (await enter.isEnabled()) {
        await tap(page, enter, browserName, "入去場景");
        continue;
      }
    }
    if (await page.getByRole("button", { name: "去聽" }).count()) {
      await tap(page, page.getByRole("button", { name: "去聽" }), browserName, "去聽");
      continue;
    }
    if (await page.locator("button.hear-play").count()) {
      audioTaps += await playHearLines(page, browserName);
      await tap(page, page.getByRole("button", { name: "聽完，繼續" }), browserName, "聽完，繼續");
      continue;
    }
    if (await page.getByRole("button", { name: "跟完，去砌句" }).count()) {
      audioTaps += await playNamedAudio(page, browserName, ["聽", "慢速", "聽模範", "慢速模範"]);
      await tap(page, page.getByRole("button", { name: "跟完，去砌句" }), browserName, "跟完，去砌句");
      continue;
    }
    const nextLine = page.getByRole("button", { name: "下一句" });
    const toQuiz = page.getByRole("button", { name: "去小測" });
    if ((await nextLine.count()) || (await toQuiz.count())) {
      audioTaps += await playNamedAudio(page, browserName, ["聽 Mei", "慢速", "聽模範", "慢速模範"]);
      const partner = page.locator("button").filter({ hasText: /^聽 / });
      if (await partner.count()) {
        log(browserName, "audio partner");
        await partner.first().click();
        await page.waitForTimeout(200);
        audioTaps += 1;
      }
      if (await nextLine.count()) await tap(page, nextLine, browserName, "下一句");
      else await tap(page, toQuiz, browserName, "去小測");
      continue;
    }
    if (await page.getByRole("button", { name: "去溫習" }).count()) {
      const pairs = page.locator(".pair button.choice, .tokens button.token");
      const n = await pairs.count();
      for (let i = 0; i < n; i += 1) {
        log(browserName, `audio sound ${i + 1}/${n}`);
        await pairs.nth(i).click();
        await page.waitForTimeout(120);
        audioTaps += 1;
      }
      await tap(page, page.getByRole("button", { name: "去溫習" }), browserName, "去溫習");
      continue;
    }
    if (await page.locator(".tokens button.token").count() && await page.getByRole("button", { name: "對一對" }).count()) {
      await assembleOrder(page, browserName);
      const cont = page.getByRole("button", { name: "繼續" });
      if (await cont.count()) await tap(page, cont, browserName, "繼續");
      continue;
    }
    if (await page.locator("button.choice").count() && !(await page.locator(".result-sheet").count())) {
      audioTaps += await playNamedAudio(page, browserName, []);
      await answerChoices(page, browserName);
      continue;
    }
    const cont = page.getByRole("button", { name: "繼續" });
    if (await cont.count()) {
      await tap(page, cont, browserName, "繼續");
      continue;
    }
    const skip = page.getByRole("button", { name: "跳過呢題" });
    if (await skip.count()) {
      await tap(page, skip, browserName, "跳過呢題");
      continue;
    }
    throw new Error(`${browserName} stuck at step ${step}: ${body.slice(0, 240)}`);
  }
  throw new Error(`${browserName} did not reach the result screen`);
}

async function runBrowser(browserType) {
  const browserName = browserType.name();
  const browser = await browserType.launch();
  const page = await browser.newPage({
    ...iphone,
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
  });
  const size = page.viewportSize();
  if (!size || size.width !== 390 || size.height !== 844) {
    throw new Error(`${browserName} viewport ${size?.width}x${size?.height}`);
  }
  let crashed = false;
  await page.addInitScript(() => {
    const stats = { play: 0, playOk: 0, playErr: [] };
    const proto = HTMLAudioElement.prototype;
    const orig = proto.play;
    proto.play = function patchedPlay() {
      stats.play += 1;
      return orig.call(this).then(
        (value) => {
          stats.playOk += 1;
          return value;
        },
        (err) => {
          if (stats.playErr.length < 6) stats.playErr.push(String(err && err.name || err));
          throw err;
        },
      );
    };
    window.__audioStats = stats;
  });
  page.on("crash", () => {
    crashed = true;
    log(browserName, "PAGE CRASH");
  });
  browser.on("disconnected", () => log(browserName, "browser disconnected"));
  page.on("pageerror", (err) => log(browserName, `pageerror ${err.message}`));
  try {
    await onboard(page);
    await openF1(page);
    const { audioTaps, body } = await walkLesson(page, browserName);
    if (audioTaps < 5) throw new Error(`${browserName} only played ${audioTaps} audio steps`);
    const xp = body.match(/(\d+)\s*XP/);
    if (!xp || Number(xp[1]) <= 0) throw new Error(`${browserName} result missing XP: ${body.slice(0, 300)}`);
    if (!body.includes("搞掂")) throw new Error(`${browserName} missing result heading`);
    await page.screenshot({ path: path.join(shots, `${browserName}-f1-result.png`) });
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
      return Boolean(state && state.progress && state.progress.F1 && state.profile && state.profile.xp > 0);
    });
    const before = await readState(page);
    const xpBefore = before.profile.xp;
    const lessonXp = before.progress.F1.xp;
    const audioStats = await page.evaluate(() => window.__audioStats);
    log(browserName, `audio ${JSON.stringify(audioStats)}`);
    if (!audioStats || audioStats.playOk < 5) {
      throw new Error(`${browserName} audio did not play: ${JSON.stringify(audioStats)}`);
    }
    log(browserName, `saved xp ${xpBefore} lesson ${lessonXp}`);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("html.eq-ready").waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "入去場景" }).waitFor({ timeout: 15000 });
    const after = await readState(page);
    if (!after.progress.F1) throw new Error(`${browserName} progress lost after reload`);
    if (after.progress.F1.xp !== lessonXp) throw new Error(`${browserName} lesson xp changed`);
    if (after.profile.xp !== xpBefore) throw new Error(`${browserName} profile xp changed`);
    await page.goto(`${origin}#/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    const home = await page.locator("body").innerText();
    if (!home.includes(`${xpBefore} XP`)) throw new Error(`${browserName} home hid XP: ${home.slice(0, 400)}`);
    if (!home.includes("完成")) throw new Error(`${browserName} home hid finished lesson`);
    await page.screenshot({ path: path.join(shots, `${browserName}-f1-persisted.png`) });
    log(browserName, `persisted xp ${after.profile.xp} audioTaps ${audioTaps}`);
    if (crashed) throw new Error(`${browserName} crashed`);
  } finally {
    await browser.close().catch(() => {});
  }
}

const only = process.argv[2];
const types = [webkit, chromium].filter((type) => !only || type.name() === only);
try {
  for (const type of types) await runBrowser(type);
  console.log("full-lesson e2e ok");
} finally {
  server.close();
}
