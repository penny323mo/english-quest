// Word-only clips (每日抽卡 🔊) use their own voice, because the sentence voice garbles
// many isolated words. The voice is recorded once, the homophones the checker accepts
// are reviewed, and the voice is credited (CC BY 4.0 needs attribution).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const words = JSON.parse(read("content/word-audio.json"));
const lex = JSON.parse(read("content/lexicon.json")).items.filter((i) => !i.hidden);
const homophones = JSON.parse(read("tests/fixtures/word-homophones.json"));

test("the word voice is recorded in word-audio.json and matches the renderer", () => {
  assert.deepEqual(words.voice, { engine: "kokoro", model: "kokoro-en-v0_19", speaker: 0 });
  const py = read("scripts/render_audio.py");
  assert.match(py, /WORD_VOICE = \{"engine": "kokoro", "model": "kokoro-en-v0_19", "speaker": 0\}/);
  assert.match(read("scripts/check_audio_asr.py"), /WORD_ASR = "small\.en"/);
});

test("homophones are reviewed entries for real cards, never a heteronym's other reading", () => {
  const lemmas = new Set(lex.map((i) => i.lemma.toLowerCase()));
  const ids = new Set(lex.map((i) => i.id));
  for (const [lemma, alts] of Object.entries(homophones.words)) {
    assert.ok(lemmas.has(lemma), `${lemma} is a lemma in the deck`);
    assert.ok(alts.length && !alts.includes(lemma), `${lemma} lists other spellings`);
    // A lemma shared by cards read two ways (read, bass, live) cannot have one list for all.
    const cards = lex.filter((i) => i.lemma.toLowerCase() === lemma);
    const phonemeCards = cards.filter((i) => /\[\[/.test(words.items[i.id]?.say || ""));
    assert.equal(phonemeCards.length, 0, `${lemma} has a [[phonemes]] reading: list it under cards instead`);
  }
  for (const id of Object.keys(homophones.cards || {})) assert.ok(ids.has(id), `${id} is a card`);
  assert.equal(homophones.words.read, undefined, "read (present) is not a homophone of red");
});

test("the attributions page credits the word voice and its licence", () => {
  const page = read("web/src/pages.tsx");
  assert.match(page, /Kokoro v0\.19/);
  assert.match(page, /Apache-2\.0/);
  assert.doesNotMatch(page, /libritts|LibriTTS-R/, "no Lessac-derived voice is credited, so none is used");
  assert.doesNotMatch(page, /冇用[^。<]*Kokoro/, "the page must not say Kokoro is unused while crediting it");
});

test("no word voice is fine-tuned from the research-only Lessac data", () => {
  // Every Piper voice that reads lone words well (lessac, libritts_r, amy, joe, sam,
  // arctic, hfc_*) is trained on or fine-tuned from Lessac (Blizzard 2013): research use only.
  const lessac = /lessac|libritts|amy|joe|sam-medium|arctic|hfc_/i;
  assert.doesNotMatch(JSON.stringify(words.voice), lessac);
  assert.doesNotMatch(read(".github/workflows/audio-asr.yml"), /vits-piper-en_US-(lessac|libritts|amy|joe|sam|arctic|hfc)/);
});
