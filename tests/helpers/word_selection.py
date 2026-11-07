"""Run the real selection/publishing loop against controlled model judgements."""
import contextlib
import io
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import types

sys.path.insert(0, 'scripts')
sys.modules['piper'] = types.SimpleNamespace(PiperVoice=type('PiperVoice', (), {}))
sys.modules['piper.config'] = types.SimpleNamespace(SynthesisConfig=lambda **kw: None)
import pick_word_takes as picker
ra = picker.ra

class Voice:
    def __init__(self, *args, **kwargs):
        self.placeholder = {}

    def synth(self, say, dest, scale, speaker):
        dest.write_text(json.dumps({'speaker': speaker, 'speed': 'slow' if scale > 1.1 else 'normal'}))


def scenario(mode):
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        ra.ROOT = root
        for attr, filename in [('LEX','lex.json'),('WORDS','words.json'),('SKIP','skip.json'),('WORD_SPEAKERS','voices.json'),('RENDERED','rendered.json'),('OVERRIDES','overrides.json')]:
            setattr(ra, attr, root / filename)
        picker.SKIP = ra.SKIP
        ra.LEX.write_text(json.dumps({'items':[{'id':'sample-noun','lemma':'sample','say':'sample'}]}))
        ra.SKIP.write_text(json.dumps({'ids':['sample-noun']}))
        ra.WORD_SPEAKERS.write_text(json.dumps({'items':{}}))
        ra.RENDERED.write_text('{}')
        ra.OVERRIDES.write_text('{}')
        normal = root / 'assets/audio/words/sample-noun-word.mp3'
        normal.parent.mkdir(parents=True)
        slow = normal.with_name('sample-noun-word-slow.mp3')
        normal.write_bytes(b'original normal')
        slow.write_bytes(b'original slow')
        if mode == 'split_voices':
            normal.write_text(json.dumps({'speaker':0,'speed':'normal'}))
            slow.write_text(json.dumps({'speaker':0,'speed':'slow'}))
            ra.RENDERED.write_text(json.dumps({'assets/audio/words/sample-noun-word.mp3':ra.text_hash('sample')}))
        before = (normal.read_bytes(), slow.read_bytes())
        ra.WordVoice = Voice
        ra.to_mp3 = shutil.copyfile
        def tempo(source, target, speed):
            data = json.loads(source.read_text())
            data['speed'] = 'slow' if speed < 1 else 'normal'
            target.write_text(json.dumps(data))
        picker.change_tempo = tempo
        def inspect(path, lemma, card):
            data = json.loads(path.read_text())
            accepted = (
                mode == 'pass' or
                (mode == 'normal_only' and data['speed'] == 'normal') or
                (mode == 'split_voices' and ((data['speaker']==0 and data['speed']=='slow') or (data['speaker']==1 and data['speed']=='normal'))) or
                (mode == 'fallback' and data['speaker'] == 1)
            )
            return {'accepted':accepted, 'verdict':'whisper' if accepted else 'failed', 'whisper':['sample' if accepted else 'wrong']*6, 'parakeet':'sample' if accepted else 'wrong', 'variants':['whisper' if accepted else 'failed']*6}
        os.environ['EQ_PARAKEET'] = 'test-model'
        sys.argv = ['picker', *([] if mode == 'split_voices' else ['--fresh']), '--takes','1','--speakers','0','1','--only','sample-noun','--report',str(root/'report.json')]
        with contextlib.redirect_stdout(io.StringIO()):
            assert picker.main(inspect) == 0
        report = json.loads((root/'report.json').read_text())['cards'][0]
        return {
            'accepted': report['accepted'],
            'unchanged': (normal.read_bytes(), slow.read_bytes()) == before,
            'skip': json.loads(ra.SKIP.read_text())['ids'],
            'items': json.loads(ra.WORDS.read_text())['items'],
            'voices': json.loads(ra.WORD_SPEAKERS.read_text())['items'],
            'pair_speakers': [report[k]['speaker'] for k in ['normal','slow']] if report['accepted'] else [],
        }

print(json.dumps({mode:scenario(mode) for mode in ['pass','normal_only','split_voices','fallback','fail']}))
