#!/usr/bin/env python3
"""Bounded, evidence-producing repair of the remaining pronunciation-audit cases.

Generates locally, never pushes, never merges, never deploys. Both recognizers must
not regress against each same-speed baseline. A complete pair is required before
any case is installed. Source phoneme checks and ASR are not human listening.
"""
from __future__ import annotations
import argparse, hashlib, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import check_audio_asr as ca

ROOT = Path(__file__).resolve().parents[1]
PLAN = Path(__file__).with_name('pronunciation-followup-plan.json')
SPEEDS = {'normal': 1.0, 'slow': 1.35}


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''): digest.update(chunk)
    return digest.hexdigest()


def rel_for(case, speed):
    return case['rel'].replace('.mp3', '-slow.mp3') if speed == 'slow' else case['rel']


def dump(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)


def validate_plan(plan, root=ROOT, jobs=None):
    jobs = {j['rel']: j for j in (ca.clips() if jobs is None else jobs)}
    seen = set()
    if plan['voice'] != 'en_US-ljspeech-medium' or plan['espeak_voice'] != 'en-us':
        raise ValueError('Only the shipped US sentence voice is authorized by this plan')
    for case in plan['cases']:
        rel = case['rel']
        if rel in seen or not re.fullmatch(r'assets/audio/(words|lines)/[a-z0-9-]+\.mp3', rel):
            raise ValueError(f'Duplicate or invalid target: {rel}')
        seen.add(rel)
        job = jobs.get(rel)
        if not job or job['word'] or job['text'] != case['text'] or job['say'] != case['before']:
            raise ValueError(f'Content changed since the reviewed plan: {rel}')
        if set(case.get('retain', [])) - set(SPEEDS):
            raise ValueError(f'Invalid retained speed: {rel}')
        if case.get('retain') and case['before'] != case['say']:
            raise ValueError(f'Cannot retain a speed from a different recipe: {rel}')
        for speed in SPEEDS:
            if sha(root / rel_for(case, speed)) != case['baseline'][speed]:
                raise ValueError(f'Baseline audio changed: {rel} {speed}')
        if case.get('reuse'):
            donor = jobs.get(case['reuse'])
            if not donor or donor['word'] or donor['text'] != case['text'] or donor['say'] != case['say']:
                raise ValueError(f'Donor text/recipe is not identical: {rel}')
            for speed in SPEEDS:
                source = case['reuse'].replace('.mp3', '-slow.mp3') if speed == 'slow' else case['reuse']
                if sha(root / source) != case['reuse_sha256'][speed]:
                    raise ValueError(f'Donor bytes changed: {rel} {speed}')
    return jobs


def judge(text, baseline, candidate, exact=False):
    # Each recognizer has its own veto. A better total score cannot hide regression.
    for model in ('whisper', 'parakeet'):
        if ca.similarity(text, candidate[model]) + 1e-9 < ca.similarity(text, baseline[model]):
            return False
        if exact and ca.norm(candidate[model]) != ca.norm(text):
            return False
    return True


def tempo(source, target, factor):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(source),
                    '-af', f'atempo={factor}', '-ac', '1', '-ar', '22050',
                    '-codec:a', 'libmp3lame', '-qscale:a', '5', str(target)], check=True)


class Inspector:
    def __init__(self, models, parakeet, threads):
        self.whisper = ca.recognizer(models, 'base.en', threads)
        self.parakeet = ca.parakeet_recognizer(parakeet, threads)

    def __call__(self, path, text):
        import numpy as np
        pcm = ca.load_pcm(path)
        if not len(pcm) or not np.isfinite(pcm).all() or np.max(np.abs(pcm)) < 0.02:
            raise ValueError(f'Invalid or silent candidate: {path.name}')
        result = {'sha256': sha(path)}
        for name, recognizer in [('whisper', self.whisper), ('parakeet', self.parakeet)]:
            stream = recognizer.create_stream(); stream.accept_waveform(16000, pcm)
            recognizer.decode_stream(stream); result[name] = stream.result.text.strip()
        result['similarity'] = {k: ca.similarity(text, result[k]) for k in ('whisper', 'parakeet')}
        result['official_comparator_problems'] = {k: ca.compare(text, result[k]) for k in ('whisper', 'parakeet')}
        return result


