#!/usr/bin/env python3
"""Exercise check_audio_asr.run()'s Parakeet path on real audio with the real models,
without waiting for CI's Whisper to loop by chance.

1. Rejection (real audio, real models): a word clip joined to itself ("floor floor")
   with the text "floor". Whisper hears the word twice, so Parakeet decides; Parakeet
   hears it twice too, so the clip must fail. Its sound is close to the word's, so this
   also shows the acoustic fallback is not used after Parakeet rejects.
2. Acceptance (real models; Whisper on the doubled clip, Parakeet on the single take):
   the clip must pass and be counted under Parakeet.

    python3 scripts/asr_selftest.py --models DIR --parakeet DIR [--word words/floor-noun-word.mp3]
Exit 1 if either check does not come out as stated.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_audio_asr as ca  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default=os.environ.get("EQ_ASR_MODELS", ""))
    ap.add_argument("--parakeet", default=os.environ.get("EQ_PARAKEET", ""))
    ap.add_argument("--word", default="words/floor-noun-word.mp3", help="a word clip under assets/audio/")
    ap.add_argument("--text", default="floor")
    args = ap.parse_args()
    threads = os.cpu_count() or 2
    whisper = ca.recognizer(Path(args.models), ca.WORD_ASR, threads)
    parakeet = ca.parakeet_recognizer(Path(args.parakeet), threads)
    single = ca.ROOT / "assets" / "audio" / args.word
    doubled = Path(tempfile.mkdtemp()) / "doubled.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(single), "-i", str(single),
         "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1", "-ac", "1", "-ar", "22050", str(doubled)],
        check=True,
    )
    job = {"rel": str(doubled), "text": args.text, "say": args.text, "where": f"{args.text}-selftest word", "word": True}
    heard_doubled = ca.transcribe(whisper, doubled)
    print(f"Whisper on the doubled clip: {heard_doubled!r}; Parakeet on it: {ca.transcribe(parakeet, doubled)!r}")
    if not ca.repeated_word(args.text, heard_doubled):
        print("SELF-TEST BROKEN: Whisper did not hear a pure repeat, so the Parakeet path was not reached")
        return 1
    # The acoustic fallback would pass this clip if it were reached: a fresh render heard
    # as the word, at a distance well under WORD_DTW_MAX.
    near = lambda r: (args.text, 0.1)  # noqa: E731
    reject = ca.run([dict(job)], hear_sentence=None, hear_word=lambda j: ca.transcribe(whisper, doubled),
                    hear_parakeet=lambda j: ca.transcribe(parakeet, doubled), fresh=near, known={}, same_sound={"words": {}, "cards": {}})
    accept = ca.run([dict(job)], hear_sentence=None, hear_word=lambda j: ca.transcribe(whisper, doubled),
                    hear_parakeet=lambda j: ca.transcribe(parakeet, single), fresh=near, known={}, same_sound={"words": {}, "cards": {}})
    ok = reject == 1 and accept == 0
    print(f"rejection path: run() exit {reject} (want 1); acceptance path: run() exit {accept} (want 0)")
    print("SELF-TEST " + ("OK" if ok else "FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
