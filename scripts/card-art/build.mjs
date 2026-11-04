// Builds the 每日抽卡 card pictures: assets/art/cards/<id>.svg and content/card-art.json.
// scripts/card-art/map.txt picks one glyph per card (reviewed by hand):
//   t:<name>  Tabler Icons 3.31.0 outline (MIT, devDependency @tabler/icons)
//   d:<name>  drawn for this app (scripts/card-art/drawn.json)
// Each picture is the glyph in ink on a Bright Cartoon v1 badge, coloured by the track
// the card is first taught in (metals get their own colour so gold, silver and
// platinum read apart). No text in the pictures.
//
//   node scripts/card-art/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const tablerDir = path.join(root, "node_modules/@tabler/icons/icons/outline");
const outDir = path.join(root, "assets/art/cards");

const map = Object.fromEntries(
  read("scripts/card-art/map.txt")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.trim().split(/\s+/)),
);
const drawn = JSON.parse(read("scripts/card-art/drawn.json")).glyphs;
const lex = JSON.parse(read("content/lexicon.json")).items.filter((item) => !item.hidden);
const shipped = JSON.parse(read("web/src/data.ts").match(/export const SHIPPED = (\[[^\]]*\])/)[1]);

const firstTrack = {};
for (const id of shipped) {
  for (const lemma of JSON.parse(read(`content/lessons/${id.toLowerCase()}.json`)).lemmas) firstTrack[lemma] ??= id[0];
}

// [wash, ring] from the ART-STYLE.md palette.
const TRACK = {
  F: ["#D8F0EC", "#1F9E8F"],
  J: ["#FCEFC4", "#E0A820"],
  R: ["#FFE3D9", "#FF7A59"],
  T: ["#DCEFFA", "#7EC8E3"],
  D: ["#E6F7EA", "#2F9E44"],
  W: ["#F3E6D4", "#B9976B"],
};
const METAL = {
  "gold-noun": ["#FCEFC4", "#E0A820"],
  "yellow-gold-phrase": ["#FCEFC4", "#E0A820"],
  "silver-noun": ["#E8EEF4", "#8FA3B8"],
  "platinum-noun": ["#ECEDEF", "#9AA3AD"],
  "white-gold-phrase": ["#F4F2EA", "#B9B29C"],
  "rose-gold-phrase": ["#FBDAD3", "#E79A8A"],
};

function glyph(ref) {
  const [kind, name] = ref.split(":");
  if (kind === "d") {
    if (!drawn[name]) throw new Error(`no drawn glyph ${name}`);
    return drawn[name];
  }
  if (kind !== "t") throw new Error(`bad glyph ${ref}`);
  const svg = fs.readFileSync(path.join(tablerDir, `${name}.svg`), "utf8");
  return [...svg.matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\b[^>]*\/>/g)]
    .map((m) => m[0])
    .filter((el) => !el.includes('stroke="none"'))
    .map((el) => el.replace(/\s+/g, " ").replace(" />", "/>"))
    .join("");
}

function picture(id, ref) {
  const [wash, ring] = METAL[id] || TRACK[firstTrack[id] || "F"];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">` +
    `<circle cx="60" cy="62" r="50" fill="${wash}"/>` +
    `<circle cx="60" cy="62" r="50" fill="none" stroke="${ring}" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round" opacity=".55"/>` +
    `<path d="M98 22l2 5l5 2l-5 2l-2 5l-2-5l-5-2l5-2z" fill="#F5C84C"/>` +
    `<g transform="translate(24 26) scale(3)" fill="none" stroke="#1F2A37" color="#1F2A37" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${glyph(ref)}</g>` +
    `</svg>\n`
  );
}

const missing = lex.filter((item) => !map[item.id] && !["jewelry-noun", "elevator-noun"].includes(item.id)).map((item) => item.id);
if (missing.length) throw new Error(`no picture chosen for: ${missing.join(", ")}`);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const cards = {};
for (const [id, ref] of Object.entries(map).sort(([a], [b]) => a.localeCompare(b))) {
  const rel = `assets/art/cards/${id}.svg`;
  fs.writeFileSync(path.join(root, rel), picture(id, ref));
  cards[id] = rel;
}
const manifest = JSON.parse(read("content/card-art.json"));
manifest.note =
  "每日抽卡 card pictures, keyed by lexicon id. Built by scripts/card-art/build.mjs from scripts/card-art/map.txt (Tabler Icons, MIT, and glyphs drawn for this app). A card missing here shows a placeholder badge. tests/card-art.mjs checks each entry names a visible card and an existing file.";
manifest.cards = cards;
fs.writeFileSync(path.join(root, "content/card-art.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`card pictures: ${Object.keys(cards).length}`);
