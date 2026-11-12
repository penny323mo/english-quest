import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../web/src/Lesson.tsx', import.meta.url), 'utf8');
const recap = source.slice(source.indexOf('function Recap('), source.indexOf('function NextBeat('));
const next = source.slice(source.indexOf('function NextBeat('));

test('a lesson recap identifies can-do statements as goals, not proven mastery', () => {
  assert.match(recap, /今課練習目標/);
  assert.match(recap, /完成課堂流程唔代表口語同發音已達標/);
});

test('the end of a goal track does not claim completion of the whole curriculum', () => {
  assert.doesNotMatch(next, /九十七課|97\s*課|全部課.*行完/);
  assert.match(next, /呢條學習路徑暫時冇下一課/);
  assert.match(next, /返路徑揀其他課/);
});
