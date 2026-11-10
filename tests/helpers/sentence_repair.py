"""Exercise real repair selection/materialization against controlled recognizers."""
import copy, hashlib, json, sys, tempfile
from pathlib import Path
sys.path.insert(0, 'scripts')
import repair_sentence_audio as r

TEXT='A test sentence.'
SAY='A [[tˈɛst]] sentence.'
def encoded(path, whisper=TEXT, parakeet=TEXT):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps({'whisper':whisper,'parakeet':parakeet}))
def inspect(path,text):
 data=json.loads(path.read_text());return dict(data,sha256=r.sha(path))
def setup(root, retain=()):
 rel='assets/audio/words/test.mp3';before=SAY if retain else TEXT
 case={'rel':rel,'text':TEXT,'before':before,'say':SAY,'retain':list(retain),'baseline':{}}
 for speed in r.SPEEDS:
  path=root/r.rel_for(case,speed);encoded(path);case['baseline'][speed]=r.sha(path)
 plan={'voice':'en_US-ljspeech-medium','espeak_voice':'en-us','cases':[case],'overrides':{'tˈɛst':['test']}}
 jobs=[{'rel':rel,'word':False,'text':TEXT,'say':before}]
 return plan,case,jobs

results={}
base={'whisper':'A test sentence.','parakeet':'A wrong sentence.'}
results['each_model_has_a_veto']=not r.judge(TEXT,base,{'whisper':'Another sentence.','parakeet':TEXT})
results['exact_article_required']=not r.judge('A table for two.',{'whisper':'I tap off it too','parakeet':'A table for two.'},{'whisper':'Table for two.','parakeet':'A table for two.'},exact=True)
results['exact_both_models_pass']=r.judge(TEXT,{'whisper':TEXT,'parakeet':TEXT},{'whisper':TEXT,'parakeet':TEXT},exact=True)
with tempfile.TemporaryDirectory() as temp:
 root=Path(temp);plan,case,jobs=setup(root)
 r.validate_plan(plan,root,jobs);results['fresh_plan_passes']=True
 encoded(root/case['rel'],'Different sentence')
 try:r.validate_plan(plan,root,jobs);results['changed_bytes_rejected']=False
 except ValueError:results['changed_bytes_rejected']=True
 plan,case,jobs=setup(root);case['retain']=['slow']
 try:r.validate_plan(plan,root,jobs);results['different_recipe_cannot_retain']=False
 except ValueError:results['different_recipe_cannot_retain']=True

saved_tempo=r.tempo
for mode in ('accept','reject','retain','tempo','reuse'):
 with tempfile.TemporaryDirectory() as temp:
  root=Path(temp);plan,case,jobs=setup(root,('slow',) if mode=='retain' else ())
  before={s:(root/r.rel_for(case,s)).read_bytes() for s in r.SPEEDS};calls=[]
  if mode=='reuse':
   case['reuse']='assets/audio/words/donor.mp3'
   for s in r.SPEEDS:encoded(root/(case['reuse'].replace('.mp3','-slow.mp3') if s=='slow' else case['reuse']))
  def generate(say,path,scale):
   calls.append(scale)
   good=mode=='accept' or mode=='retain' or (mode=='tempo' and scale==1.0)
   encoded(path,TEXT if good else 'No words',TEXT if good else 'No words')
  factors=[]
  def tempo(source,target,factor):
   factors.append(factor)
   if mode=='tempo':target.write_bytes(source.read_bytes())
   else:encoded(target,'No words','No words')
  r.tempo=tempo
  record,paths=r.select_case(case,root,root/'work',inspect,generate,2)
  results[mode+'_pair_result']=record['accepted']==(mode!='reject')
  results[mode+'_no_early_writes']=all((root/r.rel_for(case,s)).read_bytes()==before[s] for s in r.SPEEDS)
  if mode=='retain':results['retained_speed_never_regenerated']=calls==[1.0] and paths['slow']==root/r.rel_for(case,'slow')
  if mode=='reuse':results['matching_donors_avoid_generation']=not calls and all('reuse' in v['method'] for v in record['selected'].values())
  if mode=='reject':results['take_limit_is_bounded']=len(calls)==4 and not factors
  if mode=='tempo':results['tempo_is_pitch_preserving_duration_factor']=factors==[1/1.35]
r.tempo=saved_tempo

with tempfile.TemporaryDirectory() as temp:
 root=Path(temp);plan,case,jobs=setup(root);rel=case['rel'];normal=root/rel
 source_hash=hashlib.sha256(TEXT.encode()).hexdigest()
 lex={'items':[{'id':'test','example':TEXT,'say':TEXT,'audio':rel,'audioSlow':r.rel_for(case,'slow'),'audioSha256':r.sha(normal),'examples':[{'en':TEXT,'say':TEXT,'audio':rel,'audioTextSha256':source_hash}],'miniDialogue':[]}]}
 r.dump(root/'content/lexicon.json',lex)
 r.dump(root/'content/lines.json',[{'id':'line','text':TEXT,'say':TEXT,'audio':rel}])
 r.dump(root/'content/lessons/test.json',{'dialogue':[{'text':TEXT,'say':TEXT,'audio':rel}]})
 r.dump(root/'assets/audio/rendered.json',{rel:source_hash})
 r.dump(root/'tests/fixtures/say-overrides.json',{})
 r.dump(root/'tests/fixtures/asr-known.json',{'assets/audio/words/a-art.mp3':'keep'})
 def generate(say,path,scale):encoded(path)
 record,paths=r.select_case(case,root,root/'work',inspect,generate,1)
 installed=r.materialize(plan,[record],[paths],root)
 after=json.loads((root/'content/lexicon.json').read_text())['items'][0]
 results['materialize_complete_case']=installed==[rel] and after['say']==SAY and after['examples'][0]['say']==SAY
 results['hashes_synchronized']=after['examples'][0]['audioTextSha256']==hashlib.sha256(SAY.encode()).hexdigest() and after['audioSha256']==r.sha(normal)
 results['lesson_and_lines_synchronized']=json.loads((root/'content/lines.json').read_text())[0]['say']==SAY and json.loads((root/'content/lessons/test.json').read_text())['dialogue'][0]['say']==SAY
 results['reviewed_override_added']=json.loads((root/'tests/fixtures/say-overrides.json').read_text())['tˈɛst']==['test']
 results['unrelated_waiver_untouched']='assets/audio/words/a-art.mp3' in json.loads((root/'tests/fixtures/asr-known.json').read_text())
 # A failed case cannot write its selected half or metadata.
 before={p.relative_to(root).as_posix():p.read_bytes() for p in root.rglob('*') if p.is_file() and 'work' not in p.parts}
 record['accepted']=False
 results['failed_case_not_installed']=r.materialize(plan,[record],[paths],root)==[] and all((root/p).read_bytes()==data for p,data in before.items())

assert all(results.values()),results
print(json.dumps(results))
