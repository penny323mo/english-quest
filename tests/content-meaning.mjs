// Guards for the meaning, answer-key and fact errors found in review/content-audit.md.
// Each test names the class of bug it stops from coming back.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const lessons = fs.readdirSync(path.join(root, "content/lessons"))
  .filter((name) => name.endsWith(".json"))
  .map((name) => read(`content/lessons/${name}`));
const lex = read("content/lexicon.json");
const lines = read("content/lines.json");
const senseLabels = read("content/sense-labels.json");
const byLemma = new Map();
for (const item of lex.items) {
  const key = item.lemma.toLowerCase();
  if (!byLemma.has(key)) byLemma.set(key, []);
  byLemma.get(key).push(item);
}

function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, out);
  else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) if (key !== "glossZh") strings(v, out);
  }
  return out;
}

const everything = [
  ...lessons.map((lesson) => [lesson.id, strings(lesson)]),
  ...lex.items.map((item) => [item.id, strings(item)]),
  ["lines.json", strings(lines)],
  ["sense-labels.json", strings(senseLabels)],
  ["path.json", strings(read("content/path.json"))],
];

test("no offensive or wrong-register Cantonese is shown to the learner", () => {
  // 叫雞 = hiring a sex worker; 上鐘 = starting a massage / sex-work session;
  // 高腳櫈 = bar stool (a high chair is 兒童椅 / BB櫈); 夜晚好 is a Mandarin calque.
  const banned = ["叫雞", "上鐘", "高腳櫈", "夜晚好"];
  const hits = [];
  for (const [id, texts] of everything) {
    for (const text of texts) for (const word of banned) if (text.includes(word)) hits.push(`${id}: ${word} in ${text}`);
  }
  assert.deepEqual(hits, []);
});

test("Hong Kong and Macau jewellery lessons do not invent sales tax or tourist refunds", () => {
  const taxEn = /\b(tax[- ]free|tax refund|refund form|sales tax|VAT|tax back|claim the tax|tax is included)\b/i;
  const taxYue = /退稅|免稅|申返稅|稅包/;
  const hits = [];
  for (const lesson of lessons.filter((row) => row.unit === "J")) {
    for (const text of strings(lesson)) if (taxEn.test(text) || taxYue.test(text)) hits.push(`${lesson.id}: ${text}`);
  }
  assert.deepEqual(hits, []);
});

