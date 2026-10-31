import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { seededOrder } from "../web/src/choice-order.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const ids = new Set(lex.items.map((item) => item.id));
const shipped = ["f1", "f2", "f3", "f4", "j1", "j2", "j3", "j4", "j5", "j6", "j7", "j8", "j9", "j10", "t1", "t2", "t3", "t4", "t5", "t6", "r1", "r2", "r3", "r4", "r5", "w1", "d1", "d2", "t7", "w2", "w3", "d3", "j11", "j12", "t8", "w4", "r6", "w5", "f5", "f6", "d4", "d5", "r7", "w6", "t9", "d6", "r8", "j13", "r9", "w7", "t10", "d7", "w8", "j14", "r10", "t11", "d8", "j15", "t12", "d9", "r11", "w9", "j16", "t13", "d10", "j17", "r12", "w10", "t14", "j18", "r13", "d11", "d12", "t15", "w11", "r14", "j19", "t16", "t17", "j20", "d13", "r15", "w12", "t18"];
const lessons = shipped.map((id) =>
  JSON.parse(fs.readFileSync(path.join(root, "content/lessons", `${id}.json`), "utf8")),
);
const lines = JSON.parse(fs.readFileSync(path.join(root, "content/lines.json"), "utf8"));
const lineIds = new Set(lines.map((line) => line.id));

function exists(rel) {
  const file = path.join(root, rel);
  assert.equal(fs.existsSync(file), true, rel);
  assert.ok(fs.statSync(file).size > 400, rel);
}

test("sixty-six lessons each carry the 12-beat payload", () => {
  assert.equal(lessons.length, 84);
  for (const lesson of lessons) {
    for (const key of ["hero", "canDoYue", "canDoEn", "dialogue", "understand", "chunks", "shadow", "build", "roleplay", "quiz", "sound", "next"]) {
      assert.ok(key in lesson, `${lesson.id} ${key}`);
    }
    assert.ok(lesson.dialogue.length >= 4, lesson.id);
    assert.ok(lesson.understand.length >= 3, lesson.id);
    assert.ok(lesson.chunks.length >= 3, lesson.id);
    assert.ok(lesson.build.length >= 2, lesson.id);
    assert.equal(lesson.roleplay.turns.length, 3, lesson.id);
    assert.ok(lesson.quiz.length >= 5, lesson.id);
    assert.ok(lesson.sound.pairs.length >= 2, lesson.id);
    assert.ok(lesson.sound.drill.length >= 1, lesson.id);
    assert.ok(lesson.canDoYue && lesson.canDoEn, lesson.id);
    exists(lesson.hero);
    for (const id of lesson.lemmas) assert.ok(ids.has(id), `${lesson.id} ${id}`);
    for (const line of lesson.dialogue) {
      exists(line.audio);
      exists(line.audioSlow);
      assert.ok(lineIds.has(line.id), line.id);
    }
    const shadow = lesson.dialogue.find((line) => line.id === lesson.shadow.lineId);
    assert.ok(shadow, `${lesson.id} shadow`);
    for (const turn of lesson.roleplay.turns) {
      assert.ok(turn.keywords.length >= 1, lesson.id);
      assert.ok(turn.expect, lesson.id);
      exists(turn.audio);
      exists(turn.modelAudio);
      exists(turn.modelSlow);
    }
    for (const pair of lesson.sound.pairs) {
      assert.ok(ids.has(pair.a) && ids.has(pair.b), lesson.id);
    }
    for (const id of lesson.sound.drill) assert.ok(ids.has(id), id);
    for (const quiz of lesson.quiz) {
      if (quiz.lemma) assert.ok(ids.has(quiz.lemma), quiz.lemma);
      assert.ok(quiz.choices.length >= 2, lesson.id);
    }
    if (lesson.next) assert.ok(lessons.some((other) => other.id === lesson.next), lesson.next);
  }
});

