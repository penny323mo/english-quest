import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

test('all 753 visible cards have word audio; the three dictionary recordings retain their provenance', () => {
  const words = read('content/word-audio.json').items;
  const cards = read('content/lexicon.json').items.filter(x => !x.hidden);
  assert.equal(cards.length, 753);
  assert.deepEqual(Object.keys(words).sort(), cards.map(x => x.id).sort());
  assert.deepEqual(read('content/word-audio-skip.json').ids, []);
  const records = read('content/word-audio-recordings.json').items;
  assert.deepEqual(Object.keys(records).sort(), ['a-art','fee-noun','led-verb']);
  for (const [id, row] of Object.entries(records)) {
    assert.equal(words[id].recording, 'wikimedia-commons');
    assert.equal(words[id].say, row.say);
    assert.equal(row.author, 'Dvortygirl');
    assert.equal(row.license, 'CC BY-SA 3.0');
    assert.ok(row.entryUrl.startsWith('https://en.wiktionary.org/wiki/'));
    assert.equal(createHash('sha256').update(fs.readFileSync(row.source)).digest('hex'), row.sourceSha256);
    for (const [speed,key] of [['normal','audio'],['slow','audioSlow']]) assert.equal(createHash('sha256').update(fs.readFileSync(words[id][key])).digest('hex'), row.sha256[speed]);
  }
  const credits = fs.readFileSync('web/src/pages.tsx','utf8');
  for (const row of Object.values(records)) assert.ok(credits.includes(row.sourceUrl));
});

test('source verification rejects substituted, mistimed and silent recordings, including forged output hashes', () => {
  const checks = JSON.parse(execFileSync('python3', ['tests/helpers/word_recordings.py'], {encoding:'utf8'}));
  assert.equal(Object.keys(checks).length, 10);
  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);
});
