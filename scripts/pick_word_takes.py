#!/usr/bin/env python3
"""Keep only word-only clips (每日抽卡 🔊) that speech recognition hears as the word.

Piper renders differently each time, and a single isolated word is short enough
that a poor take is common. scripts/check_audio_asr.py falls back to comparing a
clip with a fresh render when Whisper mishears it, but for one word that
comparison is not reliable (re-renders of the same word measured up to 2.12,
different words down to 1.87, either side of its 1.8 line). So a word clip is
kept only when Whisper base.en transcribes it as the word, both normal and slow,
which is the check's deterministic pass. The word voice (render_audio.WORD_VOICE, Kokoro) is
heard by Whisper small.en (check_audio_asr.WORD_ASR), compared strictly with the
reviewed homophones (check_audio_asr.compare_word). With EQ_PARAKEET set, NVIDIA
Parakeet (an independent recogniser) has to agree as well.

A take must also survive small changes to the audio (quieter, louder, faint noise
with two seeds, a 40 ms shift): CI's machines decode with slightly different
numerics, and a take that is only just heard as the word can come out differently
there and fail.

A failing take is re-rendered up to --takes times. Words that never pass go in
content/word-audio-skip.json: 每日抽卡 still draws them, without the word 🔊. Their last take stays on disk
for the ear check (review/word-audio-ear-check.md). With no EQ_PARAKEET set, the
gate is Whisper alone (what CI checks).

    EQ_WORD_TTS_DIR=… EQ_ASR_MODELS=… [EQ_PARAKEET=…] python3 scripts/pick_word_takes.py [--takes 6] [--only id …]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_audio_asr as ca  # noqa: E402
import render_audio as ra  # noqa: E402

SKIP = ra.ROOT / "content" / "word-audio-skip.json"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--takes", type=int, default=6)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--fresh", action="store_true", help="render new takes even when the clip on disk passes (after a voice change)")
    args = ap.parse_args()

    voice = ra.load_word_voice()
    speaker = ra.WORD_VOICE["speaker"]
    whisper = ca.recognizer(Path(os.environ["EQ_ASR_MODELS"]), ca.WORD_ASR, os.cpu_count() or 2)
    same_sound = ca.homophones()
    parakeet = None
    if os.environ.get("EQ_PARAKEET"):
        import sherpa_onnx

        p = Path(os.environ["EQ_PARAKEET"])
        parakeet = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=str(p / "encoder.int8.onnx"), decoder=str(p / "decoder.int8.onnx"), joiner=str(p / "joiner.int8.onnx"),
            tokens=str(p / "tokens.txt"), model_type="nemo_transducer", num_threads=os.cpu_count() or 2,
        )

    lex = {item["id"]: item for item in json.loads(ra.LEX.read_text(encoding="utf-8"))["items"]}
    skip = json.loads(SKIP.read_text(encoding="utf-8")) if SKIP.exists() else {"ids": []}
    # Cards in this run get a fresh chance; with --only, the others keep their place in the skip list.
    keep_skipped = [i for i in skip["ids"] if args.only and i not in args.only]
    skip["ids"] = keep_skipped
    SKIP.write_text(json.dumps(skip, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    words = ra.word_clips()["items"]
    ids = args.only or sorted(words)

    import numpy as np

    noise = np.random.default_rng(7).standard_normal(16000 * 30).astype(np.float32)
    noise2 = np.random.default_rng(11).standard_normal(16000 * 30).astype(np.float32)

    def hears(rec, samples) -> str:
        stream = rec.create_stream()
        stream.accept_waveform(16000, samples)
        rec.decode_stream(stream)
        return stream.result.text.strip()

    def heard_ok(path: Path, lemma: str, item_id: str) -> bool:
        alts = ca.alternates(lemma, item_id, same_sound)
        pcm = np.asarray(ca.load_pcm(path), dtype=np.float32)
        level = float(np.sqrt(np.mean(pcm**2))) or 1e-4
        # CI decodes with slightly different numerics, so a take must also be heard
        # right when quieter, louder, faintly noisy (two seeds) and shifted by 40 ms.
        shifted = np.concatenate([np.zeros(640, dtype=np.float32), pcm])
        variants = [
            pcm, pcm * 0.7, np.clip(pcm * 1.4, -1, 1),
            pcm + noise[: len(pcm)] * level * 0.03, pcm + noise2[: len(pcm)] * level * 0.05, shifted,
        ]
        if any(ca.compare_word(lemma, hears(whisper, v), alts) for v in variants):
            return False
        return parakeet is None or not ca.compare_word(lemma, hears(parakeet, pcm), alts)

    tmp = ra.TMP
    tmp.mkdir(exist_ok=True)
    failed = []
    last_heard: dict[str, str] = {}
    for n, item_id in enumerate(ids, 1):
        row, lemma = words[item_id], lex[item_id]["lemma"]
        ok_all = True
        for rel, scale in ((row["audio"], 1.0), (row["audioSlow"], 1.35)):
            mp3 = ra.ROOT / rel
            if not args.fresh and mp3.exists() and heard_ok(mp3, lemma, item_id):
                continue
            for _ in range(args.takes):
                wav = tmp / (Path(rel).stem + ".wav")
                cand = tmp / Path(rel).name
                ra.synth(voice, row["say"], wav, scale, speaker)
                ra.to_mp3(wav, cand)
                if heard_ok(cand, lemma, item_id):
                    mp3.write_bytes(cand.read_bytes())
                    break
            else:
                ok_all = False
                # Keep the last take so a person can listen to it.
                mp3.write_bytes(cand.read_bytes())
                last_heard[rel] = ca.transcribe(whisper, mp3)
        if not ok_all:
            failed.append(item_id)
        if n % 50 == 0:
            print(f"  {n}/{len(ids)} words, {len(failed)} without a clear take", flush=True)

    rendered = json.loads(ra.RENDERED.read_text(encoding="utf-8"))
    for item_id in ids:
        rendered[words[item_id]["audio"]] = ra.text_hash(words[item_id]["say"])
    ra.RENDERED.write_text(json.dumps(dict(sorted(rendered.items())), indent=1) + "\n", encoding="utf-8")
    heard_path = ra.TMP / "word-take-heard.json"
    heard_path.write_text(json.dumps(last_heard, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    skip = {
        "note": f"Cards with no word-only clip: no {ra.WORD_VOICE['engine']} {ra.WORD_VOICE['model']} (voice {speaker}) take was heard as the word by Whisper {ca.WORD_ASR}"
        + (" and Parakeet" if parakeet else "")
        + f" in {args.takes} tries. 每日抽卡 still draws them, without the word 🔊. scripts/pick_word_takes.py writes this file.",
        "ids": sorted(set(failed) | set(keep_skipped)),
    }
    SKIP.write_text(json.dumps(skip, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    ra.WORDS.write_text(json.dumps(ra.word_clips(), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"word clips kept {len(ids) - len(failed)} / {len(ids)}; skipped {len(failed)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