def select_case(case, root, work, inspect, generate, takes, on_update=lambda record: None):
    work.mkdir(parents=True, exist_ok=True)
    record = {'rel': case['rel'], 'text': case['text'], 'before': case['before'],
              'say': case['say'], 'baseline': {}, 'attempts': [], 'selected': {}, 'accepted': False}
    paths = {}
    exact = case['rel'] == 'assets/audio/words/a-art.mp3'
    for speed in SPEEDS:
        path = root / rel_for(case, speed)
        record['baseline'][speed] = inspect(path, case['text'])
        if speed in case.get('retain', []):
            record['selected'][speed] = dict(record['baseline'][speed], method='retained corrected speed')
            paths[speed] = path

    def consider(path, speed, method):
        verdict = inspect(path, case['text'])
        accepted = judge(case['text'], record['baseline'][speed], verdict, exact)
        row = dict(verdict, speed=speed, method=method, accepted=accepted)
        record['attempts'].append(row)
        if accepted:
            target = work / f'{speed}-selected.mp3'; shutil.copyfile(path, target)
            paths[speed] = target
            record['selected'][speed] = dict(verdict, method=method)
        on_update(record)
        return accepted

    for speed, scale in SPEEDS.items():
        if speed in paths:
            continue
        donor = case.get('reuse')
        if donor:
            donor = donor.replace('.mp3', '-slow.mp3') if speed == 'slow' else donor
            if consider(root / donor, speed, 'reuse identical sentence: ' + donor):
                continue
        for attempt in range(takes):
            candidate = work / f'{speed}-take-{attempt + 1}.mp3'
            generate(case['say'], candidate, scale)
            if consider(candidate, speed, f'contextual Piper take {attempt + 1}'):
                break
    # One bounded pitch-preserving alternative, using the accepted other speed.
    for speed, scale in SPEEDS.items():
        other = 'slow' if speed == 'normal' else 'normal'
        if speed not in paths and other in paths:
            candidate = work / f'{speed}-tempo.mp3'
            tempo(paths[other], candidate, SPEEDS[other] / scale)
            consider(candidate, speed, 'pitch-preserving tempo from accepted ' + other)
    record['accepted'] = set(paths) == set(SPEEDS)
    return record, paths


def update_tree(node, cases, root):
    if isinstance(node, list):
        for value in node: update_tree(value, cases, root)
    elif isinstance(node, dict):
        case = cases.get(node.get('audio'))
        if case:
            shown = node.get('en', node.get('text', node.get('example')))
            if shown == case['text'] and ('say' in node or 'en' in node or 'text' in node or 'example' in node):
                node['say'] = case['say']
                if 'audioTextSha256' in node:
                    node['audioTextSha256'] = hashlib.sha256(case['say'].encode()).hexdigest()
                if 'audioSha256' in node:
                    node['audioSha256'] = sha(root / node['audio'])
        for value in node.values(): update_tree(value, cases, root)


