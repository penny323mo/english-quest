import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const ids = new Set(lex.items.map((item) => item.id));
const shipped = ["f1", "f2", "j1", "j2", "t1", "r1"];
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

test("six lessons each carry the 12-beat payload", () => {
  assert.equal(lessons.length, 6);
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
  assert.equal(fs.existsSync(path.join(root, "content/lessons/f3.json")), false);
  assert.equal(fs.existsSync(path.join(root, "content/lessons/j3.json")), false);
  const pathFile = JSON.parse(fs.readFileSync(path.join(root, "content/path.json"), "utf8"));
  const soon = pathFile.units.flatMap((unit) => unit.lessons).filter((lesson) => lesson.soon);
  assert.ok(soon.length >= 9);
  for (const lesson of soon) {
    assert.equal(fs.existsSync(path.join(root, "content/lessons", `${lesson.id.toLowerCase()}.json`)), false);
  }
});

test("the app has a mic fallback and does not phone home", () => {
  const lesson = fs.readFileSync(path.join(root, "web/src/Lesson.tsx"), "utf8");
  assert.match(lesson, /MediaRecorder/);
  assert.match(lesson, /webkitSpeechRecognition|getRecognizer/);
  assert.match(lesson, /呢課唔會卡住/);
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
  const hashedJs = entries.filter((entry) => /assets\/index-[A-Za-z0-9_]{8}\.js$/.test(entry[1]));
  assert.equal(hashedJs.length, 1);
  assert.equal(hashedJs[0][2], "null");
});
