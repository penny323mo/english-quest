import fs from "node:fs";

const seed = Number(process.argv[2] || 20261102);
const outPath = process.argv[3] || "review/stage5/gloss-pairs30.md";

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

const lessons = fs.readdirSync("content/lessons")
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(fs.readFileSync(`content/lessons/${name}`, "utf8")));
const rows = [];
for (const lesson of lessons) {
  for (const line of lesson.dialogue) {
    rows.push({ id: line.id, lesson: lesson.id, en: line.text, yue: line.glossYue });
  }
}
const picked = shuffle(rows, mulberry32(seed)).slice(0, 30);
const body = [
  "# 30 gloss / English pairs",
  "",
  `Seed **${seed}**. Generator: \`review/stage5/sample-gloss.mjs\` (mulberry32 shuffle of every dialogue line, first 30).`,
  "",
  ...picked.map((row, index) => [
    `## ${index + 1}. ${row.id} (${row.lesson})`,
    "",
    row.en,
    "",
    row.yue,
    "",
  ].join("\n")),
].join("\n");
fs.writeFileSync(outPath, body);
console.log("wrote", outPath, picked.length, "seed", seed);
