import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const read = file => JSON.parse(readFileSync(new URL("../content/" + file, import.meta.url)));
const lessons = readdirSync(new URL("../content/lessons/", import.meta.url)).map(file => read("lessons/" + file));
const lines = new Map(read("lines.json").map(line => [line.audio, line]));

test("each visible card has at least two distinct playable examples of its sense", () => {
  const missing = read("lexicon.json").items.filter(card => !card.hidden && (
    new Set((card.examples || []).filter(e => e.audio && e.audioSlow && e.yue).map(e => e.en.toLowerCase())).size < 2
  ));
  assert.deepEqual(missing.map(card => card.id), []);
});

test("every live B2 lesson includes two recorded voices and a separate unscripted follow-up", () => {
  const advanced = lessons.filter(lesson => lesson.cefr === "B2" && !lesson.hidden);
  assert.equal(advanced.length, 5);
  for (const lesson of advanced) {
    assert.ok(lesson.dialogue.length >= 10 && lesson.dialogue.length <= 16, lesson.id);
    assert.ok(new Set(lesson.dialogue.map(line => lines.get(line.audio).kokoroSpeaker)).size >= 2, lesson.id);
    const challenge = lines.get(lesson.challenge.audio);
    assert.equal(challenge.text, lesson.challenge.text);
    assert.equal(challenge.audioSlow, lesson.challenge.audioSlow);
    assert.ok(!lesson.dialogue.some(line => line.audio === challenge.audio), lesson.id);
  }
});

test("every role-play partner and model subtitle matches the line attached to its playback button", () => {
  const differences = [];
  for (const lesson of lessons) {
    for (const [index, turn] of lesson.roleplay.turns.entries()) {
      for (const [key, text] of [[turn.audio, turn.line], [turn.modelAudio, turn.expect]]) {
        if (text !== lines.get(key)?.text) differences.push([lesson.id, index + 1, key, text]);
      }
    }
  }
  assert.deepEqual(differences, []);
});

test("foundation contrasts teach vowel quality and the first consonant of the weak form", () => {
  const f1 = read("lessons/f1.json");
  assert.match(f1.sound.note, /ðə/);
  assert.match(f1.sound.note, /舌位/);
  assert.match(read("lessons/t6.json").sound.note, /\/b\/.*\/l\//);
});

test("the pharmacy tasks teach how to ask about instructions and driving", () => {
  for (const id of ["d6", "t13"]) {
    const lesson = read("lessons/" + id + ".json");
    assert.doesNotMatch(JSON.stringify(lesson), /after meals is safer|extra symptom is a drug allergy|won't make you sleepy|six tablets/i);
    assert.match(lesson.dialogue.map(line => line.text).join(" "), /label/);
  }
});