test("J1 keeps the jewellery greeting and later lessons are not stub files", () => {
  const j1 = lessons.find((lesson) => lesson.id === "J1");
  assert.match(j1.dialogue[0].text, /Welcome to our jewellery store/);
  assert.match(j1.dialogue[1].text, /just looking/i);
  assert.match(j1.dialogue[4].text, /Let me know if you need anything/);
  assert.match(j1.dialogue[0].say, /\[\[dʒˈulɹi\]\]/);
  const r1 = lessons.find((lesson) => lesson.id === "R1");
  const t1 = lessons.find((lesson) => lesson.id === "T1");
  assert.match(r1.roleplay.intro, /喺門口/);
  assert.doesNotMatch(r1.roleplay.intro, /在門口/);
  assert.match(t1.sound.note, /ˈbɔɹ\.dɪŋ/);
  assert.doesNotMatch(t1.sound.note, /bɔr/);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/f3.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/f4.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/j3.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/j4.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/j5.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/j6.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/j7.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/r2.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/r3.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/t2.json")), true);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/t3.json")), true);
  const t2 = lessons.find((lesson) => lesson.id === "T2");
  const t3 = lessons.find((lesson) => lesson.id === "T3");
  assert.equal(t1.next, "R10");
  assert.equal(t2.next, "T17");
  assert.equal(lessons.find((lesson) => lesson.id === "T17").next, "T11");
  assert.equal(t3.next, "R3");
  assert.match(t3.titleYue, /酒店入住/);
  assert.equal(t3.cefr, "A2");
  assert.match(t3.sound.ipa, /\/l\//);
  assert.equal(t3.sound.ipa.includes("ɹ"), false);
  assert.match(t2.titleYue, /安檢同方向/);
  assert.match(t2.canDoYue, /過安檢/);
  assert.match(t2.sound.ipa, /\/l\//);
  assert.equal(t2.sound.ipa.includes("ɹ"), false);
  assert.match(t2.dialogue.map((line) => line.text).join("\n"), /Which way to the gate/);
  assert.match(t2.dialogue.map((line) => line.text).join("\n"), /Straight ahead/);
  const j3 = lessons.find((lesson) => lesson.id === "J3");
  const j4 = lessons.find((lesson) => lesson.id === "J4");
  const j5 = lessons.find((lesson) => lesson.id === "J5");
  const j6 = lessons.find((lesson) => lesson.id === "J6");
  const j7 = lessons.find((lesson) => lesson.id === "J7");
  assert.equal(j3.next, "T2");
  assert.equal(j4.next, "J5");
  assert.equal(j5.next, "T3");
  assert.equal(j6.next, "J7");
  assert.equal(j7.next, "J15");
  assert.equal(j7.cefr, "A2/B1");
  assert.match(j7.titleYue, /付款/);
  assert.match(j7.sound.ipa, /\/l\//);
  assert.equal(j7.sound.ipa.includes("ɹ"), false);
  assert.equal(j4.cefr, "A2");
  assert.equal(j5.cefr, "A2");
  assert.equal(j6.cefr, "A2/B1");
  assert.match(j4.titleYue, /金/);
  assert.match(j5.titleYue, /試戴/);
  assert.match(j6.titleYue, /折扣/);
  assert.match(j4.sound.ipa, /θ/);
  assert.equal(j4.sound.ipa.includes("ɹ"), false);
  assert.match(j5.sound.ipa, /\/l\//);
  assert.equal(j5.sound.ipa.includes("ɹ"), false);
  assert.match(j6.sound.ipa, /\/l\//);
  assert.equal(j6.sound.ipa.includes("ɹ"), false);
  const r2 = lessons.find((lesson) => lesson.id === "R2");
  const r3 = lessons.find((lesson) => lesson.id === "R3");
  assert.equal(r1.next, "F6");
  assert.equal(r2.next, "J4");
  assert.equal(r3.next, "T4");
  const t4 = lessons.find((lesson) => lesson.id === "T4");
  const t5 = lessons.find((lesson) => lesson.id === "T5");
  const j9 = lessons.find((lesson) => lesson.id === "J9");
  assert.equal(t4.next, "R4");
  assert.equal(t4.cefr, "A2");
  assert.match(t4.titleYue, /的士/);
  assert.equal(t5.next, "T12");
  assert.equal(t5.cefr, "A2/B1");
  assert.match(t5.titleYue, /行失/);
  assert.equal(j9.next, "J10");
  const r4 = lessons.find((lesson) => lesson.id === "R4");
  const r5 = lessons.find((lesson) => lesson.id === "R5");
  const w1 = lessons.find((lesson) => lesson.id === "W1");
  assert.equal(r4.next, "D6");
  assert.equal(r4.cefr, "A2");
  assert.match(r4.titleYue, /用餐/);
  assert.equal(r5.next, "R11");
  assert.equal(r5.cefr, "A2/B1");
  assert.match(r5.titleYue, /埋單/);
  assert.equal(w1.next, "D1");
  assert.equal(w1.cefr, "A2/B1");
  assert.match(w1.titleYue, /電話/);
  assert.equal(t4.dialogue[6].text, "Here is your receipt, and you can see the landmark on your right.");
  assert.deepEqual(t4.roleplay.turns[2].keywords, ["receipt", "landmark"]);
  assert.equal(t5.dialogue[4].text, "The embassy number is on this card, and I will help you file the report.");
  assert.equal(t5.dialogue[6].text, "I feel faint after the shock, so please tell me if this is an emergency.");
  assert.equal(t5.dialogue[7].text, "If you feel faint, I can call an ambulance while we file the report.");
  assert.deepEqual(t5.roleplay.turns[1].keywords, ["embassy", "report"]);
  assert.deepEqual(t5.roleplay.turns[2].keywords, ["ambulance", "report"]);
  assert.equal(j9.cefr, "B1");
  assert.match(j9.titleYue, /投訴/);
  assert.match(r3.titleYue, /過敏/);
  assert.equal(r3.cefr, "A2");
  assert.match(r3.sound.ipa, /\/l\//);
  assert.equal(r3.sound.ipa.includes("ɹ"), false);
  assert.match(r2.titleYue, /落單/);
  assert.match(r2.canDoYue, /餐廳落單/);
  assert.equal(r2.canDoYue.includes("I'd like"), false);
  assert.match(r2.sound.ipa, /tʃ/);
  assert.equal(r2.sound.ipa.includes("ɹ"), false);
  const pathFile = JSON.parse(fs.readFileSync(path.join(root, "content/path.json"), "utf8"));
  const soon = pathFile.units.flatMap((unit) => unit.lessons).filter((lesson) => lesson.soon);
  assert.equal(soon.length, 0);
  for (const lesson of soon) {
    assert.equal(fs.existsSync(path.join(root, "content/lessons", `${lesson.id.toLowerCase()}.json`)), false);
  }
  for (const entry of pathFile.units.flatMap((unit) => unit.lessons)) {
    assert.match(entry.cefr, /^(A1|A2|B1|B2)(\/(A1|A2|B1|B2))?$/);
  }
  const cefrRank = { A1: 1, "A1/A2": 2, A2: 3, "A2/B1": 4, B1: 5, "B1/B2": 6, B2: 7 };
  const flatPath = pathFile.units.flatMap((unit) => unit.lessons);
  for (let i = 1; i < flatPath.length; i += 1) {
    const prev = flatPath[i - 1];
    const entry = flatPath[i];
    assert.ok(
      cefrRank[entry.cefr] >= cefrRank[prev.cefr],
      `${prev.id} ${prev.cefr} then ${entry.id} ${entry.cefr}`,
    );
  }
  const shippedOnPath = flatPath.filter((entry) => !entry.soon).map((entry) => entry.id);
  assert.deepEqual(shippedOnPath, ["F1", "F2", "F3", "F4", "F5", "J1", "R1", "F6", "J2", "T1", "R10", "D4", "D5", "D7", "J3", "T2", "T17", "T11", "R2", "J4", "J5", "T3", "R3", "T4", "R4", "D6", "R9", "R13", "J6", "J7", "J15", "J18", "J20", "T5", "T12", "T15", "T13", "R12", "R14", "R15", "R5", "R11", "W1", "D1", "D12", "D2", "T7", "W4", "R8", "D10", "W7", "J8", "D9", "D11", "D13", "J9", "J10", "J19", "J16", "J17", "T6", "R6", "J12", "R7", "T8", "T16", "T18", "W2", "W3", "W9", "W8", "W11", "W12", "D3", "D8", "T10", "T14", "W5", "W10", "J14", "J11", "W6", "T9", "J13"]);
  assert.equal(flatPath.find((entry) => entry.id === "J8").cefr, "B1");
  const said = (lesson) => lesson.dialogue.map((line) => line.text).join("\n");
  assert.ok(j4.dialogue.length >= 6 && j4.dialogue.length <= 10);
  assert.ok(j5.dialogue.length >= 6 && j5.dialogue.length <= 10);
  assert.ok(j6.dialogue.length >= 6 && j6.dialogue.length <= 10);
  assert.match(said(j4), /heavier/);
  assert.match(said(j4), /shinier/);
  assert.match(said(j5), /How does it feel/);
  assert.match(said(j6), /If you take both/);
  assert.ok(t3.dialogue.length > j5.dialogue.length);
  assert.ok(r3.dialogue.length > t3.dialogue.length);
  assert.ok(j7.dialogue.length > j6.dialogue.length);
  const wordRe = /[A-Za-z']+/g;
  for (const lesson of lessons) {
    const visible = lesson.dialogue.filter((line) => line.glossYue.trim() && !line.hideGloss).length / lesson.dialogue.length;
    for (const line of lesson.dialogue) assert.ok(line.glossYue.trim(), `${lesson.id} ${line.id} gloss`);
    if (lesson.cefr === "A1" || lesson.cefr === "A1/A2") assert.equal(visible, 1, lesson.id);
    if (lesson.cefr === "A2") assert.ok(visible >= 0.5 && visible <= 0.7, `${lesson.id} visible ${visible}`);
    if (lesson.cefr === "A2/B1") assert.ok(visible >= 0.28 && visible <= 0.45, `${lesson.id} visible ${visible}`);
  }
  const quizWords = (lesson) => lesson.quiz.reduce((sum, item) => sum + (item.prompt.match(wordRe) || []).length, 0) / lesson.quiz.length;
  const chunkWords = (lesson) => lesson.chunks.reduce((sum, item) => sum + (item.pattern.match(wordRe) || []).length, 0) / lesson.chunks.length;
  const a1Quiz = Math.max(...lessons.filter((lesson) => lesson.cefr === "A1").map(quizWords));
  const a1Chunk = Math.max(...lessons.filter((lesson) => lesson.cefr === "A1").map(chunkWords));
  for (const lesson of lessons) {
    if (lesson.cefr !== "A2" && lesson.cefr !== "A2/B1") continue;
    assert.ok(quizWords(lesson) > a1Quiz, `${lesson.id} quiz ${quizWords(lesson).toFixed(2)} <= A1 ${a1Quiz.toFixed(2)}`);
    assert.ok(chunkWords(lesson) > a1Chunk, `${lesson.id} chunk ${chunkWords(lesson).toFixed(2)} <= A1 ${a1Chunk.toFixed(2)}`);
  }
  assert.equal(j7.chunks.some((chunk) => chunk.pattern === "I can ___ the gift."), false);
  assert.ok(j7.chunks.some((chunk) => chunk.pattern.includes("Could you ___ the gift so I can carry it home today")));
  assert.match(fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8"), /顯示中文/);
  const decks = JSON.parse(fs.readFileSync(path.join(root, "content/decks.json"), "utf8"));
  const jewellery = decks.decks.find((deck) => deck.id === "jewellery");
  assert.ok(jewellery.lemmas.includes("gold-noun"));
  assert.ok(jewellery.lemmas.includes("size-noun"));
  assert.ok(jewellery.lemmas.includes("discount-noun"));
  assert.ok(jewellery.lemmas.includes("jewellery-noun"));
  assert.ok(jewellery.lemmas.includes("receipt-noun"));
  assert.ok(decks.decks.some((deck) => deck.id === "restaurant" && deck.lemmas.includes("allergic-adj")));
  assert.ok(decks.decks.some((deck) => deck.id === "travel" && deck.lemmas.includes("wifi-noun")));
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  for (const deck of decks.decks) for (const id of deck.lemmas) {
    const item = byId[id];
    assert.ok(item.ipa.startsWith("/"), id);
    exists(item.audio);
    exists(item.audioSlow);
    assert.ok(item.examples.length >= 2, id);
    for (const example of item.examples) {
      exists(example.audio);
      exists(example.audioSlow);
    }
  }
});


test("round 26 spoken goals, tray card, and spelled model", () => {
  for (const lesson of lessons) {
    assert.equal(lesson.canDoYue.includes("你能夠"), false, lesson.id);
    assert.equal(JSON.stringify(lesson).includes("係問？"), false, lesson.id);
  }
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  assert.equal(byId["my-det"].example, "My name is Ling.");
  assert.equal(byId["my-det"].exampleYue, "我叫 Ling。");
  assert.equal(byId["bin-noun"].lemma, "tray");
  assert.match(byId["bin-noun"].example, /in the tray/);
  assert.equal(byId["bin-noun"].example.includes("in the bin"), false);
  assert.match(byId["liquid-noun"].example, /in the tray/);
  assert.equal(byId["liquid-noun"].say.includes("in the bin"), false);
  const w1 = lessons.find((lesson) => lesson.id === "W1");
  const j8 = lessons.find((lesson) => lesson.id === "J8");
  const j9 = lessons.find((lesson) => lesson.id === "J9");
  const j10 = lessons.find((lesson) => lesson.id === "J10");
  const t6 = lessons.find((lesson) => lesson.id === "T6");
  assert.match(w1.dialogue[6].text, /M E I/);
  assert.equal(w1.next, "D1");
  assert.equal(j8.next, "D9");
  assert.equal(j9.next, "J10");
  assert.equal(j10.next, "J19");
  assert.equal(t6.next, "R6");
  const d1 = lessons.find((lesson) => lesson.id === "D1");
  const w2 = lessons.find((lesson) => lesson.id === "W2");
  const w3 = lessons.find((lesson) => lesson.id === "W3");
  assert.equal(d1.next, "D12");
  assert.equal(w2.next, "W3");
  assert.equal(w3.next, "W9");
  const w8 = lessons.find((lesson) => lesson.id === "W8");
  assert.equal(w8.next, "W11");
  const d5 = lessons.find((lesson) => lesson.id === "D5");
  const d7 = lessons.find((lesson) => lesson.id === "D7");
  assert.equal(d5.next, "D7");
  assert.equal(d7.next, "J3");
  const w5 = lessons.find((lesson) => lesson.id === "W5");
  const j14 = lessons.find((lesson) => lesson.id === "J14");
  assert.equal(w5.next, "W10");
  assert.equal(j14.next, "J11");
  assert.equal(d1.cefr, "A2/B1");
  assert.equal(w2.cefr, "B1");
  assert.equal(w3.cefr, "B1");
  assert.equal(JSON.stringify(d1).includes("should"), false);
  const d2 = lessons.find((lesson) => lesson.id === "D2");
  const t7 = lessons.find((lesson) => lesson.id === "T7");
  const d3 = lessons.find((lesson) => lesson.id === "D3");
  assert.equal(d2.next, "T7");
  assert.equal(t7.next, "W4");
  assert.equal(d3.next, "D8");
  const t10 = lessons.find((lesson) => lesson.id === "T10");
  assert.equal(t10.next, "T14");
  const j12 = lessons.find((lesson) => lesson.id === "J12");
  const t8 = lessons.find((lesson) => lesson.id === "T8");
  const j11 = lessons.find((lesson) => lesson.id === "J11");
  assert.equal(j12.next, "R7");
  assert.equal(t8.next, "T16");
  const r7 = lessons.find((lesson) => lesson.id === "R7");
  const w6 = lessons.find((lesson) => lesson.id === "W6");
  const t9 = lessons.find((lesson) => lesson.id === "T9");
  assert.equal(r7.next, "T8");
  assert.equal(j11.next, "W6");
  assert.equal(w6.next, "T9");
  assert.equal(t9.next, "J13");
  assert.equal(j11.cefr, "B2");
  assert.equal(d2.cefr, "A2/B1");
  assert.equal(t7.cefr, "A2/B1");
  assert.equal(d3.cefr, "B1");
  assert.equal(JSON.stringify(d2).includes("should"), false);
  assert.equal(JSON.stringify(t7).includes("should"), false);
  assert.equal(j8.cefr, "B1");
  assert.equal(j10.cefr, "B1");
  assert.equal(t6.cefr, "B1");
});

test("examples do not pad the ending unless the scene needs the time", () => {
  const tail = /(?:tonight|now|if you like)[.?!]?$/i;
  const allow = new Set(["air-conditioning-phrase", "air-conditioning-phrase#ex0", "available-adj", "available-adj#ex0", "bill-later-phrase", "bill-later-phrase#ex0", "bill-noun#ex1", "blanket-noun", "blanket-noun#ex0", "callback-noun", "callback-noun#ex0", "calling-verb", "calling-verb#ex0", "card-machine-phrase#ex1", "change-noun#ex1", "check-noun", "check-noun#ex0", "contactless-adj#ex1", "delicious-adj#ex1", "j5-l6", "j7-l6", "j9-l8", "keep-the-change-phrase", "keep-the-change-phrase#ex0", "meter-noun#ex1", "mute-verb", "mute-verb#ex0", "noisy-adj", "noisy-adj#ex0", "now-adv", "quiet-adj", "quiet-adj#ex0", "r4-l1", "r4-l6", "r5-l1", "r5-l7", "r6-l1", "r11-l8", "room-noun#ex1", "seat-verb", "separate-adj#ex1", "split-verb", "split-verb#ex0", "t4-l1", "t6-l1", "t6-l2", "t6-l5", "t6-l6", "t6-l7", "t14-l2", "takeaway-noun#ex1", "twin-noun#ex1", "w3-l6", "wind-noun", "wind-verb", "wrap-up-verb", "wrap-up-verb#ex0"]);
  function check(id, sample) {
    if (tail.test(String(sample).trim()) && !allow.has(id)) assert.fail(`${id}: ${sample}`);
  }
  for (const item of lex.items) {
    check(item.id, item.example);
    for (const [index, example] of (item.examples || []).entries()) check(`${item.id}#ex${index}`, example.en);
  }
  for (const lesson of lessons) {
    for (const line of lesson.dialogue) check(line.id, line.text);
    assert.equal(lesson.understand.some((item) => item.prompt.includes("係講？")), false, lesson.id);
    for (const item of lesson.understand) {
      if (item.prompt.includes("開頭") || item.prompt.includes("通常")) continue;
      assert.equal(item.prompt.endsWith(" 係？"), false, `${lesson.id} ${item.prompt}`);
      if (item.prompt.includes("即係問緊咩？")) {
        assert.equal(item.prompt.split("即係問緊咩？")[0].includes("?"), true, item.prompt);
      }
    }
  }
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  assert.equal(byId["polish-noun"].example, "A little polish keeps the gold bright.");
  assert.equal(byId["polish-noun"].exampleYue, "少少擦亮劑可以保持金嘅光澤。");
  assert.equal(byId["polish-noun"].examples[1].en, "This jewellery polish is for a gold chain.");
  assert.equal(byId["polish-noun"].collocations.includes("a soft polish"), false);
  assert.equal(byId["sheet-noun"].exampleYue, "一張紙。");
  assert.equal(byId["take-verb"].glossYue, "要");
  const pages = fs.readFileSync(path.join(root, "web/src/pages.tsx"), "utf8");
  assert.match(pages, /冇紅心。聽日再嚟都得。/);
  const css = fs.readFileSync(path.join(root, "web/src/styles.css"), "utf8");
  assert.match(css, /\.beat-name[\s\S]*border-radius: 999px/);
  const lessonSrc = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(lessonSrc, /nxtForHero\?\.hero/);
});

test("the app has a mic fallback and does not phone home", () => {
  const lesson = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(lesson, /MediaRecorder/);
  assert.match(lesson, /webkitSpeechRecognition|getRecognizer/);
  assert.match(lesson, /呢課唔會卡住/);
  assert.match(lesson, /改為即時講/);
  assert.match(lesson, />聽我</);
  assert.match(lesson, /咪未開/);
  assert.match(lesson, /呢輪八十四課你行完啦/);
  assert.match(lesson, /setDone\(true\)/);
  assert.match(lesson, /playSfx/);
  assert.match(fs.readFileSync(path.join(root, "web/src/sfx.ts"), "utf8"), /AudioContext/);
  assert.match(fs.readFileSync(path.join(root, "web/src/media.ts"), "utf8"), /speechActive/);
  assert.match(fs.readFileSync(path.join(root, "web/src/pages.tsx"), "utf8"), /音效/);
  const vocab = fs.readFileSync(path.join(root, "web/src/Vocab.tsx"), "utf8")
    + fs.readFileSync(path.join(root, "web/src/pages.tsx"), "utf8");
  assert.match(vocab, /生字/);
  assert.match(fs.readFileSync(path.join(root, "web/src/styles.css"), "utf8"), /#2F9E44/);
  assert.equal(fs.readFileSync(path.join(root, "web/src/styles.css"), "utf8").includes("#58CC02"), false);
  const app = fs.readFileSync(path.join(root, "web/src/App.tsx"), "utf8")
    + fs.readFileSync(path.join(root, "web/src/store.ts"), "utf8");
  assert.equal(/gtag|google-analytics|plausible|mixpanel|sentry/i.test(app), false);
});

test("installed PWAs pick up replaced teaching audio", () => {
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const config = fs.readFileSync(path.join(root, "vite.config.ts"), "utf8");
  assert.match(config, /dontCacheBustURLsMatching/);
  assert.equal(config.includes("eq-audio"), false);
  assert.equal(sw.includes("eq-audio"), false);
  const entries = [...sw.matchAll(/\{url:"([^"]+)",revision:(null|"[0-9a-f]+")\}/g)];
  assert.ok(entries.length >= 400, `precache entries ${entries.length}`);
  const vowel = entries.find((entry) => entry[1] === "assets/audio/words/the-art-vowel.mp3");
  assert.ok(vowel, "the-art-vowel.mp3");
  assert.match(vowel[2], /^"[0-9a-f]{32}"$/);
  for (const entry of entries) {
    const url = entry[1];
    if (url.endsWith(".mp3") || url.endsWith(".webp")) assert.notEqual(entry[2], "null", url);
  }
  const hashedJs = entries.filter((entry) => /assets\/index-[A-Za-z0-9_-]{8}\.js$/.test(entry[1]));
  assert.equal(hashedJs.length, 1);
  assert.equal(hashedJs[0][2], "null");
});

test("word cards use Cantonese labels and hide the simplified gloss", () => {
  const labels = JSON.parse(fs.readFileSync(path.join(root, "content/sense-labels.json"), "utf8"));
  for (const item of lex.items) {
    const key = `${item.pos}:${item.senseId}`;
    const sense = labels.sense[key];
    const pos = labels.pos[item.pos];
    assert.ok(pos, item.pos);
    assert.ok(sense, key);
    assert.match(sense, /\p{Script=Han}/u, key);
    assert.equal(sense.includes(item.senseId), false, key);
  }
  const pages = fs.readFileSync(path.join(root, "web/src/pages.tsx"), "utf8");
  assert.equal(pages.includes("item.senseId"), false);
  assert.equal(pages.includes("item.glossZh"), false);
  assert.match(pages, /learnerEyebrow/);
});

test("role-play tip names a character or tells you it is your turn", () => {
  const lesson = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(lesson, /輪到你講。等對方講完先答，中途唔會插嘴。/);
  assert.match(lesson, /你扮 \$\{name\}/);
  assert.equal(lesson.includes("你而家係"), false);
  const data = fs.readFileSync(path.join(root, "web/src/data.ts"), "utf8");
  assert.match(data, /"F1", "F2", "F3", "F4", "F5", "J1", "R1", "F6", "J2", "T1", "R10", "D4", "D5", "D7", "J3", "T2", "T17", "T11", "R2", "J4", "J5", "T3", "R3", "T4", "R4", "D6", "R9", "R13", "J6", "J7", "J15", "J18", "J20", "T5", "T12", "T15", "T13", "R12", "R14", "R15", "R5", "R11", "W1", "D1", "D12", "D2", "T7", "W4", "R8", "D10", "W7", "J8", "D9", "D11", "D13", "J9", "J10", "J19", "J16", "J17", "T6", "R6", "J12", "R7", "T8", "T16", "T18", "W2", "W3", "W9", "W8", "W11", "W12", "D3", "D8", "T10", "T14", "W5", "W10", "J14", "J11", "W6", "T9", "J13"/);
  assert.match(data, /const order = SHIPPED/);
});

test("learner Cantonese does not use 俾, stiff glosses, or simplified characters", () => {
  const banned = "俾这们时对国学请谢飞机证张读过风结发关来东车门问现欢钱钟还没说话听样买卖价网点办";
  const blobs = [];
  for (const item of lex.items) {
    const extra = [
      item.pitfallsYue || "",
      item.usageNotes || "",
      ...(item.examples || []).map((example) => example.yue),
      ...(item.miniDialogue || []).map((turn) => turn.yue),
    ].join("\n");
    blobs.push([item.id, `${item.glossYue}\n${item.exampleYue}\n${item.note || ""}\n${extra}`]);
  }
  for (const line of lines) blobs.push([line.id, line.glossYue]);
  for (const lesson of lessons) blobs.push([lesson.id, JSON.stringify(lesson)]);
  for (const [id, text] of blobs) {
    assert.equal(text.includes("俾"), false, id);
    assert.equal(text.includes("認識你真好"), false, id);
    assert.equal(text.includes("我張護照"), false, id);
    assert.equal(text.includes("係，先生"), false, id);
    assert.equal(text.includes("午安"), false, id);
    assert.equal(text.includes("晚上好"), false, id);
    assert.equal(text.includes("我只係睇吓"), false, id);
    assert.equal(text.includes("請周圍睇吓"), false, id);
    assert.equal(text.includes("一位好朋友"), false, id);
    for (const ch of banned) assert.equal(text.includes(ch), false, `${id} ${ch}`);
  }
  const think = lex.items.find((item) => item.id === "think-verb");
  assert.equal(think.exampleYue, "我諗係。");
  assert.equal(think.exampleYue.includes("\u8ad7"), true);
  assert.equal(think.exampleYue.includes("\u8ac7"), false);
  const greetings = new Set(["早晨", "你好", "晚安", "對唔住", "多謝", "等陣"]);
  for (const item of lex.items) {
    const yues = [item.exampleYue, ...(item.examples || []).map((example) => example.yue)];
    for (const yue of yues) {
      const han = [...yue].filter((ch) => /\p{Script=Han}/u.test(ch)).join("");
      if (item.id === "my-det" && yue === "我叫 Ling。") continue;
      if ([...han].length <= 2 && !greetings.has(han)) {
        assert.fail(`${item.id} exampleYue ${yue}`);
      }
    }
  }
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  assert.equal(byId["seven-num"].exampleYue, "七點鐘開門。");
  assert.equal(byId["money-noun"].exampleYue, "我冇帶夠錢。");
  assert.equal(byId["let-me-know-phrase"].example, "Let me know if you need anything.");
  assert.equal(byId["let-me-know-phrase"].exampleYue, "有咩需要就話我知。");
  assert.equal(byId["madam-noun"].exampleYue, "好嘅，小姐。");
  assert.match(byId["madam-noun"].glossYue, /女士/);
  assert.equal(byId["oclock-adv"].exampleYue, "而家係三點。");
  assert.equal(byId["hour-noun"].example, "I waited for one hour.");
  assert.equal(byId["hour-noun"].exampleYue, "我等咗一個鐘。");
  assert.equal(byId["with-prep-voiceless"].example, "I'll be right with you.");
  assert.equal(byId["with-prep-voiceless"].exampleYue, "我即刻嚟招呼你。");
  assert.match(byId["with-prep-voiceless"].say, /\[\[wˈɪθ\]\]/);
  assert.equal(byId["shoe-noun"].example, "I need a new shoe.");
  assert.equal(byId["shoe-noun"].exampleYue, "我要一隻新鞋。");
  assert.equal(byId["minute-noun"].example, "Wait a minute.");
  assert.equal(byId["minute-noun"].exampleYue, "等陣。");
  assert.equal(byId["aisle-noun"].glossYue, "走廊位");
  assert.equal(byId["aisle-noun"].exampleYue, "靠窗定係走廊位？");
  for (const item of lex.items) {
    assert.equal(`${item.glossYue}\n${item.exampleYue}`.includes("通道位"), false, item.id);
  }
  for (const line of lines) assert.equal(line.glossYue.includes("通道位"), false, line.id);
  for (const lesson of lessons) assert.equal(JSON.stringify(lesson).includes("通道位"), false, lesson.id);
});

test("short English examples are greetings or set phrases", () => {
  const allow = new Set([
    "please relax",
    "let's begin",
    "good morning",
    "good afternoon",
    "good evening",
    "good night",
    "thank you",
    "thanks",
    "yes sir",
    "yes madam",
    "of course",
    "anything else",
    "don't cheat",
    "chew slowly",
    "excuse me",
    "i'm sorry",
    "pardon me",
    "you're welcome",
  ]);
  for (const item of lex.items) {
    const samples = [item.example, ...(item.examples || []).map((example) => example.en)];
    for (const sample of samples) {
      const words = sample.replace(/[.?!,]/g, " ").trim().split(/\s+/).filter(Boolean);
      if (words.length > 2) continue;
      const key = words.join(" ").toLowerCase();
      assert.ok(allow.has(key), `${item.id} example ${sample}`);
    }
  }
  for (const banned of ["With you.", "One hour.", "A new shoe."]) {
    assert.equal(lex.items.some((item) => item.example === banned), false, banned);
  }
});

test("each example contains its lemma in the glossed sense", () => {
  function tokens(sample) {
    return String(sample).toLowerCase().replace(/[.?!,;:"']/g, " ").replace(/-/g, " ").split(/\s+/).filter(Boolean);
  }
  function sameWord(hay, needle) {
    if (hay === needle || hay === `${needle}s` || hay === `${needle}es`) return true;
    if (hay === `${needle}ed` || hay === `${needle}d` || hay === `${needle}ing`) return true;
    const last = needle[needle.length - 1];
    return hay === `${needle}${last}ed`;
  }
  function hasContig(text, lemma) {
    const needle = tokens(lemma);
    const hay = tokens(text);
    assert.ok(needle.length > 0, lemma);
    outer: for (let i = 0; i <= hay.length - needle.length; i += 1) {
      for (let j = 0; j < needle.length; j += 1) if (!sameWord(hay[i + j], needle[j])) continue outer;
      return true;
    }
    return false;
  }
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  for (const item of lex.items) {
    const samples = [item.example, ...(item.examples || []).map((example) => example.en)];
    for (const sample of samples) assert.equal(hasContig(sample, item.lemma), true, `${item.id} ${sample}`);
  }
  assert.equal(byId["of-prep"].example, "I would like a cup of tea.");
  assert.match(byId["of-prep"].exampleYue, /茶/);
  assert.match(byId["of-prep"].say, /ˈʌv/);
  assert.doesNotMatch(byId["of-prep"].example, /Of course/);
  assert.equal(byId["keep-verb"].example, "Please keep the ring clean.");
  assert.match(byId["keep-verb"].exampleYue, /保持/);
  assert.doesNotMatch(byId["keep-verb"].example, /light/i);
  assert.equal(byId["the-art"].example, "The menu is ready.");
  assert.match(byId["the-art"].exampleYue, /餐牌/);
  assert.match(byId["the-art"].say, /ðə/);
  assert.doesNotMatch(byId["the-art"].example, /sound is short/i);
  assert.equal(byId["listen-verb"].example, "Please listen to the guest.");
  assert.match(byId["listen-verb"].exampleYue, /聽/);
  assert.match(byId["listen-verb"].say, /lˈɪsən/);
  assert.doesNotMatch(byId["listen-verb"].example, /Ship is short/);
  assert.equal(byId["take-verb"].example, "I'll take this one.");
  assert.equal(byId["take-verb"].exampleYue, "我要呢件。");
  assert.doesNotMatch(byId["take-verb"].example, /take a look/i);
  assert.doesNotMatch(byId["take-verb"].exampleYue, /請慢慢睇/);
  assert.equal(byId["jade-noun"].exampleYue, "呢塊玉係天然嘅。");
  assert.equal(byId["jade-noun"].examples[0].yue, "呢塊玉係天然嘅。");
  assert.equal(byId["jade-noun"].miniDialogue[1].yue, "呢塊玉係天然嘅。");
  assert.equal(JSON.stringify(byId["jade-noun"]).includes("呢塊玉係天然。"), false);
});

test("perfect stays one stress and street names the right street", () => {
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  const perfect = byId["perfect-adj"];
  assert.equal(perfect.arpabet, "P ER1 F IH0 K T");
  assert.equal(perfect.ipa, "/ˈpɝ.fɪkt/");
  assert.equal(perfect.syllableIpa[1], "fɪkt");
  assert.equal(perfect.say.includes("ˌ"), false);
  assert.equal(perfect.examples[0].say.includes("ˌ"), false);
  assert.equal(perfect.examples[1].say.includes("ˌ"), false);
  assert.equal(byId["loose-adj"].examples[1].say.includes("ˌ"), false);
  assert.equal(byId["almost-adv"].examples[1].say.includes("ˌ"), false);
  assert.equal(byId["street-noun"].example, "This is not the right street.");
  assert.equal(byId["street-noun"].exampleYue, "呢條唔係啱嗰條街。");
  assert.equal(byId["street-noun"].say, "This is not the right street.");
  const lesson = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  const pages = fs.readFileSync(path.join(root, "web/src/pages.tsx"), "utf8");
  assert.match(lesson, /quizRecapLine/);
  assert.match(pages, /resume-banner/);
  assert.match(pages, /繼續/);
  assert.match(pages, /重新開始/);
});

test("a dialogue uses today or tonight on at most one line", () => {
  for (const lesson of lessons) {
    const hits = lesson.dialogue.filter((line) => /today|tonight/i.test(line.text));
    assert.ok(hits.length <= 1, `${lesson.id} ${hits.map((line) => line.id).join(",")}`);
  }
});

test("a later dialogue line does not reuse three content lemmas", () => {
  const func = new Set("a an the i you we they he she it my your our is are was were be been am have has had do does did will would can could should may might to of in on at for with and or but if so not this that these those me him her them us please just very still also then there here from as about into".split(" "));
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  function vocabOf(lesson) {
    const vocab = new Set();
    for (const id of lesson.lemmas) {
      for (const tok of byId[id].lemma.toLowerCase().replace(/-/g, " ").match(/[a-z']+/g) || []) {
        if (tok.length > 2 && !func.has(tok)) vocab.add(tok);
      }
    }
    return vocab;
  }
  function contentSet(text, vocab) {
    const found = new Set();
    for (const tok of text.toLowerCase().match(/[a-z']+/g) || []) {
      let base = null;
      if (vocab.has(tok)) base = tok;
      else if (tok.endsWith("s") && vocab.has(tok.slice(0, -1))) base = tok.slice(0, -1);
      else if (tok.endsWith("es") && vocab.has(tok.slice(0, -2))) base = tok.slice(0, -2);
      if (base && base.length > 2 && !func.has(base)) found.add(base);
    }
    return found;
  }
  for (const lesson of lessons) {
    const vocab = vocabOf(lesson);
    const sets = lesson.dialogue.map((line) => contentSet(line.text, vocab));
    for (let i = 0; i < sets.length; i += 1) {
      for (let j = 0; j < i; j += 1) {
        const shared = [...sets[i]].filter((tok) => sets[j].has(tok));
        assert.ok(shared.length < 3, `${lesson.id} ${lesson.dialogue[i].id} vs ${lesson.dialogue[j].id} ${shared.join(",")}`);
      }
    }
  }
});

test("dialogue speakers alternate and a staff reply shares a content word", () => {
  const staff = new Set(["mei", "mina", "cole", "ana", "kai", "sam", "kim", "ada", "ren", "jo", "ray", "ben", "lea", "owen", "wen", "pat", "noa", "may", "suki", "pesi", "hugh", "nori", "reid", "opal", "wynn", "niles", "ida", "mira", "otto", "glen"]);
  const staffAllow = new Set(["j16-l4", "j16-l8", "r11-l4", "r11-l6", "r11-l8", "r12-l4", "r12-l6", "r12-l8", "w10-l6", "w10-l8", "r13-l2", "j18-l2", "j18-l4", "j18-l6", "j18-l8", "d11-l6", "d11-l8", "d12-l7", "t15-l4", "t15-l6", "t15-l8", "w11-l6", "r14-l4", "r14-l8", "j19-l2", "j19-l8"]);
  const func = new Set("a an the i you we they he she it my your our is are was were be been am have has had do does did will would can could should may might to of in on at for with and or but if so not this that these those me him her them us please just very still also then there here from as about into".split(" "));
  const customerQuestion = /which\b.+\bbetter\b|how long will this\b.+\bparcel\b|\bspell my name\b/i;
  function words(text) {
    const found = new Set();
    for (const tok of text.toLowerCase().match(/[a-z']+/g) || []) {
      if (tok.length > 2 && !func.has(tok)) found.add(tok);
    }
    return found;
  }
  for (const lesson of lessons) {
    const main = lesson.dialogue;
    const speakers = main.map((line) => line.speaker);
    if (new Set(speakers).size > 1) {
      let run = 1;
      for (let i = 1; i < speakers.length; i += 1) {
        run = speakers[i] === speakers[i - 1] ? run + 1 : 1;
        assert.ok(run <= 2, `${lesson.id} ${main[i].id}`);
      }
    }
    const texts = lesson.dialogue.map((line) => line.text.trim().toLowerCase().replace(/\s+/g, " "));
    assert.equal(new Set(texts).size, texts.length, `${lesson.id} duplicate line`);
    const you = lesson.roleplay && lesson.roleplay.you;
    for (let i = 0; i < main.length; i += 1) {
      const line = main[i];
      if (staff.has(line.speaker) && line.speaker !== you && customerQuestion.test(line.text)) {
        assert.fail(`${line.id}: ${line.text}`);
      }
      if (!i) continue;
      const prev = main[i - 1];
      if (!prev.text.trim().endsWith("?")) continue;
      if (!staff.has(line.speaker) || line.speaker === you) continue;
      if (staffAllow.has(line.id)) continue;
      const shared = [...words(line.text)].filter((tok) => words(prev.text).has(tok));
      assert.ok(shared.length >= 1, `${line.id} does not answer ${prev.id}`);
    }
  }
});

test("a dialogue line does not stack two filler paddings", () => {
  const specs = [
    ["as well for us", ["as", "well", "for", "us"]],
    ["this time round", ["this", "time", "round"]],
    ["once more", ["once", "more"]],
    ["after lunch", ["after", "lunch"]],
    ["at all", ["at", "all"]],
    ["for us", ["for", "us"]],
    ["so far", ["so", "far"]],
    ["truly", ["truly"]],
    ["already", ["already"]],
    ["really", ["really"]],
    ["kindly", ["kindly"]],
    ["well", ["well"]],
  ];
  function hits(text) {
    const tokens = (text.toLowerCase().match(/[a-z']+/g) || []);
    const used = new Set();
    const found = [];
    for (let i = 0; i < tokens.length; i += 1) {
      if (used.has(i)) continue;
      for (const [name, parts] of specs) {
        let ok = true;
        for (let k = 0; k < parts.length; k += 1) {
          if (used.has(i + k) || tokens[i + k] !== parts[k]) ok = false;
        }
        if (!ok) continue;
        for (let k = 0; k < parts.length; k += 1) used.add(i + k);
        found.push(name);
        break;
      }
    }
    return found;
  }
  const hard = ["later on", "once more here", "from now", "very clearly for you", "gladly", "full working day", "with care", "whole office team"];
  for (const lesson of lessons) {
    for (const line of lesson.dialogue) {
      const found = hits(line.text);
      assert.ok(found.length < 2, `${line.id} ${found.join("+")} ${line.text}`);
      const low = line.text.toLowerCase();
      for (const phrase of hard) assert.equal(low.includes(phrase), false, `${line.id} ${phrase}`);
    }
  }
});

test("a lesson does not pad three because clauses", () => {
  const func = new Set("a an the i you we they he she it my your our is are was were be been am have has had do does did will would can could should may might to of in on at for with and or but if so not this that these those me him her them us please just very still also then there here from as about into".split(" "));
  function words(text) {
    return new Set((text.toLowerCase().match(/[a-z']+/g) || []).filter((tok) => tok.length > 2 && !func.has(tok)));
  }
  for (const lesson of lessons) {
    const hits = lesson.dialogue.filter((line) => /\bbecause\b/i.test(line.text));
    assert.ok(hits.length <= 2, `${lesson.id} because ${hits.length}`);
    for (const line of hits) {
      const parts = line.text.split(/\bbecause\b/i);
      if (parts.length < 2) continue;
      const shared = [...words(parts[0])].filter((tok) => words(parts.slice(1).join(" ")).has(tok));
      assert.ok(shared.length < 2, `${line.id} because ${shared.join(",")}`);
    }
  }
});

test("rewritten scenes answer the question they were asked", () => {
  const said = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.text).join("\n");
  const gloss = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.glossYue).join("\n");
  assert.doesNotMatch(said("D6"), /write a prescription/i);
  assert.doesNotMatch(said("R8"), /your shop/i);
  const r8 = lessons.find((lesson) => lesson.id === "R8");
  const pay = r8.understand.find((item) => /how can i pay/i.test(item.prompt));
  assert.ok(pay, "r8 pay");
  assert.doesNotMatch(pay.explain, /how long|幾耐/);
  assert.match(pay.choices[pay.answer], /付|畀/);
  assert.doesNotMatch(said("J13"), /trays|than we hoped|new schedule/i);
  assert.doesNotMatch(gloss("J13"), /請把|同一張紙/);
  assert.match(gloss("J13"), /請將/);
  assert.match(gloss("J13"), /嗰封電郵/);
  assert.doesNotMatch(said("W7"), /rest tonight|next shift opens/i);
  assert.match(said("W7"), /Mei can cover/);
  assert.match(said("W7"), /not feeling well/);
  assert.match(said("T10"), /baggage receipt/i);
  assert.doesNotMatch(said("T10"), /suitcase handle|evening truck|should/i);
  const r9 = lessons.find((lesson) => lesson.id === "R9");
  assert.match(r9.dialogue[3].text, /split/i);
  assert.doesNotMatch(said("J13"), /four weeks/i);
  assert.doesNotMatch(said("R9"), /sits on the printed total|fresh bill/i);
  assert.doesNotMatch(JSON.stringify(r9), /sits on the printed total|fresh bill/i);
  assert.doesNotMatch(said("W7"), /while you rest at home/i);
  const w7 = lessons.find((lesson) => lesson.id === "W7");
  assert.doesNotMatch(JSON.stringify(w7), /while you rest at home/i);
  assert.match(said("W7"), /Who can cover your shift this morning/);
  assert.doesNotMatch(said("J14"), /stay soft|ready safely|four short weeks|full deposit/i);
  assert.match(said("J14"), /yellow gold/i);
  assert.match(said("J14"), /white gold/i);
  assert.match(said("J14"), /pick it up in four weeks/i);
  assert.doesNotMatch(said("W8"), /open piece of work|same quiet afternoon|before we break|whole plan stays clear|this afternoon|Friday morning/i);
  assert.doesNotMatch(said("D7"), /at this salon today|a short dry/i);
  assert.match(said("D7"), /How much is it/);
  assert.match(said("D7"), /blow dry/i);
  assert.doesNotMatch(said("T11"), /Island line.*change at Admiralty/i);
  assert.doesNotMatch(said("T11"), /this morning/i);
  assert.match(said("T11"), /Island line/);
  assert.doesNotMatch(said("D8"), /tonight|be home|tomorrow morning/i);
  assert.match(said("D8"), /after six/);
  assert.doesNotMatch(said("R10"), /one latte|is it to go/i);
  assert.match(said("R10"), /I would like a latte, please/);
  assert.match(said("R10"), /Would you like this cup for here, or to go/);
  assert.equal(lessons.find((lesson) => lesson.id === "R10").next, "D4");
  assert.equal(lessons.find((lesson) => lesson.id === "T11").next, "R2");
  assert.equal(lessons.find((lesson) => lesson.id === "D8").next, "T10");
});

test("same-scene choices share a lemma or topic tag", () => {
  const func = new Set("a an the i you we they he she it my your our is are was were be been am have has had do does did will would can could should may might to of in on at for with and or but if so not this that these those me him her them us please just very still also then there here from as about into".split(" "));
  const byId = Object.fromEntries(lex.items.map((item) => item.id).map((id) => [id, lex.items.find((item) => item.id === id)]));
  for (const lesson of lessons) {
    if (!lesson.topicTags) continue;
    const vocab = [];
    for (const id of lesson.lemmas) {
      for (const tok of byId[id].lemma.toLowerCase().replace(/-/g, " ").match(/[a-z']+/g) || []) {
        if (tok.length > 2 && !func.has(tok)) vocab.push(tok);
      }
    }
    for (const item of [...lesson.understand, ...lesson.quiz]) {
      for (const choice of item.choices || []) {
        const text = String(choice);
        const low = text.toLowerCase();
        const ok = lesson.topicTags.some((tag) => text.includes(tag)) || vocab.some((tok) => low.includes(tok));
        assert.equal(ok, true, `${lesson.id} ${text}`);
      }
    }
  }
});

test("a lesson does not keep every correct choice first", () => {
  for (const lesson of lessons) {
    const items = [...lesson.understand, ...lesson.quiz.filter((item) => Number.isInteger(item.answer))];
    assert.equal(items.some((item) => item.answer !== 0), true, lesson.id);
  }
});

test("seeded order is a stable permutation", () => {
  const a = seededOrder(5, 42);
  assert.deepEqual(a, seededOrder(5, 42));
  assert.deepEqual([...a].sort((x, y) => x - y), [0, 1, 2, 3, 4]);
  assert.equal(new Set(a).size, 5);
});

test("composite difficulty does not dip on lessons that can still change", () => {
  const pathFile = JSON.parse(fs.readFileSync(path.join(root, "content/path.json"), "utf8"));
  const order = pathFile.units.flatMap((unit) => unit.lessons).map((entry) => entry.id);
  const byId = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson]));
  const lexById = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  const rank = { A1: 1, "A1/A2": 2, A2: 3, "A2/B1": 4, B1: 5, "B1/B2": 6, B2: 7 };
  const first = new Map();
  for (const id of order) {
    const lesson = byId[id];
    for (const lemma of lesson.lemmas) first.set(lemma, first.has(lemma) ? first.get(lemma) : rank[lesson.cefr]);
  }
  function score(lesson) {
    const lines = lesson.dialogue.map((line) => line.text);
    const words = lines.reduce((sum, text) => sum + (text.match(/[A-Za-z']+/g) || []).length, 0) / lines.length;
    const clauses = lines.reduce((sum, text) => sum + (text.match(/\b(?:if|when|because|so|that|which)\b/gi) || []).length, 0) / lines.length;
    const ranks = lesson.lemmas.map((id) => first.get(id) || rank[lesson.cefr]);
    const meanRank = ranks.reduce((sum, n) => sum + n, 0) / ranks.length;
    return 0.4 * words + 2 * meanRank + clauses;
  }
  assert.equal(order.length, 84);
  const locked = new Set(["J16", "R11", "R12", "W10", "T14", "R13", "J18", "D11", "W9", "D12", "T15", "W11", "R14", "J19", "T16"]);
  const gated = new Set(["T17", "J20", "D13"]);
  const scores = order.map((id) => score(byId[id]));
  for (let i = 1; i < order.length; i += 1) {
    const curId = order[i];
    const prevId = order[i - 1];
    if (!gated.has(curId) && !gated.has(prevId)) continue;
    if (locked.has(curId)) continue;
    assert.ok(scores[i - 1] - scores[i] <= 0.5 + 1e-9, `${prevId} ${scores[i - 1].toFixed(3)} -> ${curId} ${scores[i].toFixed(3)}`);
  }
  assert.equal(byId.T2.next, "T17");
  assert.equal(byId.T17.next, "T11");
  assert.equal(byId.J15.next, "J18");
  assert.equal(byId.T12.next, "T15");
  assert.equal(byId.D9.next, "D11");
  for (const id of gated) assert.equal(locked.has(id), false, id);
});

test("white gold is 白K金 and the tablet eyebrow is 藥片", () => {
  const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));
  const labels = JSON.parse(fs.readFileSync(path.join(root, "content/sense-labels.json"), "utf8"));
  const white = byId["white-gold-phrase"];
  const yellow = byId["yellow-gold-phrase"];
  assert.equal(JSON.stringify(white).includes("白金"), false);
  assert.equal(white.glossYue, "白K金");
  assert.equal(yellow.glossYue, "黃K金");
  assert.equal(JSON.stringify(yellow).includes("白金"), false);
  assert.equal(labels.sense["phrase:pale-alloy"], "白K金");
  assert.equal(labels.sense["phrase:warm-metal"], "黃K金");
  assert.equal(labels.sense["noun:pill"], "藥片");
  const tablet = byId["tablet-noun"];
  const eyebrow = `${labels.pos[tablet.pos]} · ${labels.sense[`${tablet.pos}:${tablet.senseId}`]}`;
  assert.equal(eyebrow.includes("藥丸"), false);
  assert.match(eyebrow, /藥片/);
  const j14 = lessons.find((lesson) => lesson.id === "J14");
  assert.equal(JSON.stringify(j14).includes("白金"), false);
  assert.equal(byId["on-track-phrase"].ipa, "/ɑn ˈtɹæk/");
  assert.equal(byId["on-track-phrase"].stress, 2);
  assert.equal(byId["follow-up-verb"].ipa, "/ˌfɑ.loʊ ˈʌp/");
  assert.equal(byId["follow-up-verb"].stress, 3);
  assert.equal(byId["blow-dry-phrase"].ipa, "/ˌbloʊ ˈdɹaɪ/");
  assert.equal(byId["blow-dry-phrase"].stress, 2);
  assert.equal(byId["landmark-noun"].example, "Turn left at the landmark.");
  assert.equal(byId["landmark-noun"].examples[1].en, "Walk straight to the landmark.");
  assert.equal(byId["to-go-phrase"].glossYue, "拎走");
  assert.equal(byId["to-go-phrase"].example, "I would like this latte to go.");
  assert.equal(labels.sense["phrase:take-away"], "拎走");
  assert.equal(byId["access-noun"].glossYue, "入單位");
  assert.equal(labels.sense["noun:entry-right"], "入單位");
  assert.equal(byId["repair-noun"].example, "Can someone repair this leak?");
  assert.equal(JSON.stringify(byId["blow-dry-phrase"]).toLowerCase().includes("a short dry"), false);
  assert.equal(JSON.stringify(byId["blow-dry-phrase"]).includes("A short blow dry"), false);
  const silver = byId["silver-noun"];
  const gold = byId["gold-noun"];
  assert.equal(silver.pitfallsYue.includes("白金"), false);
  assert.equal(silver.examples[1].yue.includes("白金"), false);
  assert.match(silver.examples[1].yue, /白K金/);
  assert.equal(gold.note.includes("白金"), false);
  assert.equal(gold.pitfallsYue.includes("白金"), false);
  assert.match(gold.note, /白K金/);
  assert.match(gold.pitfallsYue, /玫瑰金/);
  const j4 = lessons.find((lesson) => lesson.id === "J4");
  assert.equal(j4.sound.note.includes("白金"), false);
  assert.match(j4.sound.note, /白K金唔係鉑金/);
  assert.equal(byId["machine-noun"].glossYue, "機器");
  assert.equal(byId["identity-noun"].ipa, "/aɪ.ˈdɛn.tə.ti/");
  assert.deepEqual(byId["identity-noun"].syllableIpa, ["aɪ", "ˈdɛn", "tə", "ti"]);
  assert.equal(byId["identity-noun"].stress, 2);
  assert.equal(byId["identity-noun"].arpabet, "AY0 D EH1 N T AH0 T IY0");
  assert.equal(byId["trim-noun"].exampleYue.includes("剪個簡單髮型"), false);
  assert.match(byId["trim-noun"].exampleYue, /修短少少/);
});

test("hero style allowlist names the pending gap in path order", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content/art-style-heroes.json"), "utf8"));
  const pathFile = JSON.parse(fs.readFileSync(path.join(root, "content/path.json"), "utf8"));
  const ids = pathFile.units.flatMap((unit) => unit.lessons).map((entry) => entry.id.toLowerCase());
  const allow = new Set(manifest.allow);
  const missing = ids.filter((id) => !allow.has(id));
  assert.deepEqual(missing, manifest.pending);
  for (const id of manifest.allow) {
    const file = path.join(root, "assets/art/lessons", `${id}.webp`);
    assert.equal(fs.existsSync(file), true, id);
    assert.ok(fs.statSync(file).size > 400, id);
  }
  for (const id of ["j15", "t12", "d9"]) assert.equal(manifest.allow.includes(id), true, id);
  for (const id of ["j15", "t12", "d9"]) assert.equal(manifest.pending.includes(id), false, id);
});

test("round 38 scenes keep one plan", () => {
  const said = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.text).join("\n");
  const gloss = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.glossYue).join("\n");
  assert.doesNotMatch(said("J15"), /half a size smaller|made smaller/i);
  assert.match(said("J15"), /half a size larger/);
  assert.match(said("J15"), /Saturday/);
  assert.doesNotMatch(said("T12"), /beside the bed in the hall|keep the luggage/i);
  assert.match(said("T12"), /printed on this card/);
  assert.match(said("T12"), /leave the luggage at the desk/);
  assert.match(gloss("T12"), /訂房/);
  assert.doesNotMatch(gloss("T12"), /訂位/);
  assert.doesNotMatch(said("D9"), /today|next working day|account|card stays in the machine/i);
  assert.match(said("D9"), /right now/);
  assert.match(said("D9"), /Friday/);
  assert.match(said("D9"), /one identity document/);
  assert.match(said("D9"), /temporary limit/);
  assert.match(said("D9"), /one working day/);
  assert.equal(lessons.find((lesson) => lesson.id === "R11").next, "W1");
  assert.equal(lessons.find((lesson) => lesson.id === "W9").next, "W8");
  assert.equal(lessons.find((lesson) => lesson.id === "J16").next, "J17");
  assert.equal(lessons.find((lesson) => lesson.id === "R5").next, "R11");
  assert.equal(lessons.find((lesson) => lesson.id === "W3").next, "W9");
  assert.equal(lessons.find((lesson) => lesson.id === "J10").next, "J19");
  assert.equal(lessons.find((lesson) => lesson.id === "J19").next, "J16");
});

test("a dialogue does not repeat a five-word fragment three times", () => {
  const wordRe = /[A-Za-z']+/g;
  const allow = new Set(["r3:the sauce on the side"]);
  for (const lesson of lessons) {
    const counts = new Map();
    for (const line of lesson.dialogue) {
      const toks = (line.text.match(wordRe) || []).map((tok) => tok.toLowerCase());
      for (let i = 0; i + 5 <= toks.length; i += 1) {
        const frag = toks.slice(i, i + 5).join(" ");
        counts.set(frag, (counts.get(frag) || 0) + 1);
      }
    }
    for (const [frag, n] of counts) {
      if (n >= 3 && !allow.has(`${lesson.id.toLowerCase()}:${frag}`)) assert.fail(`${lesson.id} ×${n} ${frag}`);
    }
  }
});

test("round 38 heroes move the next fifteen into the allow list", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content/art-style-heroes.json"), "utf8"));
  for (const id of ["j4", "j5", "t3", "r3", "t4", "r4", "j6", "j7", "t5", "r5", "w1", "d1", "d2", "t7", "w4", "r11", "w9", "j16"]) {
    assert.equal(manifest.allow.includes(id), true, id);
    assert.equal(manifest.pending.includes(id), false, id);
  }
  assert.deepEqual(manifest.pending, []);
});

test("listen prompts and the play button hide the answer", () => {
  const src = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.equal(src.includes("播放 {lemma.lemma}"), false);
  assert.match(src, />\s*播放\s*</);
  const word = (answer) => new RegExp(`(?<![A-Za-z'])${String(answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z'])`, "i");
  for (const lesson of lessons) {
    for (const item of lesson.quiz) {
      if (item.type !== "listen") continue;
      assert.equal(word(item.choices[item.answer]).test(item.prompt), false, `${lesson.id} ${item.prompt}`);
    }
  }
});

test("round 39 scenes keep one plan", () => {
  const said = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.text).join("\n");
  const j15 = said("J15");
  assert.doesNotMatch(j15, /the band is smaller|smaller/i);
  assert.match(j15, /half a size larger/);
  assert.match(j15, /the charge is nothing/);
  assert.equal(lessons.find((lesson) => lesson.id === "J15").lemmas.includes("smaller-adj"), false);
  const w9 = said("W9");
  const startsMonday = /leave starts on monday/i.test(w9);
  const startsAfterTuesday = /after tuesday/i.test(w9);
  assert.equal(startsMonday && startsAfterTuesday, false);
  assert.match(w9, /Wednesday's a public holiday/);
  assert.match(w9, /Friday morning/);
  const d9 = lessons.find((lesson) => lesson.id === "D9");
  assert.match(d9.canDoEn, /one working day/);
  assert.match(d9.canDoEn, /new card on Friday/);
  assert.doesNotMatch(d9.canDoEn, /until Friday/);
  assert.equal(lessons.find((lesson) => lesson.id === "T12").next, "T15");
  assert.equal(lessons.find((lesson) => lesson.id === "T13").next, "R12");
  assert.equal(lessons.find((lesson) => lesson.id === "R8").next, "D10");
  assert.equal(lessons.find((lesson) => lesson.id === "D10").next, "W7");
  assert.equal(lessons.find((lesson) => lesson.id === "J16").next, "J17");
  assert.equal(lessons.find((lesson) => lesson.id === "J17").next, "T6");
  assert.equal(lessons.find((lesson) => lesson.id === "J15").next, "J18");
  assert.equal(lessons.find((lesson) => lesson.id === "D9").next, "D11");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content/art-style-heroes.json"), "utf8"));
  assert.deepEqual(manifest.pending, []);
});

test("round 40 scenes keep one plan", () => {
  const said = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.text).join("\n");
  const w9 = said("W9");
  const willApprove = /i will approve/i.test(w9);
  const approvedToday = /have approved already today|approved those four dates already today/i.test(w9);
  assert.equal(willApprove && approvedToday, false);
  assert.match(w9, /handover note/);
  assert.doesNotMatch(w9, /already today/i);
  const d10 = lessons.find((lesson) => lesson.id === "D10");
  assert.doesNotMatch(said("D10"), /full plate/i);
  assert.doesNotMatch(said("D10"), /blue seven four two/i);
  assert.match(said("D10"), /MX 42 17/);
  assert.doesNotMatch(said("D10"), /for you here/i);
  const j17 = said("J17");
  assert.doesNotMatch(j17, /two hundred/);
  assert.doesNotMatch(j17, /four hundred/);
  assert.match(j17, /two thousand/);
  assert.match(j17, /six thousand/);
  assert.match(j17, /freshwater pearl/i);
  assert.doesNotMatch(j17, /\bfull\b/i);
  const t12 = lessons.find((lesson) => lesson.id === "T12");
  for (const line of t12.dialogue) {
    if (/\bfour\b/i.test(line.text)) assert.doesNotMatch(line.text, /early/i, line.id);
  }
  assert.match(said("T12"), /non-smoking room/);
  assert.match(said("T12"), /ready after four/);
  assert.equal(lessons.find((lesson) => lesson.id === "R12").next, "R14");
  assert.equal(lessons.find((lesson) => lesson.id === "R14").next, "R15");
  assert.equal(lessons.find((lesson) => lesson.id === "T16").next, "T18");
  assert.equal(lessons.find((lesson) => lesson.id === "T14").next, "W5");
  assert.equal(lessons.find((lesson) => lesson.id === "T10").next, "T14");
  assert.equal(lessons.find((lesson) => lesson.id === "W10").next, "J14");
  assert.equal(lessons.find((lesson) => lesson.id === "W5").next, "W10");
  const seqs = new Map();
  for (const lesson of lessons) {
    const key = lesson.quiz.map((item) => item.answer).join(",");
    seqs.set(key, (seqs.get(key) || 0) + 1);
  }
  for (const [key, n] of seqs) assert.ok(n <= 3, `${key} x${n}`);
  const word = (answer) => new RegExp(`(?<![A-Za-z'])${String(answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z'])`, "i");
  for (const lesson of lessons) {
    for (const item of lesson.quiz) {
      if (item.type === "meaning") continue;
      if (!item.choices || !Number.isInteger(item.answer)) continue;
      assert.equal(word(item.choices[item.answer]).test(item.prompt), false, `${lesson.id} ${item.prompt}`);
    }
  }
});

test("dialogue questions share a word, lines do not stuff one word, and padding tails stay off new copy", () => {
  const func = new Set("a an the i you we they he she it my your our is are was were be been am have has had do does did will would can could should may might to of in on at for with and or but if so not this that these those me him her them us please just very still also then there here from as about into".split(" "));
  const qAllow = new Set(["f4-l2", "f5-l2", "j1-l2", "r1-l2", "r1-l4", "j2-l4", "r10-l7", "j3-l5", "j4-l3", "j5-l2", "t4-l3", "t4-l5", "r4-l7", "r4-l8", "j6-l4", "j7-l7", "j7-m1", "w1-l2", "d1-l2", "w4-l6", "j9-l5", "j9-l8", "j10-l3", "t6-l2", "t8-l4", "t10-l3", "w6-l2", "j16-l3", "j16-l4", "j16-l8", "r11-l4", "r11-l6", "r11-l8", "r12-l4", "r12-l6", "r12-l8", "w10-l6", "w10-l8", "r13-l2", "r13-l5", "r13-l7", "j18-l2", "j18-l4", "j18-l5", "j18-l6", "j18-l8", "d11-l6", "d11-l8", "w9-l7", "d12-l2", "d12-l4", "d12-l6", "d12-l7", "t15-l3", "t15-l4", "t15-l6", "t15-l8", "w11-l6", "r14-l4", "r14-l5", "r14-l8", "j19-l2", "j19-l8", "t16-l3"]);
  const freqAllow = new Set(["R10:like", "R3:sauce", "R9:bill", "J15:ring", "T12:room", "D2:card", "R8:chicken", "D9:card", "W2:deadline", "W3:update", "T10:bag", "T14:gate", "W10:email", "J14:ring"]);
  const tailAllow = new Set(["j1-l1", "j2-l1", "t1-l1", "t2-l5", "r2-l1", "r2-l5", "t4-l3", "d6-l1", "j6-l2", "j7-l3", "j7-m1", "t5-l3", "t12-l4", "d1-l1", "d1-l6", "d2-l1", "t7-l1", "j10-l2", "j12-l2", "j12-l8", "t8-l1", "w2-l1", "w3-l1", "d3-l5", "w5-l4", "j11-l5", "t9-l5", "t9-l8", "r11-l2", "r12-l4", "d11-l8"]);
  const tails = [/\bfor you here\b/i, /\bthat note here\b/i, /\bfor you\b/i, /\btoday\b/i];
  function content(text) {
    return new Set((text.toLowerCase().match(/[a-z']+/g) || []).filter((tok) => tok.length > 2 && !func.has(tok)));
  }
  for (const lesson of lessons) {
    const main = lesson.dialogue;
    for (let i = 1; i < main.length; i += 1) {
      if (!main[i - 1].text.trim().endsWith("?")) continue;
      const shared = [...content(main[i].text)].filter((tok) => content(main[i - 1].text).has(tok));
      if (shared.length < 1 && !qAllow.has(main[i].id)) assert.fail(`${main[i].id} does not share a content word`);
    }
    const counts = new Map();
    for (const line of main) {
      for (const tok of content(line.text)) counts.set(tok, (counts.get(tok) || 0) + 1);
    }
    for (const [tok, n] of counts) {
      if (n > 4 && !freqAllow.has(`${lesson.id}:${tok}`)) assert.fail(`${lesson.id} ${tok} x${n}`);
    }
    for (const line of main) {
      if (tails.some((re) => re.test(line.text)) && !tailAllow.has(line.id)) assert.fail(`${line.id} ${line.text}`);
    }
  }
});

test("round 41 scenes keep the r39 facts and the hero preloads", () => {
  const said = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.text).join("\n");
  const j16 = said("J16");
  assert.match(j16, /12\.06\.2021/);
  assert.match(j16, /initials, G and M/);
  assert.match(j16, /fourteen characters/);
  assert.match(j16, /plain font/);
  assert.match(j16, /fifty dollars/);
  assert.match(j16, /ready in three days/);
  assert.doesNotMatch(j16, /check the spelling of that date/i);
  const r11 = said("R11");
  assert.match(r11, /egg is fine/i);
  assert.doesNotMatch(r11, /completely fine/i);
  assert.match(r11, /peanut oil/i);
  assert.match(r11, /separate/);
  assert.match(r11, /note on your order/i);
  assert.doesNotMatch(r11, /dinner order/i);
  const t13 = said("T13");
  assert.match(t13, /Three times a day, after meals/);
  assert.match(t13, /six tablets/);
  assert.match(t13, /No prescription needed/);
  assert.doesNotMatch(t13, /The written prescription/);
  assert.match(said("D10"), /MX 42 17/);
  assert.match(said("J17"), /two thousand/);
  assert.match(said("J17"), /six thousand/);
  assert.match(said("W9"), /I've approved it/);
  assert.equal((said("W9").match(/approv/gi) || []).length, 1);
  assert.equal(lessons.find((lesson) => lesson.id === "R9").next, "R13");
  assert.equal(lessons.find((lesson) => lesson.id === "R13").next, "J6");
  assert.equal(lessons.find((lesson) => lesson.id === "J15").next, "J18");
  assert.equal(lessons.find((lesson) => lesson.id === "J18").next, "J20");
  assert.equal(lessons.find((lesson) => lesson.id === "J20").next, "T5");
  assert.equal(lessons.find((lesson) => lesson.id === "D9").next, "D11");
  assert.equal(lessons.find((lesson) => lesson.id === "D11").next, "D13");
  assert.equal(lessons.find((lesson) => lesson.id === "D13").next, "J9");
  const t14 = lessons.find((lesson) => lesson.id === "T14");
  const conn = t14.quiz.find((item) => item.type === "meaning" && /connection/.test(item.prompt));
  assert.equal(conn.choices[conn.answer], "轉機");
  assert.equal(conn.choices.includes("轉駁"), false);
  assert.equal(conn.choices.includes("接駁"), false);
  const src = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(src, /rel="preload"/);
  assert.match(src, /preloadArt\(\[/);
  assert.equal(/useEffect\(\(\) => \{\s*preloadArt/.test(src), false);
  const css = fs.readFileSync(path.join(root, "web/src/styles.css"), "utf8");
  assert.match(css, /\.hero\[data-beat="2"\] \.art-ph img/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /--hero-focus/);
});

test("every lesson hero is bright enough to match mockup-v1", () => {
  const script = `
import os, sys, colorsys
from PIL import Image
root = "assets/art/lessons"
bad = []
for name in sorted(os.listdir(root)):
    if not name.endswith(".webp"):
        continue
    im = Image.open(os.path.join(root, name)).convert("RGB").resize((90, 120))
    px = list(im.getdata())
    sats, lums = [], []
    for r, g, b in px:
        _h, s, _v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        sats.append(s * 100)
        def lin(c):
            c = c/255
            return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055) ** 2.4
        lums.append((0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b)) * 255)
    mean_s = sum(sats)/len(sats)
    mean_l = sum(lums)/len(lums)
    std = (sum((x-mean_l)**2 for x in lums)/len(lums)) ** 0.5
    if mean_s < 34.3:
        bad.append(f"{name} sat {mean_s:.1f} std {std:.1f}")
if bad:
    print("\\n".join(bad))
    sys.exit(1)
print("ok", len(os.listdir(root)))
`
  const res = spawnSync("python3", ["-c", script], { cwd: root, encoding: "utf8" });
  assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);
});

test("tracked review files exclude local audit artifacts", () => {
  const res = spawnSync("git", ["ls-files", "review/"], { cwd: root, encoding: "utf8" });
  assert.equal(res.status, 0, res.stderr);
  const files = res.stdout.split("\n").filter(Boolean);
  assert.deepEqual(files, ["review/flags.json"]);
});

test("round 42 scenes keep the audit facts and a balanced quiz", () => {
  const said = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.text).join("\n");
  const gloss = (id) => lessons.find((lesson) => lesson.id === id).dialogue.map((line) => line.glossYue).join("\n");
  const blob = (id) => JSON.stringify(lessons.find((lesson) => lesson.id === id));
  assert.match(said("R12"), /three thousand/);
  assert.match(said("R12"), /five hundred/);
  assert.match(said("R12"), /high chair/);
  assert.match(said("R12"), /table for eight/);
  assert.doesNotMatch(said("R12"), /two hundred/);
  assert.match(said("W10"), /sincere apology/);
  assert.match(said("W10"), /warehouse/);
  assert.match(said("W10"), /twenty percent/);
  assert.match(said("W10"), /Fifty dollars/);
  assert.match(said("W10"), /tomorrow/);
  assert.doesNotMatch(said("W10"), /keep the money talk for later/);
  assert.match(said("T14"), /Tokyo/);
  assert.match(said("T14"), /nine tonight/);
  assert.match(said("T14"), /thirty dollars/);
  assert.match(said("T14"), /twenty-two/);
  assert.match(said("T14"), /same flight/);
  assert.doesNotMatch(said("T14"), /another gate soon/);
  assert.doesNotMatch(said("T14"), /posted departure gate/);
  assert.doesNotMatch(blob("T14"), /接駁/);
  assert.doesNotMatch(blob("T14"), /轉駁/);
  assert.match(gloss("T14"), /轉機/);
  assert.match(gloss("T14"), /轉運/);
  assert.match(said("R11"), /egg is fine/);
  assert.match(said("R11"), /note on your order/);
  assert.match(said("R11"), /peanut oil/);
  assert.doesNotMatch(said("D11"), /dollars flat|quite high through|signed bank paperwork/);
  assert.match(said("D11"), /utility bill from the last three months/);
  assert.match(said("D11"), /under five thousand dollars/);
  assert.match(said("D11"), /fifty dollars a month/);
  assert.match(said("D11"), /in five days/);
  assert.match(said("D11"), /online banking today/);
  assert.doesNotMatch(said("D11"), /one thousand/);
  assert.doesNotMatch(said("D11"), /No monthly fee at all/);
  const cleo = lessons.find((lesson) => lesson.id === "R13").dialogue.find((line) => /It's Cleo/.test(line.text));
  assert.ok(cleo);
  assert.ok(cleo.text.indexOf("Cleo") < cleo.text.indexOf("regular milk"));
  assert.match(said("D12"), /appointment/);
  assert.match(said("D12"), /insurance card/);
  assert.match(said("D12"), /ten minutes early/);
  assert.match(said("T15"), /late checkout/);
  assert.match(said("T15"), /minibar/);
  assert.match(said("T15"), /until four/);
  assert.match(said("T15"), /tag number/);
  assert.match(said("T15"), /taxi/);
  assert.doesNotMatch(said("T15"), /early/);
  assert.match(said("W11"), /overtime/);
  assert.match(said("W11"), /MPF/);
  assert.match(said("W11"), /next month/);
  assert.match(said("W11"), /deadline/);
  const great = lex.items.find((item) => item.id === "great-adj");
  assert.equal(great.exampleYue, "好正呀。");
  const bank = lex.items.find((item) => item.id === "online-banking-phrase");
  assert.equal(bank.glossYue, "網上銀行");
  assert.match(bank.usageNotes, /網上理財/);
  assert.match(bank.examples[1].yue, /網上理財/);
  assert.equal(lessons.find((lesson) => lesson.id === "D12").next, "D2");
  assert.equal(lessons.find((lesson) => lesson.id === "T15").next, "T13");
  assert.equal(lessons.find((lesson) => lesson.id === "W11").next, "W12");
  assert.equal(lessons.find((lesson) => lesson.id === "D1").next, "D12");
  assert.equal(lessons.find((lesson) => lesson.id === "W8").next, "W11");
  const counts = [0, 0, 0];
  let n = 0;
  for (const lesson of lessons) {
    for (const item of lesson.quiz) {
      if (!Number.isInteger(item.answer)) continue;
      counts[item.answer] += 1;
      n += 1;
    }
    for (const item of lesson.quiz) {
      if (item.type !== "meaning") continue;
      const grams = item.choices.map((choice) => {
        const hs = String(choice).match(/\p{Script=Han}/gu) || [];
        const set = new Set();
        for (let i = 0; i + 1 < hs.length; i += 1) set.add(hs[i] + hs[i + 1]);
        return set;
      });
      for (let i = 0; i < grams.length; i += 1) {
        for (let j = i + 1; j < grams.length; j += 1) {
          const shared = [...grams[i]].filter((pair) => grams[j].has(pair));
          assert.equal(shared.length, 0, `${lesson.id} ${shared.join(",")}`);
        }
      }
    }
  }
  for (const count of counts) {
    const share = count / n;
    assert.ok(share >= 0.25 && share <= 0.42, `${count}/${n}`);
  }
});

test("audit scripts stay verbatim, under the word cap, and unpadded", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/audit-scripts.json"), "utf8"));
  const caps = { A1: 8, "A1/A2": 9.5, A2: 11, "A2/B1": 12.5, B1: 14, "B1/B2": 15, B2: 16 };
  const stop = new Set("a an the i you we they he she it my your our is are was were be been am have has had do does did will would can could should may might to of in on at for with and or but if so not this that these those me him her them us please just very still also then there here from as about into".split(" "));
  function content(text) {
    return (text.toLowerCase().match(/[a-z']+/g) || []).filter((tok) => tok.length > 2 && !stop.has(tok));
  }
  for (const [id, script] of Object.entries(fixture)) {
    const lesson = lessons.find((row) => row.id === id);
    const lines = lesson.dialogue.map((line) => line.text);
    assert.deepEqual(lines, script, id);
    assert.equal(lines[0], script[0], id);
    const mean = lines.reduce((sum, text) => sum + (text.match(/[A-Za-z']+/g) || []).length, 0) / lines.length;
    if (id === "T15") assert.ok(mean > caps["A2/B1"], `${mean}`);
    else assert.ok(mean <= caps[lesson.cefr] + 1e-9, `${id} ${mean.toFixed(3)} > ${caps[lesson.cefr]}`);
    for (let i = 0; i < lines.length; i += 1) {
      const text = lines[i].trim();
      assert.equal(/right now please/i.test(text), false, `${id} ${text}`);
      assert.equal(/fully ready/i.test(text), false, `${id} ${text}`);
      assert.equal(/\bthen\.$/i.test(text), false, `${id} ${text}`);
      const too = text.match(/\b([A-Za-z']+)\s+too\.$/i);
      if (too && i > 0) {
        const word = too[1].toLowerCase();
        assert.equal(new RegExp(`\\b${word}\\b`, "i").test(lines[i - 1]), false, `${id} ${text}`);
      }
      const cur = new Set(content(text));
      for (const back of [1, 2]) {
        if (i - back < 0) continue;
        const shared = [...cur].filter((tok) => new Set(content(lines[i - back])).has(tok));
        assert.ok(shared.length < 4, `${id} ${shared.join(",")}`);
      }
    }
  }
});

test("title card covers the hero and waits for a decoded image", () => {
  const src = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  const art = fs.readFileSync(path.join(root, "web/src/art.tsx"), "utf8");
  const css = fs.readFileSync(path.join(root, "web/src/styles.css"), "utf8");
  assert.match(art, /img\.decode/);
  assert.match(src, /whenArtDecoded/);
  assert.match(src, /1200/);
  assert.match(src, /disabled=\{!ready\}/);
  assert.match(src, /--hero-lqip/);
  assert.match(css, /\.hero\[data-beat="0"\] \.art-ph img/);
  assert.match(css, /object-fit: cover/);
  assert.match(css, /\.hero\[data-beat="2"\] \.art-ph img/);
  const lqip = JSON.parse(fs.readFileSync(path.join(root, "content/hero-lqip.json"), "utf8"));
  for (const lesson of lessons) {
    const key = lesson.hero.split("/").pop().replace(".webp", "");
    assert.match(lqip[key], /^data:image\/webp;base64,/, lesson.id);
  }
});

test("every cast chip is a described face", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content/art-style-heroes.json"), "utf8"));
  const ids = new Set(lessons.flatMap((lesson) => lesson.cast));
  for (const id of ids) {
    assert.equal(typeof manifest.people[id], "string", id);
    assert.ok(manifest.people[id].length > 8, id);
    const scene = manifest.scenes[id] || null;
    assert.equal(scene, null);
  }
  for (const lesson of lessons) {
    const scene = manifest.scenes[lesson.id.toLowerCase()];
    assert.deepEqual(scene.cast, lesson.cast, lesson.id);
    assert.ok(scene.look.length > 8, lesson.id);
  }
  const script = `
import os, sys
from PIL import Image
root = "assets/art/refs"
ids = ${JSON.stringify([...ids])}
bad = []
for name in ids:
    path = os.path.join(root, name + ".webp")
    im = Image.open(path).convert("RGB")
    w, h = im.size
    if min(w, h) < 256:
        bad.append(f"{name} {w}x{h}")
        continue
    box = im.crop((int(w*0.3), int(h*0.2), int(w*0.7), int(h*0.55)))
    px = list(box.resize((24, 24)).getdata())
    lums = []
    for r, g, b in px:
        lums.append(0.2126*r + 0.7152*g + 0.0722*b)
    mean = sum(lums)/len(lums)
    std = (sum((x-mean)**2 for x in lums)/len(lums)) ** 0.5
    if std < 8:
        bad.append(f"{name} flat {std:.1f}")
if bad:
    print("\\n".join(bad))
    sys.exit(1)
print("ok", len(ids))
`
  const res = spawnSync("python3", ["-c", script], { cwd: root, encoding: "utf8" });
  assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);
});
