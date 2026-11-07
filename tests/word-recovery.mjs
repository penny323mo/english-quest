import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));

test('the 114-card recovery audit names the exact playable files and keeps unresolved cards out', () => {
  const report = read('review/word-audio-selection.json');
  const words = read('content/word-audio.json').items;
  const skipped = read('content/word-audio-skip.json').ids;
  assert.equal(new Set(report.cards.map(r => r.id)).size, report.initiallyMissing);
  assert.equal(report.cards.length, 114);
  assert.equal(report.recovered, report.cards.filter(r => r.accepted).length);
  assert.deepEqual(report.remaining, skipped);
  for (const row of report.cards) {
    if (!row.accepted) {
      assert.ok(skipped.includes(row.id), row.id);
      assert.equal(words[row.id], undefined, row.id);
      continue;
    }
    assert.ok(!skipped.includes(row.id), row.id);
    assert.equal(row.say, words[row.id].say, row.id);
    for (const [speed, field] of [['normal', 'audio'], ['slow', 'audioSlow']]) {
      const clip = row[speed];
      const digest = createHash('sha256').update(fs.readFileSync(words[row.id][field])).digest('hex');
      assert.equal(clip.sha256, digest, `${row.id} ${speed}`);
      assert.equal(clip.speaker, words[row.id].speaker ?? 0, row.id);
      assert.equal(clip.whisper.length, 6, row.id);
      assert.equal(clip.accepted, true, row.id);
    }
  }
  // Re-evaluate all saved transcripts against the actual gate and current homophones.
  const code = `import json,sys
sys.path.insert(0,'scripts')
from word_take_gate import judge_take
from check_audio_asr import homophones,alternates
report=json.load(open('review/word-audio-selection.json')); table=homophones()
for row in report['cards']:
 if row['accepted']:
  for speed in ['normal','slow']:
   clip=row[speed]
   result=judge_take(row['lemma'],clip['whisper'],clip['parakeet'],alternates(row['lemma'],row['id'],table))
   assert result['accepted'] and result['verdict']==clip['verdict'],(row['id'],speed,result)
print('ok')`;
  assert.equal(execFileSync('python3', ['-c', code], { encoding: 'utf8' }).trim(), 'ok');
});
