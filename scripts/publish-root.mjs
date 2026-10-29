/**
 * GitHub Pages serves the repo root. Copy the Vite build there without
 * deleting lesson art or audio that already live under assets/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(repo, "dist");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function mergeDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) mergeDir(from, to);
    else if (ent.isFile()) copyFile(from, to);
  }
}

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/index.html missing — run vite build first");
  process.exit(1);
}

const assetRoot = path.join(repo, "assets");
if (fs.existsSync(assetRoot)) {
  for (const name of fs.readdirSync(assetRoot)) {
    if (/\.(js|css|map)$/.test(name)) fs.unlinkSync(path.join(assetRoot, name));
  }
}
for (const name of fs.readdirSync(repo)) {
  if (name === "sw.js" || name === "manifest.webmanifest" || /^(workbox-|registerSW)/.test(name)) {
    fs.unlinkSync(path.join(repo, name));
  }
}

copyFile(path.join(dist, "index.html"), path.join(repo, "index.html"));
const distAssets = path.join(dist, "assets");
if (fs.existsSync(distAssets)) mergeDir(distAssets, assetRoot);
for (const name of fs.readdirSync(dist)) {
  if (name === "assets") continue;
  const from = path.join(dist, name);
  const to = path.join(repo, name);
  const st = fs.lstatSync(from);
  if (st.isDirectory()) mergeDir(from, to);
  else if (st.isFile()) copyFile(from, to);
}
fs.writeFileSync(path.join(repo, ".nojekyll"), "");
console.log("published dist onto repo root");
