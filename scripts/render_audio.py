#!/usr/bin/env python3
"""Render US Piper audio (normal + slow) for every lexicon item and lesson line.

The bundled voice config asks espeak for generic "en", which is non-rhotic.
We force en-us so the phonemes match the LJSpeech accent and CMUdict.
Heteronyms pass explicit [[phonemes]] so read/live/bow/wind/bass/close
cannot flip sense.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import wave
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "PREP" / "voices" / "en_US-ljspeech-medium.onnx"
LEX = ROOT / "content" / "lexicon.json"
LINES = ROOT / "content" / "lines.json"
AUDIO = ROOT / "assets" / "audio"
TMP = Path("/tmp/eq-wav")


def clips() -> list[dict]:
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    out = []
    for item in lex["items"]:
        out.append(
            {
                "rel": item["audio"],
                "say": item["say"],
                "sha_id": item["id"],
            }
        )
    for line in lines:
        out.append({"rel": line["audio"], "say": line["say"], "sha_id": None})
    return out


def synth(voice: PiperVoice, text: str, wav_path: Path, scale: float) -> None:
    cfg = SynthesisConfig(length_scale=scale)
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav_path), "wb") as wf:
        voice.synthesize_wav(text, wf, syn_config=cfg)


def to_mp3(wav_path: Path, mp3_path: Path) -> None:
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(wav_path),
            "-ac", "1", "-ar", "22050",
            "-codec:a", "libmp3lame", "-qscale:a", "5",
            str(mp3_path),
        ],
        check=True,
    )


def main() -> None:
    voice = PiperVoice.load(str(MODEL))
    voice.config.espeak_voice = "en-us"
    # Sanity: past-read must contain ɛ and must not be iː.
    ph = "".join(voice.phonemize("Yesterday I [[ɹˈɛd]] the book.")[0])
    if "ɛ" not in ph:
        raise SystemExit(f"heteronym phoneme override failed: {ph}")
    present = "".join(voice.phonemize("I [[ɹˈid]] the news every day.")[0])
    if "ɛd" in present.replace("ˈ", ""):
        raise SystemExit(f"present read looks like past: {present}")
    print("phoneme check ok", ph)

    jobs = clips()
    print(f"clips {len(jobs)} x2")
    TMP.mkdir(exist_ok=True)
    done = 0
    for job in jobs:
        rel = job["rel"]
        slow_rel = rel.replace(".mp3", "-slow.mp3")
        mp3 = ROOT / rel
        mp3_slow = ROOT / slow_rel
        if mp3.exists() and mp3.stat().st_size > 400 and mp3_slow.exists() and mp3_slow.stat().st_size > 400:
            done += 1
            continue
        stem = rel.replace("/", "_").replace(".mp3", "")
        wav = TMP / f"{stem}.wav"
        wav_s = TMP / f"{stem}-slow.wav"
        synth(voice, job["say"], wav, 1.0)
        synth(voice, job["say"], wav_s, 1.35)
        to_mp3(wav, mp3)
        to_mp3(wav_s, mp3_slow)
        done += 1
        if done % 20 == 0:
            print(f"  {done}/{len(jobs)}")
    # stamp sha256 of normal word audio
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    for item in lex["items"]:
        path = ROOT / item["audio"]
        if not path.exists():
            raise SystemExit(f"missing {path}")
        item["audioSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    LEX.write_text(json.dumps(lex, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("sha stamped", len(lex["items"]))


if __name__ == "__main__":
    main()