def materialize(plan, records, paths, root=ROOT):
    accepted = {c['rel']: c for c, r in zip(plan['cases'], records) if r['accepted']}
    if not accepted:
        return []
    # Revalidate byte identity immediately before writing, including selected copies.
    for case, record, selected in zip(plan['cases'], records, paths):
        if not record['accepted']: continue
        for speed in SPEEDS:
            if sha(root / rel_for(case, speed)) != case['baseline'][speed]:
                raise ValueError('Baseline changed while selecting')
            if sha(selected[speed]) != record['selected'][speed]['sha256']:
                raise ValueError('Selected audio changed after inspection')
    for case, record, selected in zip(plan['cases'], records, paths):
        if not record['accepted']: continue
        for speed in SPEEDS:
            dest = root / rel_for(case, speed)
            if selected[speed].resolve() != dest.resolve(): shutil.copyfile(selected[speed], dest)
    for rel in ['content/lexicon.json', 'content/lines.json'] + [str(p.relative_to(root)) for p in sorted((root/'content/lessons').glob('*.json'))]:
        p = root / rel; before = json.loads(p.read_text()); after = json.loads(p.read_text())
        update_tree(after, accepted, root)
        if after != before: dump(p, after)
    p = root / 'assets/audio/rendered.json'; rendered = json.loads(p.read_text())
    for rel, case in accepted.items(): rendered[rel] = hashlib.sha256(case['say'].encode()).hexdigest()
    # Preserve established formatting to keep unrelated lines unchanged.
    p.write_text(json.dumps(rendered, indent=1)+'\n')
    p = root / 'tests/fixtures/say-overrides.json'; overrides = json.loads(p.read_text())
    for case in accepted.values():
        for phonemes in re.findall(r'\[\[(.*?)\]\]', case['say']):
            if phonemes in plan['overrides']:
                overrides[phonemes] = sorted(set(overrides.get(phonemes, []) + plan['overrides'][phonemes]))
            if phonemes not in overrides: raise ValueError(f'Unreviewed phoneme override: {phonemes}')
    p.write_text(json.dumps(overrides, ensure_ascii=False, indent=1)+'\n')
    if 'assets/audio/words/a-art.mp3' in accepted:
        # This case was accepted only on exact transcripts from both recognizers.
        p = root/'tests/fixtures/asr-known.json'; known = json.loads(p.read_text())
        known.pop('assets/audio/words/a-art.mp3', None); known.pop('assets/audio/words/a-art-slow.mp3', None)
        dump(p, known)
    return sorted(accepted)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--plan', type=Path, default=PLAN)
    ap.add_argument('--models', type=Path)
    ap.add_argument('--voice', type=Path)
    ap.add_argument('--parakeet', type=Path)
    ap.add_argument('--takes', type=int, default=16)
    ap.add_argument('--threads', type=int, default=2)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--check-plan', action='store_true')
    ap.add_argument('--materialize', action='store_true', help='Apply accepted complete cases in this checkout only')
    args = ap.parse_args(argv)
    if not 0 <= args.takes <= 16 or not 1 <= args.threads <= 4: ap.error('takes must be 0..16; threads 1..4')
    plan = json.loads(args.plan.read_text())
    if subprocess.run(['git','merge-base','--is-ancestor',plan['source_commit'],'HEAD'],cwd=ROOT).returncode:
        raise ValueError('The reviewed source commit is not an ancestor of this checkout')
    validate_plan(plan)
    if args.check_plan:
        print(f"Plan verified: {len(plan['cases'])} cases, all baseline files/content unchanged")
        return 0
    if not all((args.models, args.voice, args.parakeet)): ap.error('models, voice and parakeet required')
    if sha(args.voice) != plan['model_sha256'] or sha(Path(str(args.voice)+'.json')) != plan['config_sha256']:
        raise ValueError('Piper weights/config do not match the reviewed model')
    for engine, spec in plan['recognizers'].items():
        folder = args.parakeet if engine == 'parakeet' else args.models / spec['folder']
        for name, expected in spec['files'].items():
            if sha(folder / name) != expected: raise ValueError(f'Unreviewed ASR model: {engine} {name}')
    from importlib.metadata import version
    if version('sherpa-onnx') != '2.0.1' or version('piper-tts') != '1.8.0':
        raise ValueError('Pinned sherpa-onnx 2.0.1 and piper-tts 1.8.0 are required')
    import render_audio as ra
    from piper import PiperVoice
    voice = PiperVoice.load(str(args.voice)); voice.config.espeak_voice = plan['espeak_voice']
    phonemes = {}
    for case in plan['cases']:
        sentences = ra.phonemes_in_context(voice, case['say'])
        unknown = sorted({c for s in sentences for c in s if c not in voice.config.phoneme_id_map})
        if unknown: raise ValueError(f"Unknown phonemes for {case['rel']}: {unknown}")
        phonemes[case['rel']] = [''.join(s) for s in sentences]
    inspect = Inspector(args.models, args.parakeet, args.threads)
    args.output.mkdir(parents=True, exist_ok=True)
    report = {'source_commit': plan['source_commit'], 'checkout_commit': subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
              'voice': plan['voice'], 'espeak_voice': plan['espeak_voice'], 'model_sha256':plan['model_sha256'],
              'policy': 'Each recognizer must not regress against the same-speed baseline; a-art requires both exact; complete pairs only; no human listening claimed.',
              'takes_per_speed_max': args.takes, 'runtime': {k:version(k) for k in ['sherpa-onnx','piper-tts','onnxruntime','numpy']}, 'recognizers':plan['recognizers'], 'human_listened': False, 'phonemes': phonemes, 'cases': []}
    def generate(say, path, scale):
        wav = path.with_suffix('.wav'); ra.synth(voice, say, wav, scale); ra.to_mp3(wav, path)
    selected_paths=[]
    with tempfile.TemporaryDirectory(prefix='eq-sentence-repair-') as tmp:
        for index, case in enumerate(plan['cases']):
            def checkpoint(record):
                report['current_case'] = record
                dump(args.output/'selection.json', report)
            record, paths = select_case(case, ROOT, Path(tmp)/str(index), inspect, generate, args.takes, checkpoint)
            report.pop('current_case', None)
            record['phonemes'] = phonemes[case['rel']]
            report['cases'].append(record); selected_paths.append(paths)
            # Preserve accepted files as artifacts even if a later case/model fails.
            for speed, path in (paths.items() if record['accepted'] else []):
                dest=args.output/'accepted'/rel_for(case,speed);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,dest)
            dump(args.output/'selection.json', report)
            print(case['rel'], 'accepted' if record['accepted'] else 'BLOCKED', flush=True)
        installed=materialize(plan, report['cases'], selected_paths) if args.materialize else []
    report['installed']=installed;report['complete']=all(r['accepted'] for r in report['cases'])
    dump(args.output/'selection.json', report)
    return 0 if report['complete'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
