import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const ids = new Set(lex.items.map((item) => item.id));
const shipped = ["f1", "f2", "f3", "f4", "j1", "j2", "j3", "j4", "j5", "j6", "j7", "t1", "t2", "t3", "r1", "r2", "r3"];
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

test("seventeen lessons each carry the 12-beat payload", () => {
  assert.equal(lessons.length, 17);
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
  assert.equal(t1.next, "J3");
  assert.equal(t2.next, "R2");
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
  assert.equal(j7.next, null);
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
  assert.equal(r1.next, "J2");
  assert.equal(r2.next, "J4");
  assert.equal(r3.next, "J6");
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
  assert.ok(soon.length >= 9);
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
  assert.deepEqual(shippedOnPath, ["F1", "F2", "F3", "F4", "J1", "R1", "J2", "T1", "J3", "T2", "R2", "J4", "J5", "T3", "R3", "J6", "J7"]);
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
  const meanWords = (lesson) => {
    const total = lesson.dialogue.reduce((sum, line) => sum + (line.text.match(wordRe) || []).length, 0);
    return total / lesson.dialogue.length;
  };
  const bandRank = { A1: 1, "A1/A2": 2, A2: 3, "A2/B1": 4, B1: 5, "B1/B2": 6, B2: 7 };
  for (const lesson of lessons) {
    const mean = meanWords(lesson);
    for (const other of lessons) {
      if (bandRank[other.cefr] < bandRank[lesson.cefr]) {
        assert.ok(mean + 1e-9 >= meanWords(other), `${lesson.id} ${mean.toFixed(2)} < ${other.id} ${meanWords(other).toFixed(2)}`);
      }
    }
    const visible = lesson.dialogue.filter((line) => line.glossYue.trim() && !line.hideGloss).length / lesson.dialogue.length;
    for (const line of lesson.dialogue) assert.ok(line.glossYue.trim(), `${lesson.id} ${line.id} gloss`);
    if (lesson.cefr === "A1" || lesson.cefr === "A1/A2") assert.equal(visible, 1, lesson.id);
    if (lesson.cefr === "A2") assert.ok(visible >= 0.5 && visible <= 0.7, `${lesson.id} visible ${visible}`);
    if (lesson.cefr === "A2/B1") assert.ok(visible >= 0.28 && visible <= 0.45, `${lesson.id} visible ${visible}`);
  }
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

test("the app has a mic fallback and does not phone home", () => {
  const lesson = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(lesson, /MediaRecorder/);
  assert.match(lesson, /webkitSpeechRecognition|getRecognizer/);
  assert.match(lesson, /呢課唔會卡住/);
  assert.match(lesson, /改為即時講/);
  assert.match(lesson, />聽我</);
  assert.match(lesson, /咪未開/);
  assert.match(lesson, /呢輪十七課你行完啦/);
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
  assert.match(data, /"F1", "F2", "F3", "F4", "J1", "R1", "J2", "T1", "J3", "T2", "R2", "J4", "J5", "T3", "R3", "J6", "J7"/);
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
