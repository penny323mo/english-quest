"""Real encoded audio controls for the dictionary-source gate."""
import contextlib,io,json,shutil,sys,tempfile
from pathlib import Path
sys.path.insert(0,'scripts')
import word_recordings as wr
import check_audio_asr as ca
root=wr.ROOT
rows=wr.recordings()
results={}
def job(card,slow=False):
 r=rows[card]
 return {'where':card+' word','text':r['lemma'],'say':r['say'],'rel':f"assets/audio/words/{card}-word{'-slow' if slow else ''}.mp3",'word':True,'recording':'wikimedia-commons'}
results['six_originals']=all(wr.verify(job(card,slow))['accepted'] for card in rows for slow in [False,True])
with tempfile.TemporaryDirectory() as temp:
 wr.ROOT=Path(temp);wr.MANIFEST=wr.ROOT/'content/word-audio-recordings.json'
 def reset():
  for rel in ['content/word-audio-recordings.json']+[r['source'] for r in rows.values()]+[job(c,s)['rel'] for c in rows for s in [False,True]]:
   p=wr.ROOT/rel;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/rel,p)
 def reject(label,edit):
  reset();j=job('a-art');edit(j);results[label]=not wr.verify(j)['accepted']
 reject('wrong_card',lambda j:j.update(text='fee'))
 reject('wrong_source',lambda j:shutil.copyfile(root/rows['fee-noun']['source'],wr.ROOT/rows['a-art']['source']))
 reject('wrong_audio',lambda j:shutil.copyfile(root/job('fee-noun')['rel'],wr.ROOT/j['rel']))
 reject('normal_as_slow',lambda j:(j.update(rel=job('a-art',True)['rel']),shutil.copyfile(root/job('a-art')['rel'],wr.ROOT/j['rel'])))
 # An editor cannot bless a wrong file just by updating its output hash.
 def forged(j):
  p=wr.ROOT/j['rel'];shutil.copyfile(root/job('fee-noun')['rel'],p)
  d=wr.recordings();d['a-art']['sha256']['normal']=wr.sha(p)
  wr.MANIFEST.write_text(json.dumps({'items':d}))
 reject('wrong_audio_with_updated_hash',forged)
 # Preserve sample count but replace speech with silence, then forge output hash.
 def silence(j):
  import subprocess
  p=wr.ROOT/j['rel']
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(root/j['rel']),'-af','volume=0','-codec:a','libmp3lame',str(p)],check=True)
  d=wr.recordings();d['a-art']['sha256']['normal']=wr.sha(p);wr.MANIFEST.write_text(json.dumps({'items':d}))
 reject('silence_with_updated_hash',silence)
wr.ROOT=root;wr.MANIFEST=root/'content/word-audio-recordings.json'
# Recognition cannot bypass provenance, even if a word was heard correctly or waived.
for accepted in [False,True,None]:
 with tempfile.TemporaryDirectory() as temp,contextlib.redirect_stdout(io.StringIO()):
  path=Path(temp)/'result.json';j=job('led-verb')
  code=ca.run([j],hear_sentence=None,hear_word=lambda j:'led',hear_parakeet=lambda j:'lead',fresh=lambda j:(_ for _ in ()).throw(AssertionError('no fallback')),known={j['rel']:'must not waive'},verify_recording=(lambda j:{'accepted':accepted}) if accepted is not None else None,json_path=str(path))
  result=json.loads(path.read_text());r=result['results'][0]
  results['flow_'+str(accepted)]=code==(0 if accepted else 1) and r['verdict']==('dictionary' if accepted else 'failed') and result['summary']['whisper']==0 and result['summary']['waived']==0
print(json.dumps(results))
