import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('selection publishes complete matching-voice pairs and preserves both original files on rejection', () => {
  const cases = JSON.parse(execFileSync('python3', ['tests/helpers/word_selection.py'], { encoding: 'utf8' }));
  for (const mode of ['normal_only', 'split_voices', 'fail']) {
    assert.equal(cases[mode].accepted, false, mode);
    assert.equal(cases[mode].unchanged, true, mode);
    assert.deepEqual(cases[mode].skip, ['sample-noun'], mode);
    assert.deepEqual(cases[mode].items, {}, mode);
    assert.deepEqual(cases[mode].voices, {}, mode);
  }
  assert.equal(cases.pass.accepted, true);
  assert.deepEqual(cases.pass.skip, []);
  assert.deepEqual(cases.pass.pair_speakers, [0, 0]);
  assert.deepEqual(cases.pass.voices, {});
  assert.equal(cases.fallback.accepted, true);
  assert.deepEqual(cases.fallback.pair_speakers, [1, 1]);
  assert.deepEqual(cases.fallback.voices, { 'sample-noun': 1 });
  assert.equal(cases.fallback.items['sample-noun'].speaker, 1);
});
