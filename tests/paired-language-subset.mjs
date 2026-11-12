import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../content/${n}.json`,import.meta.url)));
const lesson=id=>read(`lessons/${id}`);
const lines=new Map(read('lines').map(x=>[x.id,x]));
const lex=new Map(read('lexicon').items.map(x=>[x.id,x]));
test('J4 answers origin separately from certification in the recorded response',()=>{
 const l=lesson('j4'),line=l.dialogue.find(x=>x.id==='j4-l3');
 assert.match(line.text,/natural diamond/);
 assert.match(line.text,/certified/);
 const t=l.roleplay.turns.find(x=>x.modelAudio===line.audio);
 assert.equal(t.expect,line.text);
 assert.ok(t.keywords.includes('natural') && t.keywords.includes('certified'));
});
test('J12 offers usable hours and an address follow-up, not information on an unseen door',()=>{
 const line=lesson('j12').dialogue.find(x=>x.id==='j12-l6');
 assert.equal(line.text,"We're open from ten to six. I'll text you our address.");
 assert.doesNotMatch(line.glossYue,/門上面|街市旁邊/);
});
test('J14 does not turn an agreed deposit into half that deposit',()=>{
 const l=lesson('j14'),line=l.dialogue.find(x=>x.id==='j14-l7');
 assert.equal(line.text,'I can pay the deposit this week.');
 assert.doesNotMatch(JSON.stringify(l.chunks),/half the deposit/);
});
test('after-meals label reading and investment example avoid general safety or value guarantees',()=>{
 const after=lex.get('after-meals-phrase').examples[1],investment=lex.get('investment-noun').examples[2];
 assert.equal(after.en,'The label says to take this medicine after meals.');
 assert.doesNotMatch(after.yue,/安全啲/);
 assert.match(investment.en,/value may fall/);
 assert.match(investment.yue,/價值可能會跌/);
 for(const id of ['j4','j12','j14'])for(const row of lesson(id).dialogue)for(const key of ['text','say','glossYue'])assert.equal(row[key],lines.get(row.id)[key],`${row.id} ${key}`);
});
