import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { CAPTION, mouthsFor } from "../web/src/mouths.mjs";

const root = path.resolve(import.meta.dirname, "..");

function phonemes(ipa) {
  const symbols = ["tʃ", "dʒ", "eɪ", "aɪ", "ɔɪ", "oʊ", "aʊ", "ɝ", "ɚ", "θ", "ð", "ʃ", "ʒ", "ŋ", "æ", "ɑ", "ɔ", "ʌ", "ə", "ɛ", "ɪ", "ʊ", "i", "u", "p", "b", "t", "d", "k", "ɡ", "g", "f", "v", "s", "z", "h", "m", "n", "l", "ɹ", "w", "j"];
  const body = String(ipa).replace(/[\/.ˈˌ\s]/g, "");
  const out = [];
  let i = 0;
  while (i < body.length) {
    const hit = symbols.find((symbol) => body.startsWith(symbol, i));
    assert.ok(hit, `${ipa} at ${body.slice(i)}`);
    out.push(hit === "ɡ" ? "g" : hit);
    i += hit.length;
  }
  return out;
}

test("every lesson focus sound has a mouth that is not a /θ/ fallback", () => {
  const lessons = fs.readdirSync(path.join(root, "content/lessons")).filter((name) => name.endsWith(".json"));
  for (const name of lessons) {
    const lesson = JSON.parse(fs.readFileSync(path.join(root, "content/lessons", name), "utf8"));
    const ipa = lesson.sound.ipa;
    const kinds = mouthsFor(ipa);
    assert.ok(kinds.length > 0, `${lesson.id} ${ipa}`);
    for (const kind of kinds) assert.ok(CAPTION[kind] && !CAPTION[kind].includes("undefined"), `${lesson.id} ${kind}`);
    if (!ipa.includes("θ")) assert.equal(kinds.includes("theta"), false, `${lesson.id} ${ipa} ${kinds.join(",")}`);
  }
  assert.deepEqual(mouthsFor("/ɪ/"), ["short"]);
  assert.deepEqual(mouthsFor("/ɪ/ · /i/"), ["short", "long"]);
  assert.deepEqual(mouthsFor("/i/"), ["long"]);
  assert.deepEqual(mouthsFor("/eɪ/"), ["ey"]);
  assert.deepEqual(mouthsFor("/aɪ/"), ["ay"]);
  assert.deepEqual(mouthsFor("/æ/"), ["ae"]);
  assert.deepEqual(mouthsFor("/ɝ/"), ["er"]);
  assert.deepEqual(mouthsFor("/l/"), ["l"]);
  assert.deepEqual(mouthsFor("/θ/"), ["theta"]);
  assert.deepEqual(mouthsFor("/ʃ/"), ["sh"]);
  assert.deepEqual(mouthsFor("/ʃ/ · /tʃ/"), ["sh", "affricate"]);
  assert.deepEqual(mouthsFor("/w/ · /v/"), ["w", "v"]);
  assert.deepEqual(mouthsFor("尾音"), ["coda"]);
  assert.equal(CAPTION.coda.includes("/θ/"), false);
  assert.equal(mouthsFor("/ɹ/").includes("theta"), false);
});

test("rebuilt B2 sounds sit in the key word and the pairs differ by one phoneme", () => {
  const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  const focus = {
    T20: ["screening-noun", "i"],
    J23: ["valuation-noun", "eɪ"],
    R17: ["banquet-noun", "æ"],
    W14: ["forecast-noun", "æ"],
    W15: ["reimbursement-noun", "ɝ"],
    J24: ["hallmark-noun", "l"],
    T21: ["declaration-noun", "eɪ"],
  };
  for (const [lessonId, [keyId, symbol]] of Object.entries(focus)) {
    const lesson = JSON.parse(fs.readFileSync(path.join(root, "content/lessons", `${lessonId.toLowerCase()}.json`), "utf8"));
    const key = byId[keyId].ipa;
    assert.ok(phonemes(key).includes(symbol), `${lessonId} ${key}`);
    assert.equal(lesson.sound.ipa, `/${symbol}/`);
    assert.ok(lesson.sound.pairs.length >= 1, lessonId);
    for (const pair of lesson.sound.pairs) {
      const left = phonemes(byId[pair.a].ipa);
      const right = phonemes(byId[pair.b].ipa);
      assert.equal(left.length, right.length, `${lessonId} ${pair.a}/${pair.b}`);
      const diff = left.filter((phone, index) => phone !== right[index]);
      assert.equal(diff.length, 1, `${lessonId} ${pair.a} ${left.join(" ")} / ${pair.b} ${right.join(" ")}`);
      assert.ok(left.includes(symbol) || right.includes(symbol), `${lessonId} ${symbol}`);
    }
  }
});