test("refund forms are stamped by customs, never by a shop", () => {
  const hits = [];
  for (const [id, texts] of everything) {
    for (const text of texts) {
      if (/\b(shop|store)\b[^.?!]*\bstamp\b[^.?!]*\bform\b/i.test(text)) hits.push(`${id}: ${text}`);
      if (/(店|舖)[^。？！]*蓋[^。？！]*(退稅|表)/u.test(text)) hits.push(`${id}: ${text}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("pearl care says perfume first, pearls last", () => {
  const hits = [];
  for (const [id, texts] of everything) {
    for (const text of texts) {
      if (/wipe[^.?!]*pearl[^.?!]*then[^.?!]*perfume/i.test(text)) hits.push(`${id}: ${text}`);
      if (/先抹[^。？！]*珍珠[^。？！]*再搽香水/u.test(text)) hits.push(`${id}: ${text}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("arrival order is immigration, then the baggage carousel, then customs", () => {
  const hits = [];
  for (const [id, texts] of everything) {
    for (const text of texts) {
      for (const sentence of text.split(/(?<=[.?!])\s+/)) {
        const imm = sentence.search(/immigration|passport control/i);
        const car = sentence.search(/carousel/i);
        const cus = sentence.search(/customs/i);
        if (imm >= 0 && car >= 0 && !/^after\b/i.test(sentence) && !/\bafter (immigration|passport control)\b/i.test(sentence) && imm > car) {
          hits.push(`${id}: ${sentence}`);
        }
        if (/immigration[^.?!]*past[^.?!]*carousel|carousel[^.?!]*immigration sits/i.test(sentence)) hits.push(`${id}: ${sentence}`);
        if (car >= 0 && cus >= 0 && cus < car && !/\bafter\b/i.test(sentence)) hits.push(`${id}: ${sentence}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});

test("a double room is one big bed, and prawns are not 貝殼類", () => {
  const hits = [];
  for (const lesson of lessons) {
    for (const item of [...lesson.quiz, ...lesson.understand]) {
      if (!/\ba double\b/i.test(item.prompt || "")) continue;
      const key = item.choices[item.answer];
      if (/雙床|兩張床/u.test(key)) hits.push(`${lesson.id}: ${item.prompt} -> ${key}`);
    }
  }
  for (const [id, texts] of everything) {
    for (const text of texts) if (/貝殼類/u.test(text)) hits.push(`${id}: ${text}`);
  }
  assert.deepEqual(hits, []);
});

test("understand items offer real meanings, not rotating topic labels", () => {
  const hits = [];
  for (const lesson of lessons) {
    for (const item of lesson.understand) {
      if (item.choices.every((choice) => /^(關於|講緊|唔係)/u.test(choice))) hits.push(`${lesson.id}: ${item.prompt}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("build choices give a situation, so only one line is right", () => {
  const hits = [];
  for (const lesson of lessons) {
    for (const item of lesson.build) {
      if (item.type === "choice" && /你想用呢課嘅講法/u.test(item.promptYue)) hits.push(lesson.id);
    }
  }
  assert.deepEqual(hits, []);
});

test("roleplay keywords are words in the expected reply", () => {
  const hits = [];
  for (const lesson of lessons) {
    for (const [index, turn] of lesson.roleplay.turns.entries()) {
      const expect = turn.expect.toLowerCase();
      for (const word of turn.keywords) if (!expect.includes(word.toLowerCase())) hits.push(`${lesson.id} turn ${index}: ${word}`);
    }
  }
  assert.deepEqual(hits, []);
});

// Split IPA into phonemes so /aɪ/ does not count as /ɪ/ and /tʃ/ does not count as /ʃ/.
const MULTI = ["tʃ", "dʒ", "aɪ", "aʊ", "eɪ", "oʊ", "ɔɪ"];
function phonemes(ipa) {
  const s = ipa.replace(/[\/ˈˌ.\s]/gu, "");
  const out = [];
  for (let i = 0; i < s.length;) {
    const two = s.slice(i, i + 2);
    if (MULTI.includes(two)) { out.push(two); i += 2; } else { out.push(s[i]); i += 1; }
  }
  return out;
}

test("'which word has /x/' items have exactly one right answer", () => {
  const hits = [];
  for (const lesson of lessons) {
    for (const item of lesson.quiz) {
      const m = String(item.prompt || "").match(/\/([^/]+)\//u);
      if (item.type !== "choice" || !m || !/has|有|開頭|尾音/u.test(item.prompt)) continue;
      const target = phonemes(m[1]);
      const seq = (ph, from) => target.every((t, k) => ph[from + k] === t);
      const start = /開頭|start/u.test(item.prompt);
      const end = /尾音|end/u.test(item.prompt);
      const right = [];
      let known = true;
      for (const [index, choice] of item.choices.entries()) {
        const cards = byLemma.get(choice.toLowerCase());
        if (!cards) { known = false; break; }
        const hit = cards.some((card) => {
          const ph = phonemes(card.ipa);
          if (start) return seq(ph, 0);
          if (end) return seq(ph, ph.length - target.length);
          return ph.some((_, i) => seq(ph, i));
        });
        if (hit) right.push(index);
      }
      if (known && (right.length !== 1 || right[0] !== item.answer)) {
        hits.push(`${lesson.id}: ${item.prompt} ${item.choices.join("/")} key ${item.answer} right ${right.join(",")}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});

test("a meaning item that names a word quotes a sentence containing it", () => {
  const hits = [];
  for (const lesson of lessons) {
    for (const item of lesson.quiz) {
      const m = String(item.prompt || "").match(/「([^」]+)」，\s*([A-Za-z][A-Za-z' -]*?) 係咩意思/u);
      if (!m) continue;
      const [, sentence, word] = m;
      if (!sentence.toLowerCase().includes(word.toLowerCase())) hits.push(`${lesson.id}: ${word} not in ${sentence}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("quoted-sentence meaning items: only the key's word is in the sentence", () => {
  const glossToLemma = new Map();
  for (const item of lex.items) {
    if (!glossToLemma.has(item.glossYue)) glossToLemma.set(item.glossYue, []);
    glossToLemma.get(item.glossYue).push(item.lemma.toLowerCase());
  }
  const words = (text) => text.toLowerCase().match(/[a-z']+/g) || [];
  const has = (sentence, lemma) => {
    const w = words(sentence);
    const l = words(lemma);
    return w.some((_, i) => l.every((part, j) => (w[i + j] || "").startsWith(part.slice(0, Math.max(3, part.length - 1)))));
  };
  const hits = [];
  for (const lesson of lessons) {
    for (const item of lesson.quiz) {
      const m = String(item.prompt || "").match(/講「([^」]+)」，係咩意思/u);
      if (item.type !== "meaning" || !m) continue;
      const lemmas = item.choices.map((choice) => glossToLemma.get(choice));
      if (lemmas.some((row) => !row)) continue;
      const right = lemmas.map((row, index) => (row.some((lemma) => has(m[1], lemma)) ? index : -1)).filter((index) => index >= 0);
      if (right.length !== 1 || right[0] !== item.answer) hits.push(`${lesson.id}: ${m[1]} -> ${item.choices.join("/")}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("fill-in explains gloss the answer word, not another word", () => {
  const hits = [];
  for (const lesson of lessons) {
    for (const item of lesson.quiz) {
      if (item.type !== "choice" || !String(item.prompt || "").includes("___") || !item.explain) continue;
      const answer = item.choices[item.answer];
      const glosses = (byLemma.get(answer.toLowerCase()) || []).map((card) => card.glossYue);
      if (!glosses.length) continue;
      const explain = item.explain.replace(/。$/u, "");
      if (!glosses.some((g) => explain === g || explain.includes(g) || g.includes(explain))) {
        hits.push(`${lesson.id}: ${answer} explained as ${item.explain}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});

test("a lesson's listen items test different words", () => {
  const hits = [];
  for (const lesson of lessons) {
    const seen = new Set();
    for (const item of lesson.quiz.filter((row) => row.type === "listen")) {
      if (seen.has(item.lemma)) hits.push(`${lesson.id}: ${item.lemma}`);
      seen.add(item.lemma);
    }
  }
  assert.deepEqual(hits, []);
});

test("listen prompts describe the word that is played", () => {
  // The audit found 租嚟嗰架車 (rental car) for taxi and 喉嚨嗰陣咳 for cough.
  const hits = [];
  for (const lesson of lessons) {
    for (const item of lesson.quiz.filter((row) => row.type === "listen")) {
      const hint = String(item.prompt).split("：")[1];
      if (!hint) continue;
      if (/租嚟嗰架車|喉嚨嗰陣咳|收細個咪/u.test(hint)) hits.push(`${lesson.id}: ${hint}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("sense labels and card glosses say what the word means", () => {
  const wrong = {
    "noun:restaurant-bill": "餐單", // 餐單 is a menu
    "adj:food-reaction": "對食物",
    "noun:drink-spirit": "酒精", // ethanol, not a drink
  };
  for (const [key, bad] of Object.entries(wrong)) assert.notEqual(senseLabels.sense[key], bad, key);
  const card = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  assert.doesNotMatch(card["check-noun"].glossYue, /餐單/u);
  assert.doesNotMatch(card["alcohol-noun"].glossYue, /酒精/u);
  assert.doesNotMatch(card["right-adv"].glossYue, /就係咁/u);
  assert.match(card["high-chair-phrase"].glossYue, /兒童椅/u);
});
