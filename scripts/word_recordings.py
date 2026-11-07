"""Reproduce the three dictionary recordings; no guessed ASR homophones.

The labels come from Wiktionary's US pronunciation entries. The original Commons
files and their CC BY-SA attribution are committed alongside this script. This
is source/derivation verification, NOT speech recognition or a human ear check.
"""
from __future__ import annotations
import array
import hashlib
import json
import math
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'content/word-audio-recordings.json'


def recordings() -> dict:
    return json.loads(MANIFEST.read_text())['items']


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def render(source: Path, target: Path, slow: bool) -> None:
    """Preserve the entire utterance and its pitch; add Safari-safe silence."""
    with tempfile.TemporaryDirectory(prefix='eq-dictionary-') as temp:
        wav = Path(temp) / 'source.wav'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(source),
                        '-ac', '1', '-ar', '22050', str(wav)], check=True)
        filters = (['atempo=0.7407407407407407'] if slow else []) + [
            'adelay=180:all=1', 'apad=pad_dur=0.2', 'asetpts=N/SR/TB']
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav),
                        '-af', ','.join(filters), '-ac', '1', '-ar', '22050',
                        '-codec:a', 'libmp3lame', '-qscale:a', '5', str(target)], check=True)


def render_pair(card: str, normal: Path, slow: Path) -> None:
    row = recordings()[card]
    source = ROOT / row['source']
    if sha(source) != row['sourceSha256']:
        raise ValueError(f'{card}: dictionary source checksum changed')
    render(source, normal, False)
    render(source, slow, True)


def pcm(path: Path) -> array.array:
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path),
                                   '-f', 'f32le', '-ac', '1', '-ar', '22050', '-'])
    samples = array.array('f'); samples.frombytes(raw)
    return samples


def verify(job: dict) -> dict:
    """Require the reviewed identity, source bytes, output bytes and derivation.

    Re-encoding on another ffmpeg/LAME build may differ slightly. A 2% relative
    RMS error ceiling permits codec rounding, not changed words, pitch or timing.
    The shipped file must ALSO match its independently reviewed SHA-256.
    """
    card = job['where'].removesuffix(' word')
    row = recordings().get(card)
    if row is None:
        return {'accepted': False, 'reason': 'no dictionary source'}
    slow = job['rel'].endswith('-slow.mp3')
    rel = f"assets/audio/words/{card}-word{'-slow' if slow else ''}.mp3"
    if job['rel'] != rel or job['text'] != row['lemma'] or job['say'] != row['say']:
        return {'accepted': False, 'reason': 'dictionary identity mismatch'}
    source, target = ROOT / row['source'], ROOT / rel
    if not source.is_file() or sha(source) != row['sourceSha256']:
        return {'accepted': False, 'reason': 'dictionary source checksum mismatch'}
    if not target.is_file() or sha(target) != row['sha256']['slow' if slow else 'normal']:
        return {'accepted': False, 'reason': 'dictionary output checksum mismatch'}
    with tempfile.TemporaryDirectory(prefix='eq-source-check-') as temp:
        expected = Path(temp) / 'expected.mp3'
        render(source, expected, slow)
        a, b = pcm(target), pcm(expected)
    if not a or len(a) != len(b):
        return {'accepted': False, 'reason': 'dictionary duration mismatch'}
    power = sum(x*x for x in b)
    error = math.sqrt(sum((x-y)**2 for x,y in zip(a,b)) / power) if power else math.inf
    return {'accepted': error <= .02, 'relativeRmsError': round(error, 8),
            'source': row['sourceUrl'], 'sourceSha256': row['sourceSha256'],
            'license': row['license'], 'method': 'dictionary-source-and-derivation'}


if __name__ == '__main__':
    for card in recordings():
        normal = ROOT / f'assets/audio/words/{card}-word.mp3'
        render_pair(card, normal, normal.with_name(normal.stem + '-slow.mp3'))
        print(card, sha(normal), sha(normal.with_name(normal.stem + '-slow.mp3')))
