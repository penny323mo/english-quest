import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';

test('sentence repairs preserve complete pairs, baseline identity and both recognizer vetoes', () => {
  const checks = JSON.parse(execFileSync('python3', ['tests/helpers/sentence_repair.py'], { encoding: 'utf8' }));
  assert.ok(Object.keys(checks).length >= 20);
  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);
});

test('pronunciation compute is read-only, bounded, and cannot deploy', () => {
  const source = fs.readFileSync('.github/workflows/pronunciation-followup.yml', 'utf8');
  assert.match(source, /contents: read/);
  assert.match(source, /persist-credentials: false/);
  assert.match(source, /timeout-minutes: 45/);
  assert.match(source, /branches: \[codex\/pronunciation-followup\]/);
  assert.doesNotMatch(source, /secrets\.|pull_request_target|git push|deploy-pages|contents: write|id-token: write/);
  assert.match(source, /test "\$SELECT_OUTCOME" = success/);
  assert.match(source, /test "\$OFFICIAL_OUTCOME" = success/);
  assert.match(source, /test "\$SOURCE_OUTCOME" = success/);
});
