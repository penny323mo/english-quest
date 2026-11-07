#!/usr/bin/env python3
"""Select word clips using Whisper perturbations and mandatory Parakeet agreement.

A pure Whisper repetition may use Parakeet's exact, single-word verdict, just as
in CI. Other mistakes fail; there is no acoustic fallback or automatic waiver.
Both normal and slow must pass before either replaces a shipped file. Slow
candidates can be made from the accepted normal clip with pitch-preserving atempo,
which avoids a different pronunciation produced by slow synthesis.

EQ_WORD_TTS_DIR=... EQ_ASR_MODELS=... EQ_PARAKEET=... python scripts/pick_word_takes.py
  --only CARD ... --takes 6 --report /tmp/word-audio-takes.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_audio_asr as ca
import render_audio as ra
from word_take_gate import judge_take

SKIP = ra.ROOT / "content" / "word-audio-skip.json"


def change_tempo(source: Path, target: Path, speed: float) -> None:
    """Change duration without changing pitch; the existing silence padding stays."""
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(source),
                    "-af", f"atempo={speed}", "-ac", "1", "-ar", "22050",
                    "-codec:a", "libmp3lame", "-qscale:a", "5", str(target)], check=True)


def make_inspector(args):
    whisper = ca.recognizer(Path(os.environ["EQ_ASR_MODELS"]), ca.WORD_ASR, args.threads)
    parakeet = ca.parakeet_recognizer(Path(os.environ["EQ_PARAKEET"]), args.threads)
    same_sound = ca.homophones()
    import numpy as np

    def hears(rec, samples):
        stream = rec.create_stream()
        stream.accept_waveform(16000, samples)
        rec.decode_stream(stream)
        return stream.result.text.strip()

    def inspect(path, lemma, card):
        pcm = np.asarray(ca.load_pcm(path), dtype=np.float32)
        alts = ca.alternates(lemma, card, same_sound)
        para = hears(parakeet, pcm)
        if ca.compare_word(lemma, para, alts):
            return {"accepted": False, "verdict": "failed", "whisper": [], "parakeet": para, "variants": []}
        level = float(np.sqrt(np.mean(pcm**2))) or 1e-4
        variants = [pcm, pcm * .7, np.clip(pcm * 1.4, -1, 1),
                    pcm + np.random.default_rng(7).standard_normal(len(pcm)).astype(np.float32) * level * .03,
                    pcm + np.random.default_rng(11).standard_normal(len(pcm)).astype(np.float32) * level * .05,
                    np.concatenate([np.zeros(640, dtype=np.float32), pcm])]
        heard = []
        for samples in variants:
            transcript = hears(whisper, samples)
            heard.append(transcript)
            if ca.compare_word(lemma, transcript, alts) and not ca.needs_parakeet(lemma, transcript):
                return judge_take(lemma, heard, para, alts)
        return judge_take(lemma, heard, para, alts)

    return inspect


def main(inspect_take=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--takes", type=int, default=6)
    ap.add_argument("--only", nargs="+")
    ap.add_argument("--fresh", action="store_true")
    ap.add_argument("--threads", type=int, default=2)
    ap.add_argument("--speakers", nargs="+", type=int, default=[0], help="Kokoro US female speaker candidates: 0, 1, 3, 4")
    ap.add_argument("--pad-candidates", action="store_true", help="also check a candidate with more silence around it")
    ap.add_argument("--report", default="/tmp/word-audio-takes.json")
    args = ap.parse_args()
    if any(x not in (0, 1, 3, 4) for x in args.speakers):
        ap.error("only Kokoro v0.19 US female speakers 0, 1, 3, 4 are allowed")
    if not 0 <= args.takes <= 9:
        ap.error("--takes must be between 0 and 9 distinct requests")
    if not os.environ.get("EQ_PARAKEET"):
        ap.error("EQ_PARAKEET is required: no single-recogniser selection")
    lex = {i["id"]: i for i in json.loads(ra.LEX.read_text())["items"] if not i.get("hidden")}
    words = ra.word_clips(include_skipped=True)["items"]
    ids = args.only or sorted(i for i in words if not words[i].get("recording"))
    if len(set(ids)) != len(ids) or any(i not in words for i in ids):
        ap.error("--only must name distinct visible cards")
    if any(words[i].get("recording") for i in ids):
        ap.error("dictionary recordings must be rebuilt with scripts/word_recordings.py, not synthesised")
    initial_skip = set(json.loads(SKIP.read_text())["ids"])
    skipped = set(initial_skip)
    rendered = json.loads(ra.RENDERED.read_text())
    inspect = inspect_take or make_inspector(args)
    voice = None
    speaker_map = json.loads(ra.WORD_SPEAKERS.read_text())
    report = {"voice": ra.WORD_VOICE, "policy": "Parakeet exact once; all six Whisper variants exact, pure target repetitions, or quote as one quotation mark; no acoustic fallback or waivers", "cards": []}
    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="eq-word-takes-") as temp:
        tmp = Path(temp)
        for n, card in enumerate(ids, 1):
            item = words[card]
            lemma = lex[card]["lemma"]
            record = {"id": card, "lemma": lemma, "say": item["say"], "attempts": [], "accepted": False}
            selected = {}
            active_speaker = item.get("speaker", ra.WORD_VOICE["speaker"])

            def try_clip(path, kind, method):
                result = inspect(path, lemma, card)
                record["attempts"].append({"speed": kind, "speaker": active_speaker, "method": method, **result})
                if not result["accepted"] and args.pad_candidates:
                    padded = tmp / "padded.mp3"
                    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
                                    "-af", "adelay=300:all=1,apad=pad_dur=0.6,asetpts=N/SR/TB",
                                    "-ac", "1", "-ar", "22050", "-codec:a", "libmp3lame", "-qscale:a", "5", str(padded)], check=True)
                    result = inspect(padded, lemma, card)
                    method += ", +300ms lead/+600ms tail"
                    record["attempts"].append({"speed": kind, "speaker": active_speaker, "method": method, **result})
                    path = padded
                if result["accepted"]:
                    target = tmp / f"{card}-{kind}-accepted.mp3"
                    shutil.copyfile(path, target)
                    selected[kind] = (target, method, {"speaker": active_speaker, **result})
                    return True
                return False

            normal = ra.ROOT / item["audio"]
            slow = ra.ROOT / item["audioSlow"]
            # Reuse only clips rendered from this exact pronunciation, not an old
            # Piper override that merely shares the card id.
            if not args.fresh and rendered.get(item["audio"]) == ra.text_hash(item["say"]):
                for path, kind in [(normal, "normal"), (slow, "slow")]:
                    if path.exists():
                        try_clip(path, kind, "existing")

            def slow_from_normal():
                if "slow" in selected:
                    return True
                cand = tmp / "slow-from-normal.mp3"
                for factor in (1.35, 1.25, 1.2):
                    change_tempo(selected["normal"][0], cand, 1 / factor)
                    if try_clip(cand, "slow", f"accepted normal atempo=1/{factor}"):
                        return True
                return False

            if "normal" in selected:
                slow_from_normal()
            elif "slow" in selected:
                cand = tmp / "normal-from-slow.mp3"
                change_tempo(selected["slow"][0], cand, 1.35)
                try_clip(cand, "normal", "accepted slow atempo=1.35")

            # Kokoro is deterministic: repeated identical requests aren't new takes.
            # Sentence-ending punctuation and duration produce distinct candidates;
            # only the target word is spoken, and every candidate faces the same gate.
            candidates = [(1.0, "."), (1.0, ""), (.95, "."), (1.05, "."), (1.0, "!"), (1.0, ","), (1.0, "?"), (1.0, ":"), (1.0, ";")]
            for speaker in dict.fromkeys([active_speaker, *args.speakers]):
                if len(selected) == 2:
                    break
                if speaker != active_speaker:
                    selected.clear()  # never pair normal/slow from different voices
                active_speaker = speaker
                for scale, ending in candidates[:args.takes]:
                    if len(selected) == 2:
                        break
                    if voice is None:
                        voice = ra.WordVoice(ra.WORD_MODEL, ra.WORD_VOICE["speaker"], [words[i]["say"] for i in ids], threads=args.threads)
                    spoken = voice.placeholder.get(item["say"], item["say"]) + ending
                    wav, cand = tmp / "normal.wav", tmp / "normal.mp3"
                    voice.synth(spoken, wav, scale, active_speaker)
                    ra.to_mp3(wav, cand)
                    if try_clip(cand, "normal", f"Kokoro length_scale={scale}, ending={ending!r}"):
                        if slow_from_normal():
                            break
                        wav, cand = tmp / "slow.wav", tmp / "slow.mp3"
                        voice.synth(spoken, wav, scale * 1.35, active_speaker)
                        ra.to_mp3(wav, cand)
                        if try_clip(cand, "slow", f"Kokoro length_scale={scale * 1.35}, ending={ending!r}"):
                            break
            if len(selected) == 2:
                for kind, dest in [("normal", normal), ("slow", slow)]:
                    src, method, result = selected[kind]
                    shutil.copyfile(src, dest)
                    record[kind] = {"method": method, "sha256": hashlib.sha256(dest.read_bytes()).hexdigest(), **result}
                record["accepted"] = True
                skipped.discard(card)
                if active_speaker == ra.WORD_VOICE["speaker"]:
                    speaker_map["items"].pop(card, None)
                else:
                    speaker_map["items"][card] = active_speaker
                rendered[item["audio"]] = ra.text_hash(item["say"])
            else:
                skipped.add(card)
            ra.WORD_SPEAKERS.write_text(json.dumps(speaker_map, ensure_ascii=False, indent=1) + "\n")
            SKIP.write_text(json.dumps({"note": "Cards still lacking a pair accepted by the dual-recogniser word-take gate. See review/word-audio-ear-check.md.", "ids": sorted(skipped)}, ensure_ascii=False, indent=1) + "\n")
            ra.WORDS.write_text(json.dumps(ra.word_clips(), ensure_ascii=False, indent=1) + "\n")
            ra.RENDERED.write_text(json.dumps(dict(sorted(rendered.items())), indent=1) + "\n")
            report["cards"].append(record)
            report_path.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n")
            print(f"{n}/{len(ids)} {card}: {'accepted' if record['accepted'] else 'unresolved'}", flush=True)

    SKIP.write_text(json.dumps({"note": "Cards still lacking a pair accepted by the dual-recogniser word-take gate. See review/word-audio-ear-check.md and the selection report.", "ids": sorted(skipped)}, ensure_ascii=False, indent=1) + "\n")
    ra.WORDS.write_text(json.dumps(ra.word_clips(), ensure_ascii=False, indent=1) + "\n")
    ra.RENDERED.write_text(json.dumps(dict(sorted(rendered.items())), indent=1) + "\n")
    print(f"Accepted {sum(r['accepted'] for r in report['cards'])}/{len(ids)}; {len(skipped)} cards remain without clips")
    return 0


if __name__ == "__main__":
    sys.exit(main())
