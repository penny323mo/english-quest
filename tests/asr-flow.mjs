// The real decision flow of scripts/check_audio_asr.py (main(): argument parsing, clip
// selection, judging, the known list and --json), run on scripted recogniser output
// through tests/helpers/asr_flow.py. Review of #39:
// - Parakeet has the last word when Whisper only repeats a word: if Parakeet rejects
//   the clip or is unavailable, no acoustic fallback may pass it;
// - every clip is counted in exactly one way (Whisper, Parakeet, acoustic, waived,
//   failed), and --json is written even when everything passes.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function flow(spec) {
  const out = execFileSync("python3", ["tests/helpers/asr_flow.py"], { cwd: root, input: JSON.stringify(spec), encoding: "utf8" });
  return JSON.parse(out.trim().split("\n").at(-1));
}
const FLOOR = "assets/audio/words/floor-noun-word.mp3";
const TOWEL = "assets/audio/words/towel-noun-word.mp3";
const CLOSE = "assets/audio/words/close-adj-word.mp3";
const PEARL = "assets/audio/words/pearl-noun-word.mp3";
const SENTENCE = "assets/audio/words/gold-noun.mp3"; // a sentence clip, judged by base.en
const row = (result, rel) => result.json.results.find((r) => r.rel === rel);

test("Whisper repeats the word, Parakeet hears another word, sound is close: fails", () => {
  const r = flow({ only: [FLOOR], heard: { [FLOOR]: { whisper: "Floor Floor", parakeet: "flaw", fresh: ["Floor", 0.5] } } });
  assert.equal(r.exit, 1, r.stdout);
  assert.equal(row(r, FLOOR).verdict, "failed");
  assert.equal(r.json.summary.failed, 1);
  assert.equal(r.json.summary.acoustic, 0, "no acoustic fallback after Parakeet rejects");
});

test("Whisper repeats the word, Parakeet hears it once: passes, counted under Parakeet", () => {
  const r = flow({ only: [FLOOR], heard: { [FLOOR]: { whisper: "Floor Floor", parakeet: "Floor", fresh: ["Floor", 0.5] } } });
  assert.equal(r.exit, 0, r.stdout);
  assert.equal(row(r, FLOOR).verdict, "parakeet");
  assert.deepEqual(r.json.summary, { total: 1, whisper: 0, parakeet: 1, dictionary: 0, acoustic: 0, waived: 0, failed: 0 });
  assert.deepEqual(r.json.parakeet, [{ rel: FLOOR, text: "floor", whisper: "Floor Floor", parakeet: "Floor", verdict: "parakeet" }]);
  assert.match(r.stdout, /Parakeet ruled on 1/);
});

test("Whisper repeats the word, Parakeet repeats it too, or Parakeet is missing: fails", () => {
  const twice = flow({ only: [FLOOR], heard: { [FLOOR]: { whisper: "Floor Floor", parakeet: "floor floor", fresh: ["Floor", 0.5] } } });
  assert.equal(twice.exit, 1, twice.stdout);
  assert.equal(row(twice, FLOOR).verdict, "failed");
  const missing = flow({ only: [FLOOR], parakeet: false, heard: { [FLOOR]: { whisper: "Floor Floor", parakeet: null, fresh: ["Floor", 0.5] } } });
  assert.equal(missing.exit, 1, missing.stdout);
  assert.equal(row(missing, FLOOR).verdict, "failed");
  assert.equal(missing.json.parakeet[0].verdict, "failed");
  assert.equal(missing.json.parakeet[0].parakeet, null);
});

test("everything heard right straight away still writes the full --json", () => {
  const r = flow({
    only: [FLOOR, TOWEL, SENTENCE],
    heard: {
      [FLOOR]: { whisper: "Floor", parakeet: null, fresh: ["", 9] },
      [TOWEL]: { whisper: "Towel.", parakeet: null, fresh: ["", 9] },
      [SENTENCE]: { whisper: "This gold is authentic.", parakeet: null, fresh: ["", 9] },
    },
  });
  assert.equal(r.exit, 0, r.stdout);
  assert.ok(r.json, "--json written although nothing needed a fresh render");
  assert.deepEqual(r.json.summary, { total: 3, whisper: 3, parakeet: 0, dictionary: 0, acoustic: 0, waived: 0, failed: 0 });
  assert.deepEqual(r.json.parakeet, []);
  assert.equal(r.json.results.length, 3);
});

test("each clip is counted once; sentence fallback and the known list still work", () => {
  const r = flow({
    only: [FLOOR, TOWEL, CLOSE, PEARL, SENTENCE],
    known: { [PEARL]: "ear check" },
    heard: {
      [FLOOR]: { whisper: "Floor", parakeet: null, fresh: ["", 9] }, // Whisper
      [TOWEL]: { whisper: "Towel Towel", parakeet: "Towel", fresh: ["Towel", 0.4] }, // Parakeet
      [CLOSE]: { whisper: "Clothes", parakeet: null, fresh: ["Close", 0.45] }, // acoustic (not a repeat)
      [PEARL]: { whisper: "Purple", parakeet: null, fresh: ["Pearl", 1.4] }, // fails, but known: waived
      [SENTENCE]: { whisper: "This cold is authentic.", parakeet: null, fresh: ["This gold is authentic.", 1.2] }, // sentence fallback
    },
  });
  const s = r.json.summary;
  assert.deepEqual(s, { total: 5, whisper: 1, parakeet: 1, dictionary: 0, acoustic: 2, waived: 1, failed: 0 });
  assert.equal(s.whisper + s.parakeet + s.acoustic + s.waived + s.failed, s.total);
  assert.equal(r.exit, 0, r.stdout);
  assert.equal(row(r, CLOSE).verdict, "acoustic");
  assert.equal(row(r, SENTENCE).verdict, "acoustic");
  assert.equal(row(r, PEARL).verdict, "waived");
  for (const line of ["heard by Whisper straight away: 1", "Parakeet ruled on 1", "acoustic fallback: 2", "waived (known): 1", "failed: 0"]) {
    assert.match(r.stdout, new RegExp(line.replace(/[()]/g, "\\$&")));
  }
});

test("a failing sentence and a failing word both fail the run", () => {
  const r = flow({
    only: [CLOSE, SENTENCE],
    heard: {
      [CLOSE]: { whisper: "Clothes", parakeet: null, fresh: ["Close", 0.9] },
      [SENTENCE]: { whisper: "Something else entirely.", parakeet: null, fresh: ["This gold is authentic.", 2.4] },
    },
  });
  assert.equal(r.exit, 1);
  assert.deepEqual(r.json.summary, { total: 2, whisper: 0, parakeet: 0, dictionary: 0, acoustic: 0, waived: 0, failed: 2 });
});
