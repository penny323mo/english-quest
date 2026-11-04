#!/usr/bin/env python3
"""Render US Piper audio (normal + slow) for every lexicon item and lesson line.

Only clips whose mp3 is missing or whose text changed are rendered (see clips()).

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


def clips(lex: dict | None = None, lines: list | None = None) -> list[dict]:
    """Every recorded clip, the text Piper speaks for it, and the records that carry its text hash.

    A clip is (re)rendered whenever its mp3 is missing or the stored audioTextSha256 differs from
    the hash of the text it should say, so editing a sentence can never leave an old recording.
    """
    lex = lex if lex is not None else json.loads(LEX.read_text(encoding="utf-8"))
    lines = lines if lines is not None else json.loads(LINES.read_text(encoding="utf-8"))
    out: list[dict] = []
    by_rel: dict[str, dict] = {}

    def add(rel: str | None, say: str, sha_id: str | None, holder: dict | None) -> None:
        if not rel:
            return
        if rel in by_rel:
            if holder is not None:
                by_rel[rel]["holders"].append(holder)
            return
        job = {"rel": rel, "say": say, "sha_id": sha_id, "holders": [holder] if holder is not None else []}
        by_rel[rel] = job
        out.append(job)

    for item in lex["items"]:
        add(item["audio"], item["say"], item["id"], None)
        for example in item.get("examples") or []:
            add(example.get("audio"), render_text(example), None, example)
        for index, turn in enumerate(item.get("miniDialogue") or []):
            turn.setdefault("audio", f"assets/audio/words/{item['id']}-md{index}.mp3")
            turn.setdefault("audioSlow", f"assets/audio/words/{item['id']}-md{index}-slow.mp3")
            add(turn.get("audio"), render_text(turn), None, turn)
    for line in lines:
        if line.get("runtimeTts"):
            continue  # spoken on the device with the learner's name; nothing to record
        add(line["audio"], line["say"], None, line)
    return out


def stale(job: dict) -> bool:
    mp3 = ROOT / job["rel"]
    slow = ROOT / job["rel"].replace(".mp3", "-slow.mp3")
    if not (mp3.exists() and mp3.stat().st_size > 400 and slow.exists() and slow.stat().st_size > 400):
        return True
    want = text_hash(job["say"])
    return any(holder.get("audioTextSha256") != want for holder in job["holders"])


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

    lex = json.loads(LEX.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    jobs = clips(lex, lines)
    todo = [job for job in jobs if stale(job)]
    print(f"clips {len(jobs)}; rendering {len(todo)} x2")
    TMP.mkdir(exist_ok=True)
    for done, job in enumerate(todo, 1):
        rel = job["rel"]
        stem = rel.replace("/", "_").replace(".mp3", "")
        wav = TMP / f"{stem}.wav"
        wav_s = TMP / f"{stem}-slow.wav"
        synth(voice, job["say"], wav, 1.0)
        synth(voice, job["say"], wav_s, 1.35)
        to_mp3(wav, ROOT / rel)
        to_mp3(wav_s, ROOT / rel.replace(".mp3", "-slow.mp3"))
        for holder in job["holders"]:
            holder["audioTextSha256"] = text_hash(job["say"])
        if done % 20 == 0:
            print(f"  {done}/{len(todo)}")
    for item in lex["items"]:
        path = ROOT / item["audio"]
        if not path.exists():
            raise SystemExit(f"missing {path}")
        item["audioSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    LEX.write_text(json.dumps(lex, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    LINES.write_text(json.dumps(lines, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"rendered {len(todo)}; run python3 scripts/asr_check.py --changed HEAD to check them")


if __name__ == "__main__":
    main()
