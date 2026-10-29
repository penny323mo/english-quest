import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const flags = JSON.parse(fs.readFileSync(path.join(root, "review/flags.json"), "utf8"));
const byId = Object.fromEntries(lex.items.map((item) => [item.id, item]));

function read(rel) {
  const file = path.join(root, rel);
  const buf = fs.readFileSync(file);
  assert.ok(buf.length > 400, `${rel} too small`);
  return buf;
}

test("every taught item has IPA, stress, syllables, gloss, sources, and matching audio", () => {
  assert.equal(lex.accent, "en-US");
  assert.equal(lex.license, "CC BY-SA 4.0");
  const audioUse = new Map();
  for (const item of lex.items) {
    assert.equal(item.status, "IPA_OK", item.id);
    assert.notEqual(item.senseMismatch, true, item.id);
    assert.ok(item.ipa.startsWith("/") && item.ipa.endsWith("/"), item.id);
    assert.ok(item.syllables.length >= 1, item.id);
    assert.equal(item.syllables.length, item.syllableIpa.length, item.id);
    assert.equal(typeof item.stress, "number", item.id);
    assert.ok(Number.isInteger(item.stress) && item.stress >= 0 && item.stress <= item.syllables.length, item.id);
    if (item.stress === 0) {
      assert.doesNotMatch(item.arpabet, /(^| )[A-Z]+1( |$)/, item.id);
      assert.doesNotMatch(item.ipa, /ˈ/, item.id);
    }
    assert.ok(item.glossYue && item.glossZh, item.id);
    assert.ok(Array.isArray(item.collocations), item.id);
    assert.ok(item.example, item.id);
    assert.ok(item.sources?.length >= 1, item.id);
    assert.ok(item.verified_at, item.id);
    if (/(^| )[A-Z]+1( |$)/.test(item.arpabet)) assert.match(item.ipa, /ˈ/, item.id);
    const bytes = read(item.audio);
    read(item.audioSlow);
    assert.equal(item.audioSha256, createHash("sha256").update(bytes).digest("hex"), item.id);
    assert.notEqual(item.audio, item.audioSlow, item.id);
    const prev = audioUse.get(item.audio);
    assert.equal(prev, undefined, `${item.id} shares audio with ${prev}`);
    audioUse.set(item.audio, item.id);
  }
});

test("flags are resolved and nothing taught is still IPA_REVIEW", () => {
  assert.match(flags.policy, /not silently|Nothing taught was chosen silently|resolution/i);
  for (const flag of flags.items) {
    assert.equal(flag.resolved, true, flag.id);
    assert.ok(flag.resolution, flag.id);
  }
  assert.equal(lex.items.some((item) => item.status === "IPA_REVIEW"), false);
});

test("heteronym bank keeps sense-specific vowels and audio", () => {
  const pairs = [
    ["read-verb-present", /i/, /aɪ|ɛ/],
    ["read-verb-past", /ɛ/, /aɪ/],
    ["live-verb", /ɪ/, /aɪ/],
    ["live-adj", /aɪ/, null],
    ["bow-noun", /oʊ/, /aʊ/],
    ["bow-verb", /aʊ/, /oʊ/],
    ["wind-noun", /ɪ/, /aɪ/],
    ["wind-verb", /aɪ/, null],
    ["bass-noun-fish", /æ/, /eɪ/],
    ["bass-noun-pitch", /eɪ/, /æ/],
    ["close-verb", /z/, null],
    ["close-adj", /s/, /z/],
  ];
  for (const [id, yes, no] of pairs) {
    assert.ok(byId[id], id);
    assert.match(byId[id].ipa, yes, id);
    if (no) assert.doesNotMatch(byId[id].ipa, no, `${id} ${byId[id].ipa}`);
  }
  assert.doesNotMatch(byId["live-verb"].ipa, /aɪ/);
  assert.doesNotMatch(byId["read-verb-present"].ipa, /ɛ/);
  assert.notEqual(byId["read-verb-present"].audio, byId["read-verb-past"].audio);
  assert.notEqual(byId["close-verb"].audio, byId["close-adj"].audio);
  assert.notEqual(byId["with-prep"].ipa, byId["with-prep-voiceless"].ipa);
  assert.match(byId["with-prep"].ipa, /ð/);
  assert.match(byId["with-prep-voiceless"].ipa, /θ/);
  assert.match(byId["thank-verb"].ipa, /θ/);
  assert.match(byId["check-in-noun"].ipa, /tʃɛk/);
  assert.doesNotMatch(byId["check-in-noun"].ipa, /(?<!t)ʃ/);
  assert.doesNotMatch(byId["check-verb"].ipa, /(?<!t)ʃ/);
  assert.doesNotMatch(byId["table-noun"].ipa, /ɹ/);
  assert.match(byId["again-adv"].ipa, /ɡ/);
  assert.equal(byId["jewellery-noun"].syllables.length, 2);
  assert.equal(byId["a-art"].ipa.includes("eɪ"), false);
  assert.match(byId["a-letter"].ipa, /eɪ/);
  assert.equal(byId["a-letter"].stress, 1);
  assert.equal(byId["the-art"].stress, 0);
  assert.equal(byId["the-art-vowel"].stress, 0);
  assert.equal(byId["a-art"].stress, 0);
  assert.equal(byId["to-prep"].stress, 0);
  assert.equal(byId["to-prep"].ipa, "/tə/");
  assert.equal(byId["our-det"].syllables.join("/"), "our");
  assert.match(byId["our-det"].ipa, /ˈaʊ\.ɚ/);
  assert.doesNotMatch(byId["the-art"].glossYue, /呢個|嗰個/);
  assert.doesNotMatch(byId["the-art"].glossZh, /这|那/);
  assert.equal(byId["the-art"].jyutping, "");
  assert.equal(byId["the-art-vowel"].jyutping, "");
  assert.match(byId["free-adj"].glossYue, /空嘅；仲有位/);
  assert.doesNotMatch(byId["free-adj"].glossYue, /有得揀/);
  assert.match(byId["live-adj"].glossYue, /現場嘅；直播嘅/);
  assert.ok(byId["your-det"].variants.some((v) => v.includes("jɔɹ")));
  const pages = fs.readFileSync(path.join(root, "web/src/pages.tsx"), "utf8");
  assert.match(pages, /弱讀，冇重音/);
});

