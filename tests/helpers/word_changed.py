"""Exercise changed-file selection against a real temporary Git history."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
sys.path.insert(0,'scripts')
import check_audio_asr as ca

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp)
    def write(rel, value):
        p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value))
    def git(*args):
        return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.DEVNULL,text=True)
    git('init')
    git('config','user.name','Test')
    git('config','user.email','test@example.invalid')
    write('content/lexicon.json',{'items':[]})
    write('content/lines.json',[])
    write('tests/fixtures/word-homophones.json',{'words':{},'cards':{}})
    words={'voice':{'speaker':0},'items':{'a':{'audio':'assets/audio/a.mp3','say':'sample'},'b':{'audio':'assets/audio/b.mp3','say':'second'}}}
    write('content/word-audio.json',words)
    git('add','.');git('commit','-m','before')
    ca.ROOT=root;ca.WORDS=root/'content/word-audio.json';ca.HOMOPHONES=root/'tests/fixtures/word-homophones.json'
    jobs=[{'rel':row['audio'],'say':row['say'],'text':row['say'],'word':True,'where':key+' word'} for key,row in words['items'].items()]
    results={}
    results['unchanged']=[j['rel'] for j in ca.changed_since('HEAD',jobs)]
    words['items']['a']['speaker']=1;write('content/word-audio.json',words);jobs[0]['speaker']=1
    results['speaker']=[j['rel'] for j in ca.changed_since('HEAD',jobs)]
    words['items']['a'].pop('speaker');write('content/word-audio.json',words);jobs[0].pop('speaker')
    # Track the paths first, so git diff sees their subsequent edit.
    for rel in ['scripts/render_audio.py','.github/workflows/audio-asr.yml']:
        p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('before\n')
    git('add','.');git('commit','-m','track renderer and model pins')
    for rel,label in [('scripts/render_audio.py','renderer'),('.github/workflows/audio-asr.yml','model_pins')]:
        (root/rel).write_text('after\n')
        results[label]=[j['rel'] for j in ca.changed_since('HEAD',jobs)]
        (root/rel).write_text('before\n')
    print(json.dumps(results))
