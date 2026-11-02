import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the service worker kill-switch does not clear site storage", () => {
  const files = [
    "web/index.html",
    "web/src/sw.ts",
    "web/src/main.tsx",
    "public/workbox-835c8c05.js",
    "public/workbox-9c191d2f.js",
    "public/registerSW.js",
  ];
  const banned = ["localStorage.clear", "sessionStorage.clear", "indexedDB.deleteDatabase", "Clear-Site-Data"];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    for (const token of banned) assert.equal(text.includes(token), false, `${file} ${token}`);
    if (file.startsWith("public/")) {
      assert.equal(text.includes("caches.delete"), true, `${file} clears Cache Storage`);
      assert.equal(text.includes("unregister"), true, `${file} unregisters`);
    }
  }
});

test("bundled sources do not keep the dark-shell labels", () => {
  const banned = ["路線", "詞庫", "未開"];
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(tsx|ts|css|html|json)$/.test(name)) files.push(full);
    }
  }
  walk(path.join(root, "web/src"));
  walk(path.join(root, "content"));
  files.push(path.join(root, "web/index.html"));
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const token of banned) {
      assert.equal(text.includes(token), false, `${path.relative(root, file)} contains ${token}`);
    }
  }
});
