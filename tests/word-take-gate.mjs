import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("take selection requires Parakeet agreement on every Whisper perturbation, allowing only pure repeats", () => {
  const code = `import sys, json
sys.path.insert(0, 'scripts')
from word_take_gate import judge_take
cases = [
 ('floor', ['Floor', 'Floor Floor'], 'Floor', []),
 ('floor', ['Floor Floor'], 'flaw', []),
 ('floor', ['Floor Floor'], 'floor floor', []),
 ('floor', ['Floor Floor'], None, []),
 ('floor', ['Floor', 'flaw'], 'Floor', []),
 ('floor', ['Floor', 'a floor'], 'Floor', []),
 ('floor', ['Floor'], 'flaw', []),
 ('tea', ['T', 'tea'], 'T', ['t']),
 ('price', ['prize'], 'price', []),
 ('floor', [], 'Floor', []),
]
print(json.dumps([judge_take(*c) for c in cases]))`;
  const rows = JSON.parse(execFileSync('python3', ['-c', code], { encoding: 'utf8' }));
  assert.deepEqual(rows.map(r => r.accepted), [true, false, false, false, false, false, false, true, false, false]);
  assert.equal(rows[0].verdict, 'parakeet');
  assert.equal(rows[7].verdict, 'whisper');
  assert.deepEqual(rows[0].whisper, ['Floor', 'Floor Floor']);
});

test("a quotation mark needs an explicit quote from Parakeet; punctuation alone cannot pass", () => {
  const code = `import sys, json, contextlib, io, tempfile
from pathlib import Path
sys.path.insert(0, 'scripts')
from word_take_gate import judge_take
import check_audio_asr as ca
results=[]
for whisper,para in [(chr(34),'quote'), ('“','Quote.'), (chr(34),None), (chr(34),'quiet'), (chr(34),chr(34)), ('','quote'), ('.','quote')]:
 with tempfile.TemporaryDirectory() as tmp:
  p=Path(tmp)/'result.json'
  def never_fresh(job): raise AssertionError('Parakeet veto cannot use an acoustic fallback')
  # The first five cases must take the secondary-model route, even with a quote mark.
  if whisper not in ('', '.'):
   with contextlib.redirect_stdout(io.StringIO()):
    ca.run([{'rel':'quote.mp3','text':'quote','say':'quote','word':True,'where':'quote-noun word'}], hear_sentence=None, hear_word=lambda _:whisper, hear_parakeet=(lambda _:para) if para is not None else None, fresh=never_fresh, known={}, same_sound={'words':{},'cards':{}}, json_path=str(p))
   verdict=json.loads(p.read_text())['results'][0]['verdict']
  else: verdict=None
  results.append({'take':judge_take('quote',[whisper],para)['accepted'], 'direct':not ca.compare_word('quote',whisper),'ci':verdict})
print(json.dumps(results))`;
  const rows = JSON.parse(execFileSync('python3', ['-c', code], { encoding: 'utf8' }));
  assert.deepEqual(rows.map(r => r.take), [true, true, false, false, false, false, false]);
  assert.ok(rows.every(r => !r.direct));
  assert.deepEqual(rows.map(r => r.ci), ['parakeet', 'parakeet', 'failed', 'failed', 'failed', null, null]);
});
