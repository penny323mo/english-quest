// Exercise the built worker with two small release manifests. Both serve the
// same audio URL with different bytes and different fingerprinted boot scripts.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, webkit } from "playwright";

const builtWorker = readFileSync(new URL("../dist/sw.js", import.meta.url), "utf8");
const manifest = /\[\{"integrity":"sha256-[^"]+"[^\]]+\}\]/;
assert.ok(manifest.test(builtWorker));
let version, failAudio, failures, disconnected;
const audio = "assets/audio/clip.mp3";
const example = "assets/audio/example.mp3";
const server = createServer((req, res) => {
  if (disconnected) {
    // An old, fingerprinted entry can be stuck on a half-open network request.
    if (version === 2 && req.url.endsWith("index-00000001.js")) return;
    req.socket.destroy();
    return;
  }
  const url = new URL(req.url, "http://localhost").pathname;
  const app = "assets/index-0000000" + version + ".js";
  res.setHeader("cache-control", "no-store");
  if (url.endsWith("/sw.js")) {
    res.setHeader("content-type", "text/javascript");
    // Reproduce an empty shell lookup during activation while the previous
    // complete pack is still stored. The next lookup can see the page again.
    const missDuringActivation = version === 2 ? `
      const originalMatch = Cache.prototype.match;
      let firstShellLookup = true;
      Cache.prototype.match = function(key, ...options) {
        if (firstShellLookup && key === self.registration.scope) {
          firstShellLookup = false;
          return Promise.resolve(undefined);
        }
        return originalMatch.call(this, key, ...options);
      };` : "";
    const probeQuota = "const put = Cache.prototype.put; Cache.prototype.put = function(key,r){if(String(key).includes('clip.mp3') && self.eqQuota){self.eqQuota=false;throw new DOMException('quota','QuotaExceededError');}return put.call(this,key,r);};self.addEventListener('message',e=>{if(e.data?.type==='test-quota'){self.eqQuota=true;e.ports[0].postMessage('armed');}});";
    return res.end(missDuringActivation + probeQuota + builtWorker.replace(manifest, JSON.stringify([{ revision: null, url: app }, {revision: String(version), url: example, integrity:"sha256-" + createHash("sha256").update("example " + version).digest("base64")}, {revision: String(version), url: audio, integrity:"sha256-" + createHash("sha256").update("clip " + version).digest("base64")}])));
  }
  if (url.endsWith("/" + app)) {
    res.setHeader("content-type", "text/javascript");
    return res.end("document.body.dataset.version='" + version + "'");
  }
  if (url.endsWith(example)) return res.end("example " + version);
  if (url.endsWith(audio)) {
    if (failAudio === "html") return res.writeHead(200, {"content-type":"text/html"}).end("<html>Missing file</html>");
    if (failAudio) { failures++; return res.writeHead(503).end(); }
    return res.end("clip " + version);
  }
  if (url === "/english-quest/") {
    res.setHeader("content-type", "text/html");
    return res.end('<body><script type="module" src="/english-quest/' + app + '"></script></body>');
  }
  res.writeHead(404).end();
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const origin = "http://127.0.0.1:" + server.address().port + "/english-quest/";
try {
  for (const engine of [chromium, webkit]) {
    version = 1; failAudio = false; failures = 0; disconnected = false;
    const profile = mkdtempSync(path.join(tmpdir(), "eq-pack-update-"));
    const context = await engine.launchPersistentContext(profile);
    try {
      const p = await context.newPage();
      await p.goto(origin);
      await p.evaluate(async () => { await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready; });
      async function pack(type = "eq-pack-status") {
        return p.evaluate(type => new Promise((resolve, reject) => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => reject(new Error("No pack status reply")), 3000);
          channel.port1.onmessage = ({ data }) => { clearTimeout(timer); channel.port1.close(); resolve(data); };
          navigator.serviceWorker.controller.postMessage({ type }, [channel.port2]);
        }), type);
      }
      async function expectState(state) {
        let status;
        for (let attempt = 0; attempt < 50; attempt++) {
          status = await pack();
          if (status.state === state) return status;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.fail(JSON.stringify(status));
      }
      const offline = async (v) => {
        disconnected = true;
        await p.reload({waitUntil:"domcontentloaded"});
        try {
          await p.waitForFunction(v => document.body.dataset.version === String(v), v, { timeout: 5000 });
        } catch (error) {
          const details = await p.evaluate(async () => {
            const saved = await (await caches.open("eq-shell-v1")).match(location.href);
            return { page: document.body.innerHTML, saved: await saved?.text(), caches: await caches.keys(),
              controller: navigator.serviceWorker.controller?.scriptURL };
          });
          throw new Error(engine.name() + " offline version " + v + ": " + JSON.stringify(details), { cause: error });
        }
        assert.equal(await p.evaluate(async url => (await fetch(url)).text(), audio), "clip " + v);
        assert.equal(await p.evaluate(async url => (await fetch(url)).text(), example), "example " + v);
      };
      const cached = (v) => p.evaluate(async ({audio,v}) => {
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
          for (const name of await caches.keys()) {
            const cache = await caches.open(name);
            if (await cache.match(audio + "?__WB_REVISION__=" + v)) return;
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        throw new Error("Audio revision missing: " + v);
      }, {audio,v});
      await cached(1);
      assert.equal((await expectState("ready")).completed, 3);
      await offline(1);
      disconnected = false;
      version = 2; failAudio = true;
      await p.evaluate(async () => {
        const change = new Promise(r => navigator.serviceWorker.addEventListener("controllerchange",r,{once:true}));
        await (await navigator.serviceWorker.ready).update();
        await change;
      });
      const deadline = Date.now()+8000;
      while (!failures && Date.now()<deadline) await new Promise(r=>setTimeout(r,50));
      assert.ok(failures, "the new pack encountered the simulated interruption");
      assert.equal((await expectState("failed")).completed, 2);
      await offline(1);
      failAudio = "html"; disconnected = false;
      await pack("eq-pack-retry");
      await expectState("failed");
      failAudio = false;
      await pack("test-quota");
      await pack("eq-pack-retry");
      assert.equal((await expectState("failed")).reason,"quota");
      await pack("eq-pack-retry");
      await expectState("ready");
      await cached(2);
      await p.goto(origin);
      await offline(2);
      console.log(engine.name(), "old and new boot script and audio verified offline after recovery, including a staged replacement recording");
      await p.evaluate(async () => {
        for (const name of await caches.keys()) await caches.delete(name);
      });
      await p.reload({ waitUntil: "domcontentloaded" });
      const retry = p.getByRole("button", { name: "重新連線後再試" });
      await retry.waitFor();
      disconnected = false;
      await retry.click();
      await p.waitForFunction(() => document.body.dataset.version === "2");
      await expectState("ready");
      await offline(2);
      console.log(engine.name(), "cleared storage displayed recovery, reconnected and rebuilt the offline course");
    } finally {
      await context.close();
      rmSync(profile, { recursive: true, force: true });
    }
  }
} finally { server.closeAllConnections(); server.close(); }
