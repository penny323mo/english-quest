import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = id => JSON.parse(fs.readFileSync(new URL(`../content/lessons/${id.toLowerCase()}.json`, import.meta.url)));
test('W10 and J22 meaning questions identify one target word', () => {
 const w = read('W10'), j = read('J22');
 for (const [index, word] of [[2,'apology'],[3,'sincere']]) assert.ok(w.quiz[index].prompt.endsWith(`呢句入面，${word} 係咩意思？`));
 for (const [index,word,meaning] of [[0,'engraving','刻字'],[1,'design proof','設計校對稿'],[2,'wedding','婚禮']]) {
  assert.ok(j.understand[index].prompt.endsWith(`呢句入面，${word} 係咩意思？`));
  assert.equal(j.understand[index].explain, `${word} 係「${meaning}」。`);
 }
 assert.deepEqual(w.quiz.slice(2,4).map(q => q.choices[q.answer]), ['道歉','誠懇']);
 assert.deepEqual(j.understand.map(q=>q.choices[q.answer]), ['刻字','校對稿','婚禮']);
});
test('D3 uses agent prompts and tenant responses with exact existing audio references', () => {
 const d = read('D3');assert.equal(d.roleplay.you,'tom');
 for (const [i,turn] of d.roleplay.turns.entries()) {
  const partner=d.dialogue.find(l=>l.id===`d3-l${2*i+1}`);
  const model=d.dialogue.find(l=>l.id===`d3-l${2*i+2}`);
  assert.equal(turn.partnerId,partner.speaker);
  assert.equal(turn.partner,partner.speakerLabel);
  assert.equal(model.speaker,d.roleplay.you);
  assert.equal(turn.line,partner.text);assert.equal(turn.expect,model.text);
  assert.equal(partner.say,turn.line);assert.equal(model.say,turn.expect);
  assert.equal(turn.audio,partner.audio);assert.equal(turn.audioSlow,partner.audioSlow);
  assert.equal(turn.modelAudio,model.audio);assert.equal(turn.modelSlow,model.audioSlow);
  for (const word of turn.keywords) assert.ok(turn.expect.toLowerCase().includes(word.toLowerCase()));
 }
 assert.deepEqual(d.roleplay.turns[1].keywords,['deposit','rent']);
 assert.deepEqual(d.roleplay.turns[2].keywords,['lease','fee']);
});
test('W1 shadow and first partner text match the existing spoken line', () => {
 const d=read('W1');const line=d.dialogue.find(l=>l.id==='w1-l2');
 assert.equal(d.shadow.lineId,line.id);assert.equal(d.shadow.hint,line.text);
 const turn=d.roleplay.turns[0];assert.equal(turn.line,line.text);
 assert.equal(turn.line,line.say);assert.equal(turn.audio,line.audio);assert.equal(turn.audioSlow,line.audioSlow);
 assert.equal(turn.partnerId,line.speaker);
});
