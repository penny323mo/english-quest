import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const targets = {
 W9: "Wednesday's a public holiday.", W10: 'Start with a sincere apology.', W11: 'Let me check.', W3: 'I see your point.',
 D11: 'When will I get my debit card?', D12: "Hi, I'd like to make an appointment to see a doctor, please.", D2: 'I would also like to open an account.', D3: "If I decide today, is the deposit one month's rent?",
 R7: "I'm sorry your soup was cold.", R11: 'Is egg a problem for you too?', R12: 'Would you like the private room?', R13: 'What size would you like, regular or large?',
 J11: 'If I paid a deposit on a custom piece, would the timeline fit my anniversary next month?', J14: 'What deposit do you need to start this work?', J16: 'We can fit up to twelve characters.', J18: "It takes about ten minutes, and it's eighty dollars.", T15: 'A late checkout is forty dollars.',
};
for (const [id, sentence] of Object.entries(targets)) test(`${id} order teaches a complete contextual sentence`, () => {
 const lesson = JSON.parse(fs.readFileSync(new URL(`content/lessons/${id.toLowerCase()}.json`, root)));
 const item = lesson.build.find(x => x.type === 'order');
 assert.equal(item.answer.join(' '), sentence);
 assert.deepEqual([...item.tokens].sort(), [...item.answer].sort());
});
test('token ordering preserves identities, is stable, and never displays a solvable answer in order', async () => {
 const { orderTokenIndices } = await import('../web/src/order-bank.js');
 const lessons = JSON.parse(fs.readFileSync(new URL('content/path.json', root))).units.flatMap(u => u.lessons);
 for (const { id } of lessons) {
  const lesson = JSON.parse(fs.readFileSync(new URL(`content/lessons/${id.toLowerCase()}.json`, root)));
  for (const item of lesson.build.filter(x => x.type === 'order')) for (let seed = 0; seed < 100; seed++) {
   const before = JSON.stringify(item);
   const order = orderTokenIndices(item.tokens, item.answer, seed);
   assert.deepEqual(order, orderTokenIndices(item.tokens, item.answer, seed));
   assert.deepEqual([...order].sort((a,b) => a-b), item.tokens.map((_,i) => i));
   if (new Set(item.tokens).size > 1) assert.notEqual(order.map(i => item.tokens[i]).join(' '), item.answer.join(' '), id);
   assert.equal(JSON.stringify(item), before);
  }
 }
});
test('duplicate words, fallback, learner labels and degenerate banks are safe', async () => {
 const { orderTokenIndices } = await import('../web/src/order-bank.js');
 // length 2, seed 0 produces identity in seededOrder: fallback must swap.
 assert.deepEqual(orderTokenIndices(['a','b'], ['a','b'], 0), [1,0]);
 for (const tokens of [[], ['only'], ['same','same'], ['the','the','bag'], ['My','name','is','{{learner}}']]) {
  const order = orderTokenIndices(tokens, tokens, 0);
  assert.equal(new Set(order).size, tokens.length);
  const target = tokens.map((_, i) => i);
  // Removing and reselecting equal words uses identities, not text lookup.
  assert.deepEqual(target.map(i => tokens[i]), tokens);
  assert.deepEqual(order, orderTokenIndices(tokens, tokens, 0));
 }
 // A learner named "I" makes two different raw tokens look alike.
 const rendered = ['I','I','am'];
 const order = orderTokenIndices(['I','{{learner}}','am'], ['I','{{learner}}','am'], 0, rendered, rendered);
 assert.notEqual(order.map(i => rendered[i]).join(' '), rendered.join(' '));
});
test('OrderBuild renders shuffled original indices with a stable mount seed', () => {
 const source = fs.readFileSync(new URL('web/src/Lesson.tsx',root),'utf8');
 const component = source.slice(source.indexOf('function OrderBuild('),source.indexOf('function OrderBuild(')+4500);
 assert.match(component, /orderTokenIndices\(/);
 assert.match(component, /const \[seed\] = useState/);
 assert.match(component, /order\.map\(\(i\)/);
 assert.match(component, /item\.tokens\[i\]/);
 assert.doesNotMatch(component, /item\.tokens\.map\(\(token, i\)/);
});

test('phrase fallback changes the joined sentence, not merely the block order', async () => {
 const { orderTokenIndices } = await import('../web/src/order-bank.js');
 for (const tokens of [['a a','a','b'], ['a a','a']]) {
  const before = [...tokens];
  for (let seed = 0; seed < 100; seed++) {
   const order = orderTokenIndices(tokens, tokens, seed);
   assert.deepEqual(order, orderTokenIndices(tokens, tokens, seed));
   assert.deepEqual([...order].sort((a,b) => a-b), tokens.map((_,i) => i));
   const joined = order.map(i => tokens[i]).join(' ');
   if (tokens.length === 3) assert.notEqual(joined, tokens.join(' '));
   else assert.equal(joined, tokens.join(' ')); // No permutation changes visible text.
   assert.deepEqual(tokens, before);
  }
 }
});
