// Only one sound plays at a time (review finding 7). A clip stops a line that is
// still being spoken, and 聽我 (the learner's take) and 聽模範 (the model) stop each
// other. Chromium and WebKit, with fake speech, media and recorder.
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

// Fakes, so the test sees what plays without real audio devices:
// - speechSynthesis records whether a line is still being spoken;
// - every media element's play()/pause() marks it playing or not;
// - a microphone and recorder that make a tiny take, so 聽我 appears.
function fakes() {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  const speech = {
    speaking: false,
    speak() { this.speaking = true; },
    cancel() { this.speaking = false; },
    getVoices: () => [],
    addEventListener() {},
  };
  Object.defineProperty(window, "speechSynthesis", { value: speech, configurable: true });
  window.__media = [];
  HTMLMediaElement.prototype.play = function play() {
    if (!window.__media.includes(this)) window.__media.push(this);
    this.__on = true;
    return Promise.resolve();
  };
  const pause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function () {
    this.__on = false;
    return pause.call(this);
  };
  const track = { readyState: "live", stop() { this.readyState = "ended"; } };
  const devices = { getUserMedia: async () => ({ getTracks: () => [track], getAudioTracks: () => [track] }) };
  for (const target of [Navigator.prototype, navigator]) {
    try { Object.defineProperty(target, "mediaDevices", { get: () => devices, configurable: true }); } catch { /* other target */ }
  }
  class FakeRecorder {
    constructor(stream) { this.stream = stream; this.state = "inactive"; this.mimeType = "audio/webm"; }
    static isTypeSupported() { return true; }
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["take"], { type: "audio/webm" }) });
      this.onstop?.();
    }
  }
  window.MediaRecorder = FakeRecorder;
}

const playing = (page) => page.evaluate(() => window.__media.filter((m) => m.__on).length);
const speaking = (page) => page.evaluate(() => window.speechSynthesis.speaking);

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

/** Open F1 at its 跟讀 beat by saving a resume point there, then pressing 繼續. */
async function openShadow(page) {
  await page.evaluate(
    () =>
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
            state.lessonCursor = { lessonId: "F1", beat: 5, sub: 0, quizScore: 0, quizAnswered: 0 };
            if (typeof state.rev === "number") state.rev += 1;
            store.put(state, "state");
          };
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
  await page.evaluate(() => { location.hash = "#/lesson/F1"; });
  await page.getByRole("button", { name: "繼續", exact: true }).click();
  await page.getByText("跟住讀").waitFor();
}

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  const launch = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(fakes);
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await onboard(page);
    await openShadow(page);

    // A line is still being spoken (runtime speech) when a recorded clip starts.
    await page.evaluate(() => window.speechSynthesis.speak({}));
    await page.locator(".row-btns").getByRole("button", { name: "聽", exact: true }).click();
    check(`${tag} a clip stops a line that is still being spoken`, (await speaking(page)) === false);
    check(`${tag} one clip plays`, (await playing(page)) === 1, String(await playing(page)));

    // Record a take, then play the model and the take one after the other.
    await page.getByRole("button", { name: "錄音，同模範比較" }).click();
    await page.getByRole("button", { name: "停錄音" }).click();
    await page.getByRole("button", { name: "聽我" }).waitFor();
    await page.getByRole("button", { name: "聽模範" }).click();
    await page.evaluate(() => window.speechSynthesis.speak({}));
    await page.getByRole("button", { name: "聽我" }).click();
    check(`${tag} 聽我 stops the model clip`, (await playing(page)) === 1, String(await playing(page)));
    check(`${tag} 聽我 stops a spoken line`, (await speaking(page)) === false);
    await page.getByRole("button", { name: "聽模範" }).click();
    check(`${tag} 聽模範 stops the learner's take`, (await playing(page)) === 1, String(await playing(page)));
    await context.close();
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
  console.error(`audio e2e: ${failures} failed`);
  process.exit(1);
}
console.log("audio e2e ok");
