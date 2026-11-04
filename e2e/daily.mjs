// 每日抽卡 at 390px in Chromium and WebKit (iPhone Safari): open the day's pack, see the
// animation, play the word, show the hint, flip, play the sentence, finish (XP, streak,
// cards join 生字回顧), and reload the same Macau day to get the same three cards.
// Screenshots: animation frames, a card front and a card back, per browser.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const shots = process.env.EQ_SHOTS || "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(shots, { recursive: true });
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const lexById = Object.fromEntries(lex.items.map((item) => [item.id, item]));
const SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
// 10:00 in Macau on 4 Nov 2026; the next Macau day starts at 16:00 UTC.
const DAY = new Date("2026-11-04T02:00:00Z");
const NEXT_DAY = new Date("2026-11-05T02:00:00Z");

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
  const ext = path.extname(file);
  const size = fs.statSync(file).size;
  const range = req.headers.range;
  if (range && ext === ".mp3") {
    const [startText, endText] = range.replace("bytes=", "").split("-");
    const start = Number(startText) || 0;
    const end = endText ? Number(endText) : size - 1;
    res.writeHead(206, { "content-type": "audio/mpeg", "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "content-type": types[ext] || "application/octet-stream", "cache-control": "no-store", "accept-ranges": "bytes", "content-length": size });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}/english-quest/`;

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`assert ${label}: ${ok ? "pass" : "FAIL"}${detail ? ` ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function newPage(browser, browserName, extra = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: browserName === "webkit",
    hasTouch: true,
    acceptDownloads: true,
    ...(browserName === "webkit" ? { userAgent: SAFARI_UA } : {}),
    ...extra,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.clock.setFixedTime(DAY);
  await page.addInitScript(() => {
    const plays = [];
    const orig = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function play() {
      const row = { src: this.src, ok: null };
      plays.push(row);
      return orig.call(this).then(
        (value) => { row.ok = true; return value; },
        (err) => { row.ok = String((err && err.name) || err); throw err; },
      );
    };
    window.__plays = plays;
  });
  return { context, page };
}

async function onboard(page) {
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "情景英文" }).waitFor();
  await page.getByLabel("點稱呼你？").fill("Penny");
  for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
}

async function drawnIds(page) {
  await page.locator(".draw-card").waitFor();
  return page.evaluate(async () => {
    const out = [];
    const dots = [...document.querySelectorAll(".draw-dot")];
    for (const dot of dots) out.push(dot.textContent.trim());
    return { lemmas: out, first: document.querySelector(".draw-card")?.getAttribute("data-card") };
  });
}

async function lastPlay(page, since) {
  await page.waitForFunction((n) => window.__plays.length > n && window.__plays.at(-1).ok !== null, since, { timeout: 10000 }).catch(() => undefined);
  return page.evaluate(() => window.__plays.at(-1) || null);
}

async function exportState(page) {
  await page.goto(`${origin}#/settings`);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出進度" }).click();
  return JSON.parse(fs.readFileSync(await (await download).path(), "utf8"));
}

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  const launchOpts = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launchOpts);
  try {
    const { context, page } = await newPage(browser, browserName);
    await onboard(page);
    const entry = page.locator(".daily-entry");
    check(`${tag} path shows 每日任務`, (await entry.innerText()).includes("每日任務"));
    await page.waitForTimeout(200);
    const float = await page.evaluate(() => {
      const box = document.querySelector(".daily-float")?.getBoundingClientRect();
      const tabs = document.querySelector(".tabs")?.getBoundingClientRect().top ?? innerHeight;
      return Boolean(box && box.top >= 0 && box.bottom <= tabs && box.left >= 0 && box.right <= innerWidth);
    });
    check(`${tag} 每日任務 stays in view after the path scrolls to 今日`, float);
    await page.screenshot({ path: path.join(shots, `daily-${tag}-0-path.png`) });

    // Open the pack and catch the animation.
    await entry.click();
    await page.locator(".draw-pack").waitFor();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(shots, `daily-${tag}-1-shake.png`) });
    await page.waitForFunction(() => document.querySelectorAll(".pack-card.in").length >= 1, null, { timeout: 3000 }).catch(() => undefined);
    await page.screenshot({ path: path.join(shots, `daily-${tag}-2-reveal.png`) });
    await page.waitForFunction(() => document.querySelectorAll(".pack-card.in").length >= 3, null, { timeout: 3000 }).catch(() => undefined);
    check(`${tag} pack reveals three cards one by one`, (await page.locator(".pack-card.in").count()) === 3);
    await page.screenshot({ path: path.join(shots, `daily-${tag}-3-revealed.png`) });
    const t0 = Date.now();
    await page.locator(".draw-card").waitFor();
    check(`${tag} animation ends on its own in about a second`, Date.now() - t0 < 1500, `${Date.now() - t0}ms after the last reveal`);

    const first = await drawnIds(page);
    check(`${tag} three cards drawn`, first.lemmas.length === 3 && new Set(first.lemmas).size === 3, first.lemmas.join(", "));

    // Same Macau day, reload before finishing: the same three.
    await page.reload();
    await page.getByRole("heading", { name: "每日抽卡" }).waitFor();
    await page.getByRole("button", { name: "跳過動畫" }).click();
    const again = await drawnIds(page);
    check(`${tag} reload mid-way keeps the same cards`, JSON.stringify(again.lemmas) === JSON.stringify(first.lemmas), again.lemmas.join(", "));

    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      const card = page.locator(".draw-card");
      const id = await card.getAttribute("data-card");
      ids.push(id);
      const item = lexById[id];
      check(`${tag} card ${i + 1} front shows ${item.lemma}`, (await page.locator(".draw-face.front .draw-word").innerText()) === item.lemma);
      await page
        .waitForFunction(() => {
          const img = document.querySelector(".draw-face.front img.draw-art");
          return Boolean(img && img.complete && img.naturalWidth > 0);
        }, null, { timeout: 5000 })
        .catch(() => undefined);
      const art = await page.evaluate(() => {
        const img = document.querySelector(".draw-face.front img.draw-art");
        return img ? { src: img.getAttribute("src"), loaded: img.complete && img.naturalWidth > 0 } : null;
      });
      check(`${tag} card ${i + 1} shows its picture`, Boolean(art && art.loaded && art.src.endsWith(`assets/art/cards/${id}.svg`)), JSON.stringify(art));

      const before = await page.evaluate(() => window.__plays.length);
      await page.getByRole("button", { name: `聽 ${item.lemma}` }).click();
      const word = await lastPlay(page, before);
      check(`${tag} card ${i + 1} 🔊 plays the word clip`, Boolean(word && word.src.endsWith(`/audio/words/${id}-word.mp3`) && word.ok === true), JSON.stringify(word));

      if (i === 0) await page.screenshot({ path: path.join(shots, `daily-${tag}-4-front.png`) });
      await page.getByRole("button", { name: "提示" }).click();
      const hint = await page.locator(".draw-hint").innerText();
      check(`${tag} card ${i + 1} 提示 shows the Cantonese gloss`, hint === item.glossYue && /[一-鿿]/.test(hint), hint);
      if (i === 0) await page.screenshot({ path: path.join(shots, `daily-${tag}-5-hint.png`) });

      await card.click({ position: { x: 40, y: 40 } });
      await page.waitForTimeout(350);
      check(`${tag} card ${i + 1} flips on tap`, (await card.getAttribute("class")).includes("flipped"));
      const example = await page.locator(".draw-face.back .draw-example").innerText();
      check(`${tag} card ${i + 1} back shows the checked example`, example === item.example.replace(/\{\{learner(-spell)?\}\}/g, "Penny"), example);
      check(`${tag} card ${i + 1} back shows the Cantonese gloss`, (await page.locator(".draw-face.back .draw-gloss").innerText()).length > 0);
      const beforeSentence = await page.evaluate(() => window.__plays.length);
      await page.getByRole("button", { name: "聽例句" }).click();
      const sentence = await lastPlay(page, beforeSentence);
      check(`${tag} card ${i + 1} back 🔊 plays the sentence clip`, Boolean(sentence && sentence.src.endsWith(item.audio.replace(/^assets/, "")) && sentence.ok === true), JSON.stringify(sentence));
      if (i === 0) await page.screenshot({ path: path.join(shots, `daily-${tag}-6-back.png`) });
      if (i < 2) await page.getByRole("button", { name: "下一張" }).click();
    }
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    check(`${tag} 390px no sideways scroll`, width <= 390, String(width));

    await page.getByRole("button", { name: "完成今日抽卡" }).click();
    const done = await page.locator(".draw-done").innerText();
    check(`${tag} finishing gives XP`, done.includes("+10 XP"), done.replace(/\s+/g, " "));
    await page.screenshot({ path: path.join(shots, `daily-${tag}-7-done.png`) });

    const state = await exportState(page);
    check(`${tag} daily stored as done`, state.daily?.done === true && JSON.stringify(state.daily.ids) === JSON.stringify(ids), JSON.stringify(state.daily));
    check(`${tag} cards joined 生字回顧`, ids.every((id) => state.cards[id]), Object.keys(state.cards).join(","));
    check(`${tag} 打卡 and XP`, state.profile.xp === 10 && state.profile.streak === 1, `xp ${state.profile.xp} streak ${state.profile.streak}`);

    // Reload the same day: same cards, already done, no second XP.
    await page.goto(`${origin}#/daily`);
    await page.reload();
    await page.locator(".draw-done").waitFor();
    const after = await drawnIds(page);
    check(`${tag} same day reload: same cards`, after.first === ids[0] && after.lemmas.join() === ids.map((id) => lexById[id].lemma).join(), after.lemmas.join(", "));
    check(`${tag} same day reload: already done`, (await page.locator(".draw-done").innerText()).includes("今日抽卡已完成"));
    check(`${tag} same day reload: no pack again`, (await page.locator(".draw-pack").count()) === 0);
    await page.goto(origin);
    await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    check(`${tag} path shows the task done`, (await page.locator(".daily-entry").innerText()).includes("今日抽卡完成"));
    check(`${tag} the floating 每日任務 goes once done`, (await page.locator(".daily-float").count()) === 0);
    check(`${tag} XP not given twice`, (await page.locator(".path-head").innerText()).includes("10 XP"));

    // The next Macau day: a fresh draw with none of yesterday's cards.
    await page.clock.setFixedTime(NEXT_DAY);
    await page.goto(`${origin}#/daily`);
    await page.reload();
    await page.getByRole("button", { name: "跳過動畫" }).click();
    const next = await page.locator(".draw-card").getAttribute("data-card");
    const nextState = await exportState(page);
    check(`${tag} next day draws new cards`, nextState.daily.date === "2026-11-05" && nextState.daily.ids.every((id) => !ids.includes(id)), JSON.stringify(nextState.daily.ids));
    check(`${tag} next day shows its first card`, nextState.daily.ids[0] === next);
    await context.close();

    // Reduced motion: no shake or reveal, the cards are there at once.
    const reduced = await newPage(browser, browserName, { reducedMotion: "reduce" });
    await onboard(reduced.page);
    await reduced.page.goto(`${origin}#/daily`);
    await reduced.page.locator(".draw-card").waitFor({ timeout: 2000 });
    check(`${tag} reduced motion skips the pack`, (await reduced.page.locator(".draw-pack").count()) === 0);
    const transition = await reduced.page.evaluate(() => getComputedStyle(document.querySelector(".draw-inner")).transitionDuration);
    check(`${tag} reduced motion flips without a turn`, /^0s(, 0s)*$/.test(transition), transition);
    await reduced.context.close();
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
  console.error(`daily e2e: ${failures} failed`);
  process.exit(1);
}
console.log("daily e2e ok");
