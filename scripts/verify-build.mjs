import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sourceHash } from "./source-hash.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const failures = [];

function fail(message) {
  failures.push(message);
}

const htmlPath = path.join(dist, "index.html");
if (!fs.existsSync(htmlPath)) fail("dist/index.html missing — build from source first");
else {
  const html = fs.readFileSync(htmlPath, "utf8");
  const hash = sourceHash();
  if (!html.includes(`content="${hash}"`)) {
    fail("dist/index.html source stamp does not match the current source and content");
  }
  if (!html.includes("eq-sw-kill-v1")) fail("dist/index.html is missing the service worker kill-switch");
  if (!html.includes('content="only light"')) fail("dist/index.html does not force light color-scheme");
}

const swPath = path.join(dist, "sw.js");
if (!fs.existsSync(swPath)) fail("dist/sw.js missing");
else {
  const sw = fs.readFileSync(swPath, "utf8");
  const shell = /(?:^|\/)(?:index\.html|sw\.js|registerSW\.js|manifest\.webmanifest|workbox-[^/]+\.js)$/;
  if (!sw.includes("index\\.html")) fail("built worker does not exclude index.html");
  const entries = [...sw.matchAll(/\{"revision":(null|"[0-9a-f]+"),"url":"([^"]+)"\}/g)].map((entry) => ({
    revision: entry[1],
    url: entry[2],
  }));
  const kept = entries.filter((entry) => !shell.test(entry.url));
  if (kept.length < 400) fail(`precache entries ${kept.length}`);
  for (const banned of ["index.html", "sw.js", "registerSW.js", "manifest.webmanifest"]) {
    if (kept.some((entry) => entry.url === banned || entry.url.endsWith(`/${banned}`))) {
      fail(`service worker precaches ${banned}`);
    }
  }
  const vowel = kept.find((entry) => entry.url === "assets/audio/words/the-art-vowel.mp3");
  if (!vowel) fail("the-art-vowel.mp3 missing from precache");
  else if (!/^"[0-9a-f]{32}"$/.test(vowel.revision)) fail(`the-art-vowel revision ${vowel.revision}`);
  for (const entry of kept) {
    if ((entry.url.endsWith(".mp3") || entry.url.endsWith(".webp")) && entry.revision === "null") {
      fail(`${entry.url} has a null revision`);
    }
  }
  const hashedJs = kept.filter((entry) => /assets\/index-[A-Za-z0-9_-]{8}\.js$/.test(entry.url));
  if (hashedJs.length !== 1 || hashedJs[0].revision !== "null") fail("hashed app script revision");
}

const assetDir = path.join(dist, "assets");
const jsFiles = fs.existsSync(assetDir)
  ? fs.readdirSync(assetDir).filter((name) => name.endsWith(".js"))
  : [];
const js = jsFiles.map((name) => fs.readFileSync(path.join(assetDir, name), "utf8")).join("\n");
if (!js.includes("updateViaCache")) fail("built app does not register the worker with updateViaCache");
if (!js.includes("controllerchange")) fail("built app does not reload on controllerchange");

const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
let lexiconCount = 0;
for (const item of lex.items) lexiconCount += JSON.stringify(item).split("Staff logged this").length - 1;
const jsCount = js.split("Staff logged this").length - 1;
console.log(`Staff logged this: lexicon ${lexiconCount}, built JS ${jsCount}`);
if (jsCount !== lexiconCount) fail(`built JS has ${jsCount} Staff logged this lines, lexicon has ${lexiconCount}`);

const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
const bannedTracked = tracked.filter((file) =>
  file === "index.html"
  || file === "sw.js"
  || file === "registerSW.js"
  || file === "manifest.webmanifest"
  || file.startsWith("workbox-")
  || /^assets\/[^/]+\.(js|css)$/.test(file),
);
if (bannedTracked.length) fail(`committed publish-root build output: ${bannedTracked.join(", ")}`);

if (failures.length) {
  for (const message of failures) console.error(message);
  process.exit(1);
}
console.log("build matches current source and content");
