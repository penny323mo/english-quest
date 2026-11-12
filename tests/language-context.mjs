import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const lesson = id => read(`lessons/${id.toLowerCase()}`);
const lex = new Map(read('lexicon').items.map(i => [i.id, i]));
const strings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];

test('sound practice includes playable words with its stated target vowel', () => {
 for (const [id, target, required] of [['W10','eɪ','delayed-adj'], ['R12','aɪ','private-room-phrase'], ['R14','eɪ','cake-noun']]) {
  const sound = lesson(id).sound;
  assert.ok(sound.drill.includes(required), `${id} drill must include ${required}`);
  assert.ok(sound.pairs.some(p => [p.a,p.b].includes(required)), `${id} comparison must include ${required}`);
  assert.ok(lex.get(required).ipa.includes(target), id);
  for (const word of sound.drill) assert.ok(lex.get(word).audio && lex.get(word).audioSlow, word);
 }
});
test('R1 listening question does not put red beside its unqualified read homophone', () => {
 const q = lesson('R1').quiz.find(q => q.lemma === 'red-adj');
 assert.equal(q.choices[q.answer], 'red');
 assert.ok(q.choices.includes('led'));
 assert.ok(!q.choices.includes('read'));
});
test('selected pronunciation models do not label accepted variants as errors', () => {
 assert.doesNotMatch(lesson('J4').sound.note, /唔好讀成 ɔ/);
 assert.doesNotMatch(lesson('J6').sound.note, /唔好讀成 \/kɔst\//);
 assert.doesNotMatch(lex.get('authentic-adj').pitfallsYue, /唔好讀成 ɔ/);
 assert.doesNotMatch(lex.get('cost-noun').pitfallsYue, /唔好讀成 \/kɔst\//);
 assert.doesNotMatch(lex.get('without-prep').pitfallsYue, /唔好讀成有聲 \/ð\//);
 assert.match(lesson('J7').sound.note, /字母 w/);
});
test('jewellery comprehension answers do not invent details from other lines', () => {
 const j13 = lesson('J13'), j14 = lesson('J14');
 assert.equal(j13.understand[0].choices[j13.understand[0].answer], '想訂一批有你標誌嘅禮品');
 assert.equal(j13.understand[1].choices[j13.understand[1].answer], '如果確認稿，問三十件可唔可以平啲');
 assert.equal(j14.understand[0].choices[j14.understand[0].answer], '今個月有個清楚預算訂造戒指');
 assert.doesNotMatch(j14.understand[0].explain, /sketch/);
 assert.doesNotMatch(lesson('J24').canDoYue, /軟銠/);
});
test('translated lines preserve loose ring, retained receipt, shine and waiting time', () => {
 const lines = read('lines');
 for (const [id, text] of [
  ['j5-l6', '而家隻戒指戴喺呢隻手指上有啲鬆。'],
  ['j8-l1', '你有冇留低張收據？走之前我可唔可以講下保養？'],
  ['j8-l6', '我喺屋企唔用刺激化學劑。如果光澤維持唔到，我就再嚟。'],
  ['t12-l5', '等房間嗰陣，我可以用咩無線網絡密碼？'],
 ]) {
  assert.equal(lines.find(x => x.id === id).glossYue, text, `${id} lines`);
  assert.equal(lesson(id.split('-')[0]).dialogue.find(x => x.id === id).glossYue, text, `${id} lesson`);
 }
 assert.equal(lex.get('lift-noun').exampleYue, '搭左邊嗰部升降機。');
});
test('D1, T9, R7 and W4 chunks retain the lesson facts', () => {
 for (const [id, indices] of [['D1',[0,1,2]], ['T9',[0]], ['R7',[0,2]], ['W4',[0,1,2]]]) {
  for (const index of indices) {const c = lesson(id).chunks[index]; assert.equal(c.pattern.replace('___',c.answer),c.example, `${id} chunk ${index+1}`);}
 }
 assert.doesNotMatch(lesson('D1').chunks[2].pattern, /for you there/);
 assert.doesNotMatch(lesson('T9').chunks[0].example, /missed/);
 assert.doesNotMatch(lesson('R7').chunks[0].pattern, /Ana/);
 assert.doesNotMatch(strings(lesson('W4').understand).join(' '), /咖啡店/);
});
test('open fill-in questions avoid valid synonym distractors', () => {
 assert.deepEqual(lesson('D12').chunks[1].choices, ['appointment','symptom','insurance']);
 assert.deepEqual(lesson('D14').chunks[0].choices, ['parcel','fee','damage']);
});
test('shellfish and mild translations preserve the relevant scope', () => {
 assert.equal(lex.get('shellfish-noun').glossYue, '貝類及甲殼類海鮮');
 assert.equal(lex.get('mild-adj').glossYue, '唔太辣');
 const q=lesson('R15').quiz.find(q => q.type==='meaning' && q.choices.includes('貝類及甲殼類海鮮'));
 assert.ok(q); assert.equal(q.choices[q.answer], '貝類及甲殼類海鮮');
 assert.doesNotMatch(lesson('R15').chunks[2].pattern, /shellfish, so/);
 assert.equal(lesson('R15').build[1].answer.join(' '), lesson('R15').dialogue[5].text);
 assert.equal(lesson('R15').dialogue[5].glossYue, '蝦湯有甲殼類海鮮。呢隻係乾淨碟。');
 assert.doesNotMatch(strings(lesson('R16')).join(' '), /唔辣|廚房而家出/);
});
test('investment translates the word without promising that value is preserved', () => {
 const item=lex.get('investment-noun');
 assert.equal(item.glossYue, '投資');
 assert.equal(read('sense-labels').sense[`${item.pos}:${item.senseId}`], '投資');
 assert.equal(item.exampleYue, '我會當呢件首飾係一項投資。');
 assert.match(item.pitfallsYue, /唔代表.*保值/);
});
