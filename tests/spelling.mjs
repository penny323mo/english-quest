// The app teaches British spelling with -ize endings (jewellery, colour, harbour, centre,
// licence, apologize). English text must not slip back to color / harbor / center.
// Cantonese notes may still name the US form ("美式寫 color"), and card ids keep their names.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const US = /\b(colors?|colored|colorful|harbors?|harborfront|centers?|centered)\b/i;
const CJK = /[㐀-鿿]/;
const ID = /^[a-z0-9-]+-(noun|verb|adj|adv|phrase|prep|det|num|intj|pron|art|conj|aux)(-[a-z0-9-]+)?$/;
const SKIP = new Set(["id", "senseId", "cmuLemma", "audio", "audioSlow", "modelAudio", "modelSlow", "hero"]);

function* strings(value, where, key) {
  if (SKIP.has(key)) return;
  if (typeof value === "string") yield [where, value];
  else if (Array.isArray(value)) for (const [i, item] of value.entries()) yield* strings(item, `${where}[${i}]`, key);
  else if (value && typeof value === "object") for (const [k, item] of Object.entries(value)) yield* strings(item, `${where}.${k}`, k);
}

test("English text uses British colour, harbour and centre", () => {
  const sources = [
    ["lexicon", read("content/lexicon.json").items],
    ["lines", read("content/lines.json")],
    ...fs.readdirSync(path.join(root, "content/lessons")).map((name) => [name, read(`content/lessons/${name}`)]),
  ];
  const found = [];
  for (const [file, data] of sources) {
    for (const [where, text] of strings(data, file)) {
      if (CJK.test(text) || ID.test(text)) continue;
      if (US.test(text)) found.push(`${where}: ${text}`);
    }
  }
  assert.deepEqual(found, []);
});
