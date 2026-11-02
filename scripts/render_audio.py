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
import re
import subprocess
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "PREP" / "voices" / "en_US-ljspeech-medium.onnx"
LEX = ROOT / "content" / "lexicon.json"
LINES = ROOT / "content" / "lines.json"
AUDIO = ROOT / "assets" / "audio"
TMP = Path("/tmp/eq-wav")


def render_text(line: dict) -> str:
    say = line.get("say")
    if isinstance(say, str) and say:
        return say
    return str(line.get("en") or "")


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def clips() -> list[dict]:
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    out = []
    seen = set()

    def add(rel: str | None, say: str, sha_id: str | None) -> None:
        if not rel or rel in seen:
            return
        seen.add(rel)
        out.append({"rel": rel, "say": say, "sha_id": sha_id})

    for item in lex["items"]:
        add(item["audio"], item["say"], item["id"])
        for example in item.get("examples") or []:
            add(example.get("audio"), render_text(example), None)
        for index, turn in enumerate(item.get("miniDialogue") or []):
            add(turn.get("audio"), render_text(turn), None)
            if not turn.get("audio"):
                add(f"assets/audio/words/{item['id']}-md{index}.mp3", render_text(turn), None)
    for line in lines:
        add(line["audio"], line["say"], None)
    return out


def synth(voice: PiperVoice, text: str, wav_path: Path, scale: float) -> None:
    cfg = SynthesisConfig(length_scale=scale)
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav_path), "wb") as wf:
        voice.synthesize_wav(text, wf, syn_config=cfg)


# iPhone Safari clips the first phoneme when a clip starts on the transient.
# ~180 ms of lead and ~200 ms of tail keep the speech inside the file.
LEAD_MS = 180
TAIL_SEC = 0.20


def to_mp3(wav_path: Path, mp3_path: Path) -> None:
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(wav_path),
            "-af", f"adelay={LEAD_MS}:all=1,apad=pad_dur={TAIL_SEC}",
            "-ac", "1", "-ar", "22050",
            "-codec:a", "libmp3lame", "-qscale:a", "5",
            str(mp3_path),
        ],
        check=True,
    )


def silence_edges(path: Path) -> tuple[float, float]:
    proc = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-i", str(path),
            "-af", "silencedetect=n=-35dB:d=0.05",
            "-f", "null", "-",
        ],
        capture_output=True,
        text=True,
    )
    text = proc.stderr
    dur_m = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", text)
    dur = 0.0
    if dur_m:
        dur = int(dur_m.group(1)) * 3600 + int(dur_m.group(2)) * 60 + float(dur_m.group(3))
    starts = [float(v) for v in re.findall(r"silence_start: ([0-9.]+)", text)]
    ends = [float(v) for v in re.findall(r"silence_end: ([0-9.]+)", text)]
    lead = ends[0] if starts and starts[0] <= 0.03 and ends else 0.0
    tail = 0.0
    if starts and ends and dur > 0 and abs(ends[-1] - dur) < 0.12:
        tail = max(0.0, ends[-1] - starts[-1])
    return lead, tail


def pad_one(path: Path) -> str:
    lead, tail = silence_edges(path)
    if lead >= 0.14 and tail >= 0.15:
        return "skip"
    tmp = path.with_suffix(".pad.mp3")
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(path),
            "-af", f"adelay={LEAD_MS}:all=1,apad=pad_dur={TAIL_SEC}",
            "-ac", "1", "-ar", "22050",
            "-codec:a", "libmp3lame", "-qscale:a", "5",
            str(tmp),
        ],
        check=True,
    )
    tmp.replace(path)
    return "pad"


def pad_tree() -> None:
    files = sorted(AUDIO.rglob("*.mp3"))
    padded = 0
    with ThreadPoolExecutor(max_workers=8) as pool:
        for status in pool.map(pad_one, files):
            if status == "pad":
                padded += 1
    print(f"padded {padded} / {len(files)}")


def stamp_audio_text_hashes(lex: dict) -> int:
    stamped = 0
    for item in lex["items"]:
        for example in item.get("examples") or []:
            example["audioTextSha256"] = text_hash(render_text(example))
            stamped += 1
        for index, turn in enumerate(item.get("miniDialogue") or []):
            turn.setdefault("audio", f"assets/audio/words/{item['id']}-md{index}.mp3")
            turn.setdefault("audioSlow", f"assets/audio/words/{item['id']}-md{index}-slow.mp3")
            turn["audioTextSha256"] = text_hash(render_text(turn))
            stamped += 1
    return stamped


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
    pad_tree()
    # stamp sha256 of normal word audio
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    for item in lex["items"]:
        path = ROOT / item["audio"]
        if not path.exists():
            raise SystemExit(f"missing {path}")
        item["audioSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    text_stamped = stamp_audio_text_hashes(lex)
    LEX.write_text(json.dumps(lex, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("sha stamped", len(lex["items"]), "text hashes", text_stamped)


if __name__ == "__main__":
    main()
