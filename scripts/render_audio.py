#!/usr/bin/env python3
"""Render US Piper audio (normal + slow) for every lexicon item and lesson line.

The bundled voice config asks espeak for generic "en", which is non-rhotic.
We force en-us so the phonemes match the LJSpeech accent and CMUdict.
Heteronyms pass explicit [[phonemes]] so read/live/bow/wind/bass/close
cannot flip sense.

assets/audio/rendered.json records, for every clip, the sha256 of the text
it was actually rendered from. A clip is re-rendered whenever its text no
longer matches that hash, so editing a sentence can never leave an old
recording behind. tests/audio-rendered.mjs fails if the two drift apart.

    python3 scripts/render_audio.py                # render every changed clip
    python3 scripts/render_audio.py --force REL..  # re-render these clips anyway

The voice is PREP/voices/en_US-ljspeech-medium.onnx, or EQ_PIPER_MODEL.
"""
from __future__ import annotations

import hashlib
import json
import re
import os
import subprocess
import sys
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parents[1]
MODEL = Path(os.environ.get("EQ_PIPER_MODEL") or ROOT / "PREP" / "voices" / "en_US-ljspeech-medium.onnx")
RENDERED = ROOT / "assets" / "audio" / "rendered.json"
LEX = ROOT / "content" / "lexicon.json"
LINES = ROOT / "content" / "lines.json"
WORDS = ROOT / "content" / "word-audio.json"
SKIP = ROOT / "content" / "word-audio-skip.json"
OVERRIDES = ROOT / "tests" / "fixtures" / "say-overrides.json"
AUDIO = ROOT / "assets" / "audio"
TMP = Path("/tmp/eq-wav")


def render_text(line: dict) -> str:
    say = line.get("say")
    if isinstance(say, str) and say:
        return say
    return str(line.get("en") or "")


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# Word-only clips (每日抽卡 🔊) whose plain spelling the voice would misread.
WORD_SAY = {
    "a-art": "[[ə]]",
    # The sentence uses the weak form ("[[kən]] I have…"); a card says the word itself.
    "can-verb": "can",
}


def word_say(item: dict, allowed: dict) -> str:
    """Text for the word-only clip: the lemma, or the sentence's own [[override]] for it (read, live, bow…)."""
    if item["id"] in WORD_SAY:
        return WORD_SAY[item["id"]]
    for phonemes in re.findall(r"\[\[([^\]]+)\]\]", item["say"]):
        if item["lemma"].lower() in [w.lower() for w in allowed.get(phonemes, [])]:
            return f"[[{phonemes.rstrip('.')}]]" if phonemes.rstrip(".") in allowed else f"[[{phonemes}]]"
    return item["lemma"]


def word_clips(include_skipped: bool = False) -> dict:
    """content/word-audio.json: one word-only clip per visible card, except those
    in content/word-audio-skip.json (no take passed scripts/pick_word_takes.py).
    include_skipped also lists those: their last take stays on disk for the ear
    check in review/word-audio-ear-check.md, but the app never plays it."""
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    allowed = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    skip = set() if include_skipped else (set(json.loads(SKIP.read_text(encoding="utf-8"))["ids"]) if SKIP.exists() else set())
    items = {}
    for item in lex["items"]:
        if item.get("hidden") or item["id"] in skip:
            continue
        rel = f"assets/audio/words/{item['id']}-word.mp3"
        items[item["id"]] = {
            "audio": rel,
            "audioSlow": rel.replace(".mp3", "-slow.mp3"),
            "say": word_say(item, allowed),
        }
    return {
        "note": "Word-only clips for 每日抽卡. Rendered by scripts/render_audio.py from `say`; listened to by scripts/check_audio_asr.py.",
        "items": items,
    }


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
    for row in word_clips(include_skipped=True)["items"].values():
        add(row["audio"], row["say"], None)
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


def stamp_audio_text_hashes(lex: dict, rendered: dict) -> int:
    """Stamp audioTextSha256 with the text each clip was really rendered from."""
    stamped = 0
    for item in lex["items"]:
        for example in item.get("examples") or []:
            example["audioTextSha256"] = rendered[example["audio"]]
            stamped += 1
        for index, turn in enumerate(item.get("miniDialogue") or []):
            turn.setdefault("audio", f"assets/audio/words/{item['id']}-md{index}.mp3")
            turn.setdefault("audioSlow", f"assets/audio/words/{item['id']}-md{index}-slow.mp3")
            turn["audioTextSha256"] = rendered[turn["audio"]]
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

    WORDS.write_text(json.dumps(word_clips(), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    jobs = clips()
    force = set(sys.argv[sys.argv.index("--force") + 1:]) if "--force" in sys.argv else set()
    rendered = json.loads(RENDERED.read_text(encoding="utf-8")) if RENDERED.exists() else {}
    todo = []
    for job in jobs:
        rel = job["rel"]
        mp3 = ROOT / rel
        mp3_slow = ROOT / rel.replace(".mp3", "-slow.mp3")
        present = all(p.exists() and p.stat().st_size > 400 for p in (mp3, mp3_slow))
        if present and rendered.get(rel) == text_hash(job["say"]) and rel not in force:
            continue
        todo.append(job)
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
        rendered[rel] = text_hash(job["say"])
        if done % 20 == 0:
            print(f"  {done}/{len(todo)}")
    live = {job["rel"] for job in jobs}
    rendered = {rel: rendered[rel] for rel in sorted(rendered) if rel in live}
    RENDERED.write_text(json.dumps(rendered, indent=1) + "\n", encoding="utf-8")
    pad_tree()
    # stamp sha256 of normal word audio
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    for item in lex["items"]:
        path = ROOT / item["audio"]
        if not path.exists():
            raise SystemExit(f"missing {path}")
        item["audioSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    text_stamped = stamp_audio_text_hashes(lex, rendered)
    LEX.write_text(json.dumps(lex, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("sha stamped", len(lex["items"]), "text hashes", text_stamped)


if __name__ == "__main__":
    main()
