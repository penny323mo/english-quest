import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith(".json")) out.push(abs);
  }
}

test("content has no hardcoded learner name", () => {
  const files = [];
  walk(path.join(root, "content"), files);
  const hits = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    visit(data, path.relative(root, file), "", hits);
  }
  assert.deepEqual(hits, []);
});

function visit(value, file, key, hits) {
  if (typeof value === "string") {
    // "ling" is the cast id (speaker / roleplay you), not the displayed name.
    if (key === "speaker" || key === "you" || key === "id") return;
    if (value === "ling") return;
    if (value.includes("阿林") || value.includes("阿琳")) hits.push(`${file} ${key}: ${value}`);
    else if (/\bLing\b/.test(value)) hits.push(`${file} ${key}: ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) visit(item, file, key, hits);
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) visit(child, file, childKey, hits);
  }
}
