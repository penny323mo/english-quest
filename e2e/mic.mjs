// The microphone must never be left on (review finding 2). A double tap while the
// permission prompt is open asks once; a stream that arrives after leaving the lesson,
// or one given to a recorder that fails, is stopped; leaving mid-recording turns it off.
// Chromium and WebKit, with a fake microphone.
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
// EQ_ORIGIN runs the same checks against another server, such as the Vite dev server,
// where React StrictMode mounts, cleans up and mounts each effect again.
const origin = process.env.EQ_ORIGIN || `http://127.0.0.1:${server.address().port}/english-quest/`;

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`assert ${label}: ${ok ? "pass" : "FAIL"}${detail ? ` ${detail}` : ""}`);
  if (!ok) failures += 1;
}

// A fake microphone: the permission answer arrives after window.__micDelay ms, and every
// stream it hands out is kept so the test can see whether its tracks were stopped.
// Live speech recognition is hidden, so the lesson uses record-and-compare.
function fakeMic() {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  window.__micDelay = 0;
  window.__asks = 0;
  window.__streams = [];
  window.__breakRecorder = false;
  const RealRecorder = window.MediaRecorder;
  // A real MediaStream where the browser can make one; otherwise a stand-in with
  // tracks that report readyState the same way.
  function makeStream() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const dest = ctx.createMediaStreamDestination();
      osc.connect(dest);
      osc.start();
      if (dest.stream.getTracks().length) return dest.stream;
    } catch {
      /* fall through to the stand-in */
    }
    const track = { kind: "audio", readyState: "live", stop() { this.readyState = "ended"; } };
    return { getTracks: () => [track], getAudioTracks: () => [track] };
  }
  const devices = {
    getUserMedia() {
      window.__asks += 1;
      return new Promise((resolve) => {
        setTimeout(() => {
          const stream = makeStream();
          window.__streams.push(stream);
          resolve(stream);
        }, window.__micDelay);
      });
    },
  };
  // WebKit may have no navigator.mediaDevices here; define it where the app reads it.
  for (const target of [Navigator.prototype, navigator]) {
    try {
      Object.defineProperty(target, "mediaDevices", { get: () => devices, configurable: true });
    } catch {
      /* the other target still works */
    }
  }
  window.__fakeMic = navigator.mediaDevices === devices;
  function BrokenOr(stream, options) {
    if (window.__breakRecorder || !RealRecorder) throw new DOMException("not supported", "NotSupportedError");
    return new RealRecorder(stream, options);
  }
  BrokenOr.isTypeSupported = (t) => (RealRecorder ? RealRecorder.isTypeSupported(t) : false);
  window.MediaRecorder = BrokenOr;
}

const live = (page) => page.evaluate(() => window.__streams.filter((s) => s.getTracks().some((t) => t.readyState === "live")).length);
const asks = (page) => page.evaluate(() => window.__asks);

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
  await page.goto(`${origin}#/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "學習路徑" }).waitFor();
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
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
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

const recordButton = (page) => page.getByRole("button", { name: "錄音，同模範比較" });

async function runBrowser(browserType, browserName) {
  const tag = browserName === "webkit" ? "safari" : "chrome";
  const launch = browserName === "chromium" && process.env.EQ_CHROMIUM ? { executablePath: process.env.EQ_CHROMIUM } : {};
  const browser = await browserType.launch(launch);
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(fakeMic);
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await onboard(page);
    const installed = await page.evaluate(() => window.__fakeMic === true);
    check(`${tag} the fake microphone is in place`, installed);
    if (!installed) return;

    // 1. Double tap while the permission prompt is open, then leave before it answers.
    await openShadow(page);
    await page.evaluate(() => { window.__micDelay = 1500; });
    await recordButton(page).click();
    await recordButton(page).click({ force: true, timeout: 2000 }).catch(() => undefined);
    await page.waitForTimeout(100);
    check(`${tag} a second tap while asking does not ask again`, (await asks(page)) === 1, String(await asks(page)));
    await page.getByRole("link", { name: "關閉" }).click();
    await page.getByRole("heading", { name: "學習路徑" }).waitFor();
    await page.waitForTimeout(2000);
    check(`${tag} a stream that arrives after leaving the lesson is stopped`, (await live(page)) === 0, `${await live(page)} live`);

    // 2. The recorder cannot be made: the stream it was given is stopped.
    await openShadow(page);
    await page.evaluate(() => { window.__micDelay = 0; window.__breakRecorder = true; window.__streams = []; });
    await recordButton(page).click();
    await page.locator("p.mic-state", { hasText: "咪開唔到" }).waitFor();
    check(`${tag} a recorder that fails leaves the microphone off`, (await live(page)) === 0, `${await live(page)} live`);

    // 3. Leaving mid-recording turns the microphone off.
    await page.evaluate(() => { window.__breakRecorder = false; window.__streams = []; });
    await recordButton(page).click();
    const recording = await page.getByRole("button", { name: "停錄音" }).waitFor({ timeout: 5000 }).then(() => true, () => false);
    if (recording) {
      await page.getByRole("link", { name: "關閉" }).click();
      await page.getByRole("heading", { name: "學習路徑" }).waitFor();
      await page.waitForTimeout(300);
      check(`${tag} leaving mid-recording turns the microphone off`, (await live(page)) === 0, `${await live(page)} live`);
    } else {
      console.log(`note ${tag}: no MediaRecorder in this browser; skipped the mid-recording check`);
    }
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
  console.error(`mic e2e: ${failures} failed`);
  process.exit(1);
}
console.log("mic e2e ok");
