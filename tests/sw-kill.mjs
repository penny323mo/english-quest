import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the service worker kill-switch does not clear site storage", () => {
  const files = ["web/index.html", "web/src/sw.ts", "web/src/main.tsx"];
  const banned = ["localStorage.clear", "sessionStorage.clear", "indexedDB.deleteDatabase", "Clear-Site-Data"];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    for (const token of banned) assert.equal(text.includes(token), false, `${file} ${token}`);
  }
});
