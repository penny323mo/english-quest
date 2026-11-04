"""Render only clips whose mp3 is missing, using the repo's own render_audio helpers, then restamp hashes."""
import hashlib, json, sys
sys.path.insert(0, '/home/user/english-quest/scripts')
import render_audio as ra
voice = ra.PiperVoice.load(str(ra.MODEL)); voice.config.espeak_voice = 'en-us'
ra.TMP.mkdir(exist_ok=True)
n = 0
for job in ra.clips():
    rel = job['rel']; mp3 = ra.ROOT / rel; slow = ra.ROOT / rel.replace('.mp3', '-slow.mp3')
    if mp3.exists() and slow.exists(): continue
    stem = rel.replace('/', '_').replace('.mp3', '')
    w = ra.TMP / f'{stem}.wav'; ws = ra.TMP / f'{stem}-slow.wav'
    ra.synth(voice, job['say'], w, 1.0); ra.synth(voice, job['say'], ws, 1.35)
    ra.to_mp3(w, mp3); ra.to_mp3(ws, slow); n += 1
    print('rendered', rel, '|', job['say'], flush=True)
lex = json.loads(ra.LEX.read_text(encoding='utf-8'))
for item in lex['items']:
    item['audioSha256'] = hashlib.sha256((ra.ROOT / item['audio']).read_bytes()).hexdigest()
ra.stamp_audio_text_hashes(lex)
ra.LEX.write_text(json.dumps(lex, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('rendered', n)