test("piper say matches the taught jewellery and weak forms", () => {
  const lines = JSON.parse(fs.readFileSync(path.join(root, "content/lines.json"), "utf8"));
  const j1 = lines.find((row) => row.id === "j1-l1");
  assert.ok(j1, "j1-l1");
  const says = [byId["jewellery-noun"].say, byId["jewelry-noun"].say, j1.say, byId["of-course-phrase"].say, byId["table-for-two-phrase"].say, byId["the-art-vowel"].say];
  for (const say of says.slice(0, 3)) assert.match(say, /\[\[dʒˈulɹi\]\]/);
  assert.match(says[3], /\[\[əv kˈɔɹs/);
  assert.match(says[4], /\[\[ə ˈteɪbəl fɚ ˈtu\]\]/);
  assert.equal(byId["the-art-vowel"].example, "The aisle seat is free.");
  assert.match(says[5], /^\[\[ðˈi\]\] aisle seat is free\./);
  const py = "/workspace/nightly/PREP-english-app/.venv/bin/python";
  const script = `
import sys
from pathlib import Path
from piper import PiperVoice
root = Path(${JSON.stringify(root)})
voice = PiperVoice.load(str(root / "PREP" / "voices" / "en_US-ljspeech-medium.onnx"))
voice.config.espeak_voice = "en-us"
for s in sys.argv[1:]:
    print("".join("".join(part) for part in voice.phonemize(s)))
`;
  const res = spawnSync(py, ["-c", script, ...says], { encoding: "utf8" });
  assert.equal(res.status, 0, res.stderr);
  const phones = res.stdout.trim().split("\n");
  assert.equal(phones.length, says.length);
  for (const ph of phones.slice(0, 3)) {
    assert.equal(ph.includes("əl"), false, ph);
    assert.match(ph, /dʒˈulɹi/);
  }
  assert.match(phones[3], /əv kˈɔɹs/);
  assert.doesNotMatch(phones[3], /ʌv/);
  assert.match(phones[4], /ə ˈteɪbəl fɚ ˈtu/);
  assert.doesNotMatch(phones[4], /fɔ/);
  assert.match(phones[5], /ðˈi/);
  assert.equal(phones[5].includes("ðə"), false, phones[5]);
});

test("no Edge or Azure teaching audio is referenced", () => {
  const banned = /edge-tts|speech\.microsoft|msedge|en-US-AriaNeural/i;
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.lstatSync(full);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) walk(full);
      else files.push(full);
    }
  }
  for (const dir of ["content", "web", "scripts", "assets", "public"]) walk(path.join(root, dir));
  for (const file of files) {
    if (path.basename(file).startsWith("edge-")) assert.fail(file);
    if (!/\.(json|mjs|ts|tsx|py|html|css)$/.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    assert.equal(banned.test(text), false, file);
  }
});
