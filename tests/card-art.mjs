// 每日抽卡 card pictures. scripts/card-art/build.mjs draws one per card from
// scripts/card-art/map.txt (Tabler Icons, MIT, and glyphs drawn for this app).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { NOT_DRAWN } from "../web/src/daily.mjs";

const root = path.resolve(import.meta.dirname, "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const art = read("content/card-art.json").cards;
const visible = read("content/lexicon.json").items.filter((item) => !item.hidden);
const map = Object.fromEntries(
  fs
    .readFileSync(path.join(root, "scripts/card-art/map.txt"), "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.trim().split(/\s+/)),
);

test("every card that can be drawn has a picture, chosen in map.txt", () => {
  const drawable = visible.filter((item) => !NOT_DRAWN.has(item.id)).map((item) => item.id).sort();
  assert.deepEqual(Object.keys(art).sort(), drawable);
  assert.deepEqual(Object.keys(map).sort(), drawable);
  for (const ref of Object.values(map)) assert.match(ref, /^(t|d):[a-z0-9-]+$/, ref);
  assert.equal(Object.values(map).some((ref) => ref.startsWith("t:brand-")), false, "no brand marks");
});

test("each picture is a small tracked SVG with no text in it", () => {
  const listed = new Set(execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean));
  for (const [id, rel] of Object.entries(art)) {
    assert.equal(rel, `assets/art/cards/${id}.svg`);
    assert.ok(listed.has(rel), `${rel} is not tracked`);
    const svg = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(svg.length < 4096, `${rel} is ${svg.length} bytes`);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 120 120"/);
    assert.doesNotMatch(svg, /<text|<image|<script|href=/, rel);
  }
});

test("the pictures match what build.mjs makes from map.txt", () => {
  const drawn = read("scripts/card-art/drawn.json").glyphs;
  for (const [id, ref] of Object.entries(map)) {
    const svg = fs.readFileSync(path.join(root, art[id]), "utf8");
    if (ref.startsWith("d:")) assert.ok(svg.includes(drawn[ref.slice(2)]), `${id} is not the drawn ${ref}`);
  }
  assert.ok(fs.existsSync(path.join(root, "scripts/card-art/TABLER-LICENSE")));
});

test("the card shows its picture, or a placeholder when none is listed", () => {
  const src = fs.readFileSync(path.join(root, "web/src/Daily.tsx"), "utf8");
  assert.match(src, /const src = cardArt\[item\.id\];/);
  assert.match(src, /data-placeholder="true"/);
});
