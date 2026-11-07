// 每日抽卡 at 390px in Chromium and WebKit (iPhone Safari): open the day's pack, see the
// animation, play the word, show the hint, flip, play the sentence, finish (XP, streak,
// cards join 生字回顧), and reload the same Macau day to get the same three cards.
// Screenshots: animation frames, a card front and a card back, per browser.
import http from "node:http";
import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";
import { NOT_DRAWN, macauDate } from "../web/src/daily.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const shots = process.env.EQ_SHOTS || "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(shots, { recursive: true });
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const lexById = Object.fromEntries(lex.items.map((item) => [item.id, item]));
const wordClips = JSON.parse(fs.readFileSync(path.join(root, "content/word-audio.json"), "utf8")).items;

// Keep the missing-clip behaviour covered even when the real deck is complete.
// Only this Vite test server replaces its JSON module; production data is untouched.
const missingWord = "a-art";
const missingManifest = { ...JSON.parse(fs.readFileSync(path.join(root, "content/word-audio.json"), "utf8")), items: { ...wordClips } };
delete missingManifest.items[missingWord];
const missingServer = await createServer({
  configFile: path.join(root, "vite.config.ts"),
  server: { host: "127.0.0.1", port: 0, strictPort: false },
  plugins: [{ name: "missing-word-fixture", enforce: "pre", load(id) {
    if (id === path.join(root, "content/word-audio.json")) return JSON.stringify(missingManifest);
  } }],
});
await missingServer.listen();
const missingOrigin = `http://127.0.0.1:${missingServer.httpServer.address().port}/english-quest/`;
function uncheckedDraw() {
  const checked = lex.items.filter(item => !item.hidden && !NOT_DRAWN.has(item.id) && item.id !== missingWord && wordClips[item.id]).slice(0, 2).map(item => item.id);
  return { id: missingWord, index: 0, ids: [missingWord, ...checked] };
}
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

async function onboard(page, entry = origin) {
  await page.goto(entry, { waitUntil: "domcontentloaded" });
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

async function drawnIds(page) {
  await page.locator(".draw-card").waitFor();
  return page.evaluate(async () => {
    const out = [];
    const dots = [...document.querySelectorAll(".draw-dot")];
    for (const dot of dots) out.push(dot.textContent.trim());
    return { lemmas: out, first: document.querySelector(".draw-card")?.getAttribute("data-card") };
  });
}

/**
 * Which face is actually painted: hit-test the card centre and the centre of the
 * face's own text. WebKit once painted the back (mirrored) over the front.
 */
async function paintedFace(page, want) {
  return page.evaluate((want) => {
    const card = document.querySelector(".draw-card");
    const target = document.querySelector(want === "front" ? ".draw-face.front .draw-word" : ".draw-face.back .draw-example");
    if (!card || !target) return { ok: false, why: "missing card or text" };
    const centre = (el) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    };
    const atCard = document.elementFromPoint(...centre(card));
    const atText = document.elementFromPoint(...centre(target));
    const faceOf = (el) => (el?.closest(".draw-face.front") ? "front" : el?.closest(".draw-face.back") ? "back" : "none");
    const textHit = Boolean(atText && (atText === target || target.contains(atText)));
    return {
      ok: faceOf(atCard) === want && textHit,
      cardCentre: faceOf(atCard),
      textHit,
      hit: atText ? `${atText.tagName.toLowerCase()}.${atText.className}: ${(atText.textContent || "").trim().slice(0, 30)}` : null,
    };
  }, want);
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

/** Put a stored draw for today into IndexedDB as another build might have left it. */
async function storeDraw(page, daily, xp) {
  await page.evaluate(
    ({ daily, xp }) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("english-quest");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("kv", "readwrite");
          const store = tx.objectStore("kv");
          const get = store.get("state");
          get.onsuccess = () => {
            const state = get.result;
            state.daily = daily;
            state.profile.xp = xp;
            if (typeof state.rev === "number") state.rev += 1;
            store.put(state, "state");
          };
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
      }),
    { daily, xp },
  );
  // Reload on the path before opening 每日抽卡: the running app still holds the old
  // state, and opening the draw first would draw and save a fresh one over this record.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
}

const validDraw = (ids) => ids.length === 3 && new Set(ids).size === 3 && ids.every((id) => lexById[id] && id !== "jewelry-noun" && id !== "elevator-noun");

