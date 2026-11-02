import { execSync } from "node:child_process";
import fs from "node:fs";

const seed = 1506;
const base = "6104290";

function mulberry32(start) {
  let state = start;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

function bandOf(cefr) {
  if (cefr === "A1" || cefr === "A1/A2") return "A1";
  if (cefr === "A2" || cefr === "A2/B1") return "A2";
  if (cefr === "B1" || cefr === "B1/B2") return "B1";
  return "B2";
}

const pathFile = JSON.parse(fs.readFileSync("content/path.json", "utf8"));
const cefr = Object.fromEntries(pathFile.units.flatMap((unit) => unit.lessons).map((entry) => [entry.id, entry.cefr]));
const shipped = JSON.parse(fs.readFileSync("tests/lessons.mjs", "utf8").match(/const shipped = (\[[\s\S]*?\]);/)[1]);
const changed = [];
for (const id of shipped) {
  const current = JSON.parse(fs.readFileSync(`content/lessons/${id}.json`, "utf8"));
  const previous = JSON.parse(execSync(`git show ${base}:content/lessons/${id}.json`, { maxBuffer: 4 * 1024 * 1024 }).toString());
  const previousBy = Object.fromEntries(previous.dialogue.map((line) => [line.id, line.text]));
  for (const line of current.dialogue) {
    if (previousBy[line.id] && previousBy[line.id] !== line.text) {
      changed.push({ id: line.id, band: bandOf(cefr[current.id]), cefr: cefr[current.id], before: previousBy[line.id], after: line.text });
    }
  }
}
const groups = { A1: [], A2: [], B1: [], B2: [] };
for (const row of changed) groups[row.band].push(row);
const random = mulberry32(seed);
const picked = [];
for (const band of ["A1", "B1", "B2"]) picked.push(...groups[band]);
const remaining = 30 - picked.length;
picked.push(...shuffle(groups.A2, random).slice(0, remaining));
picked.sort((a, b) => a.id.localeCompare(b.id));

const lines = [];
lines.push("# Stage 3 random sample");
lines.push("");
lines.push("Thirty dialogue lines that still differ from main `6104290`, drawn by `review/stage3/sample30.mjs`.");
lines.push("");
lines.push(`Seed: \`${seed}\`. Generator: mulberry32. Bands are folded so A1 includes A1/A2, A2 includes A2/B1, and B1 includes B1/B2.`);
lines.push("Every A1, B1, and B2 change is included because those pools are smaller than a 30-way split. The A2 rows are the first 13 of a seeded shuffle. Nothing in the list was chosen by hand.");
lines.push("");
let band = "";
for (const row of picked) {
  if (row.band !== band) {
    band = row.band;
    lines.push(`## ${band}`);
    lines.push("");
  }
  lines.push(`**${row.id}** (${row.cefr})`);
  lines.push("");
  lines.push(`- Before: ${row.before}`);
  lines.push(`- After: ${row.after}`);
  lines.push("");
}
fs.writeFileSync("review/stage3/random30.md", `${lines.join("\n")}`);
console.log(picked.map((row) => `${row.band} ${row.id}`).join("\n"));
console.log("count", picked.length);
