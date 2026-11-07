import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

test("each alternate voice is a US female Kokoro voice and matches the playback manifest", () => {
  const speakers = JSON.parse(fs.readFileSync('content/word-audio-voices.json', 'utf8')).items;
  const words = JSON.parse(fs.readFileSync('content/word-audio.json', 'utf8')).items;
  for (const [id, speaker] of Object.entries(speakers)) {
    assert.ok([1, 3, 4].includes(speaker), id);
    assert.ok(words[id], `${id} must have an accepted pair`);
    assert.equal(words[id].speaker, speaker, id);
  }
  for (const [id, row] of Object.entries(words)) assert.equal(row.speaker ?? 0, speakers[id] ?? 0, id);
});

test("rendering and acoustic references use the card's own speaker for both speeds", () => {
  const code = `import sys, types, json
from pathlib import Path
sys.path.insert(0, 'scripts')
import check_audio_asr as ca
calls = []
r = ca.WordReference.__new__(ca.WordReference)
r.voice = types.SimpleNamespace(synth=lambda *a, **kw: calls.append([a[0], a[2], kw.get('speaker')]))
r.ra = types.SimpleNamespace(to_mp3=lambda *a: None)
r.tmp = Path('/tmp')
r.mp3({'rel':'word.mp3','text':'madam','speaker':4})
r.mp3({'rel':'word-slow.mp3','text':'madam','speaker':4})
r.mp3({'rel':'default.mp3','text':'floor'})
sys.modules['piper'] = types.SimpleNamespace(PiperVoice=type('PiperVoice', (), {}))
sys.modules['piper.config'] = types.SimpleNamespace(SynthesisConfig=lambda **kw: None)
import render_audio as ra
v = ra.WordVoice.__new__(ra.WordVoice)
v.synth = lambda *a: calls.append([a[0], a[2], a[3]])
ra.synth(v, 'madam', Path('/tmp/unused.wav'), 1.35, 4)
print(json.dumps(calls))`;
  assert.deepEqual(JSON.parse(execFileSync('python3', ['-c', code], { encoding: 'utf8' })), [
    ['madam', 1, 4], ['madam', 1.35, 4], ['floor', 1, null], ['madam', 1.35, 4],
  ]);
});

test('changing a card speaker, renderer or model pin schedules the relevant audio for ASR again', () => {
  const result = JSON.parse(execFileSync('python3', ['tests/helpers/word_changed.py'], { encoding: 'utf8' }));
  assert.deepEqual(result, {
    unchanged: [],
    speaker: ['assets/audio/a.mp3'],
    renderer: ['assets/audio/a.mp3', 'assets/audio/b.mp3'],
    model_pins: ['assets/audio/a.mp3', 'assets/audio/b.mp3'],
  });
});
