// 每日抽卡 picture slot. content/card-art.json maps a card id to its picture; it starts
// empty (each card shows a placeholder badge) and the art team fills it in later.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

test("each card picture names a visible card and a tracked file", () => {
  const art = read("content/card-art.json");
  const visible = new Set(read("content/lexicon.json").items.filter((item) => !item.hidden).map((item) => item.id));
  const listed = new Set(execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean));
  assert.equal(typeof art.cards, "object");
  for (const [id, rel] of Object.entries(art.cards)) {
    assert.ok(visible.has(id), `${id} is not a visible card`);
    assert.match(rel, /^assets\/art\/cards\/[a-z0-9-]+\.(webp|svg)$/, id);
    assert.ok(fs.existsSync(path.join(root, rel)) && listed.has(rel), `${rel} missing or untracked`);
    assert.ok(fs.statSync(path.join(root, rel)).size < 120 * 1024, `${rel} over 120 KB`);
  }
});

test("the card shows a placeholder when no picture is listed", () => {
  const src = fs.readFileSync(path.join(root, "web/src/Daily.tsx"), "utf8");
  assert.match(src, /const src = cardArt\[item\.id\];/);
  assert.match(src, /data-placeholder="true"/);
});