/** A stored draw with duplicates, an unknown id or a card that is not drawn is repaired. */
async function brokenDraws(browser, browserName, tag) {
  const today = macauDate(DAY);

  // Finished day: stays finished, shows three valid cards, no XP again.
  const done = await newPage(browser, browserName);
  await onboard(done.page);
  await storeDraw(done.page, { date: today, ids: ["gold-noun", "gold-noun", "no-such-card"], done: true, history: [] }, 10);
  await done.page.evaluate(() => { location.hash = "#/daily"; });
  await done.page.locator(".draw-done").waitFor();
  check(`${tag} broken finished draw shows three cards`, (await done.page.locator(".draw-dot").count()) === 3);
  check(`${tag} broken finished draw stays finished`, (await done.page.locator(".draw-done").innerText()).includes("今日抽卡已完成"));
  const doneState = await exportState(done.page);
  check(`${tag} broken finished draw is repaired`, validDraw(doneState.daily.ids) && doneState.daily.ids[0] === "gold-noun" && doneState.daily.done === true, JSON.stringify(doneState.daily));
  check(`${tag} broken finished draw gives no XP again`, doneState.profile.xp === 10, String(doneState.profile.xp));
  check(`${tag} repaired cards join 生字回顧`, doneState.daily.ids.every((id) => doneState.cards[id]), Object.keys(doneState.cards).join(","));
  await done.context.close();

  // Unfinished day: three valid cards that can be finished once, for XP once.
  const open = await newPage(browser, browserName);
  await onboard(open.page);
  await storeDraw(open.page, { date: today, ids: ["jewelry-noun", "ring-noun"], done: false, history: [] }, 0);
  await open.page.evaluate(() => { location.hash = "#/daily"; });
  const skip = open.page.getByRole("button", { name: "跳過動畫" });
  if (await skip.count()) await skip.click();
  await open.page.locator(".draw-card").waitFor();
  check(`${tag} broken open draw shows three cards`, (await open.page.locator(".draw-dot").count()) === 3);
  for (let i = 0; i < 3; i += 1) {
    await open.page.locator(".draw-card").click({ position: { x: 40, y: 40 } });
    await open.page.waitForTimeout(350);
    const next = open.page.getByRole("button", { name: i < 2 ? "下一張" : "完成今日抽卡" });
    await next.click();
  }
  await open.page.locator(".draw-done").waitFor();
  const openState = await exportState(open.page);
  check(`${tag} broken open draw is repaired and finishable`, validDraw(openState.daily.ids) && openState.daily.ids.includes("ring-noun") && openState.daily.done === true, JSON.stringify(openState.daily));
  check(`${tag} finishing a repaired draw gives XP once`, openState.profile.xp === 10, String(openState.profile.xp));
  await open.page.goto(`${origin}#/daily`);
  await open.page.reload();
  await open.page.locator(".draw-done").waitFor();
  const again = await exportState(open.page);
  check(`${tag} reloading a repaired draw keeps it`, JSON.stringify(again.daily.ids) === JSON.stringify(openState.daily.ids) && again.profile.xp === 10, `${JSON.stringify(again.daily.ids)} xp ${again.profile.xp}`);
  await open.context.close();
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

      if (wordClips[id]) {
        const before = await page.evaluate(() => window.__plays.length);
        await page.getByRole("button", { name: `聽 ${item.lemma}` }).click();
        const word = await lastPlay(page, before);
        check(`${tag} card ${i + 1} 🔊 plays the word clip`, Boolean(word && word.src.endsWith(`/audio/words/${id}-word.mp3`) && word.ok === true), JSON.stringify(word));
      } else {
        // Drawn although its word clip has not passed the ASR check: no word 🔊.
        check(`${tag} card ${i + 1} (no checked word clip) shows no word 🔊`, (await page.getByRole("button", { name: `聽 ${item.lemma}` }).count()) === 0);
      }

      const front = await paintedFace(page, "front");
      check(`${tag} card ${i + 1} front is painted (word hit at the card centre)`, front.ok, JSON.stringify(front));
      if (i === 0) await page.screenshot({ path: path.join(shots, `daily-${tag}-4-front.png`) });
      await page.getByRole("button", { name: "提示" }).click();
      const hint = await page.locator(".draw-hint").innerText();
      check(`${tag} card ${i + 1} 提示 shows the Cantonese gloss`, hint === item.glossYue && /[一-鿿]/.test(hint), hint);
      const withHint = await paintedFace(page, "front");
      check(`${tag} card ${i + 1} front is still painted with the hint open`, withHint.ok, JSON.stringify(withHint));
      if (i === 0) await page.screenshot({ path: path.join(shots, `daily-${tag}-5-hint.png`) });

      await card.click({ position: { x: 40, y: 40 } });
      await page.waitForTimeout(350);
      check(`${tag} card ${i + 1} flips on tap`, (await card.getAttribute("class")).includes("flipped"));
      const backFace = await paintedFace(page, "back");
      check(`${tag} card ${i + 1} back is painted after the flip`, backFace.ok, JSON.stringify(backFace));
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

    // These three formerly missing front-face recordings must play real bytes.
    const recovered = await newPage(browser, browserName, { reducedMotion: "reduce" });
    await onboard(recovered.page);
    const recoveredIds = ["a-art", "fee-noun", "led-verb"];
    await storeDraw(recovered.page, { date: macauDate(DAY), ids: recoveredIds, done: false, history: [] }, 0);
    await recovered.page.evaluate(() => { location.hash = "#/daily"; });
    for (let i = 0; i < recoveredIds.length; i += 1) {
      const id = recoveredIds[i];
      await recovered.page.locator(".draw-dot").nth(i).click();
      const before = await recovered.page.evaluate(() => window.__plays.length);
      await recovered.page.getByRole("button", { name: `聽 ${lexById[id].lemma}`, exact: true }).click();
      const played = await lastPlay(recovered.page, before);
      check(`${tag} recovered ${id} plays its word recording`, Boolean(played && played.ok === true && played.src.endsWith(wordClips[id].audio.replace(/^assets/, ""))), JSON.stringify(played));
      const duration = await recovered.page.evaluate(async (src) => {
        const response = await fetch(src);
        const context = new AudioContext();
        try { return (await context.decodeAudioData(await response.arrayBuffer())).duration; }
        finally { await context.close(); }
      }, wordClips[id].audioSlow.replace(/^assets/, `${origin}assets`));
      check(`${tag} recovered ${id} slow file decodes`, duration > .5 && duration < 3, String(duration));
    }
    await recovered.context.close();

    // A card whose word clip has not passed the ASR check is still drawn, without the word 🔊.
    const unchecked = uncheckedDraw();
    const plain = await newPage(browser, browserName);
    await onboard(plain.page, missingOrigin);
    await storeDraw(plain.page, { date: macauDate(DAY), ids: unchecked.ids, done: false, history: [] }, 0);
    await plain.page.evaluate(() => { location.hash = "#/daily"; });
    const skipPack = plain.page.getByRole("button", { name: "跳過動畫" });
    await skipPack.waitFor({ timeout: 5000 }).catch(() => undefined);
    if (await skipPack.count()) await skipPack.click();
    await plain.page.locator(".draw-dot").nth(unchecked.index).click();
    const plainItem = lexById[unchecked.id];
    check(`${tag} unchecked card ${unchecked.id} is drawn`, (await plain.page.locator(".draw-card").getAttribute("data-card")) === unchecked.id);
    check(`${tag} unchecked card shows no word 🔊`, (await plain.page.getByRole("button", { name: `聽 ${plainItem.lemma}` }).count()) === 0);
    await plain.page.getByRole("button", { name: "提示" }).click();
    check(`${tag} unchecked card still has 提示`, (await plain.page.locator(".draw-hint").innerText()) === plainItem.glossYue);
    await plain.page.locator(".draw-card").click({ position: { x: 40, y: 40 } });
    await plain.page.waitForTimeout(350);
    const plainBefore = await plain.page.evaluate(() => window.__plays.length);
    await plain.page.getByRole("button", { name: "聽例句" }).click();
    const plainSentence = await lastPlay(plain.page, plainBefore);
    check(`${tag} unchecked card back still plays its checked sentence`, Boolean(plainSentence && plainSentence.src.endsWith(plainItem.audio.replace(/^assets/, "")) && plainSentence.ok === true), JSON.stringify(plainSentence));
    await plain.context.close();

    await brokenDraws(browser, browserName, tag);

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
  await missingServer.close();
}

if (failures) {
  console.error(`daily e2e: ${failures} failed`);
  process.exit(1);
}
console.log("daily e2e ok");
