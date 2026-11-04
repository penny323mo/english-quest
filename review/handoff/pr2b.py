"""PR2 part B: from an ASR report, drop every clip that does not say its text, and stamp
text hashes on the lesson lines that Whisper confirmed, so render_audio.py re-renders only
the clips that are wrong."""
import hashlib, json, os, sys
sys.path.insert(0, '.')
from eq import R, load, save

report = json.load(open(sys.argv[1]))
bad = {row['path'].replace('-slow.mp3', '.mp3') for row in report['failures']}
print('clips that fail ASR', len(bad))
for rel in sorted(bad):
    for q in (rel, rel.replace('.mp3', '-slow.mp3')):
        if os.path.exists(f'{R}/{q}'):
            os.remove(f'{R}/{q}')
lines = load('content/lines.json')
stamped = 0
for line in lines:
    if line.get('runtimeTts') or line['audio'] in bad:
        line.pop('audioTextSha256', None)
        continue
    if os.path.exists(f'{R}/{line["audio"]}'):
        line['audioTextSha256'] = hashlib.sha256(line['say'].encode('utf-8')).hexdigest()
        stamped += 1
save('content/lines.json', lines)
print('lines stamped as verified', stamped)
json.dump(sorted(bad), open('asr_bad.json', 'w'), indent=1)
