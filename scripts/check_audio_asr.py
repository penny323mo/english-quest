#!/usr/bin/env python3
"""Check that every recorded clip says the text it is shown with.

Each clip is transcribed with an offline Whisper model (sherpa-onnx) and
compared with its on-screen text. A clip is reported only when two models
both disagree with the text, because one small model on its own mishears
too often. Clips listed in tests/fixtures/asr-known.json (likely
mispronunciations waiting for a human ear check) are reported but do not
fail the run.

Models: the sherpa-onnx Whisper exports from
https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models
(sherpa-onnx-whisper-base.en and sherpa-onnx-whisper-small.en). Point
EQ_ASR_MODELS at the folder that holds both, or pass --models.

    python3 scripts/check_audio_asr.py                 # every clip
    python3 scripts/check_audio_asr.py --only rel ...  # just these clips
    python3 scripts/check_audio_asr.py --changed main  # clips whose text changed since main

Exit code 1 when any clip outside the known list fails.
"""
from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEX = ROOT / "content" / "lexicon.json"
LINES = ROOT / "content" / "lines.json"
KNOWN = ROOT / "tests" / "fixtures" / "asr-known.json"

# Words Whisper drops or adds freely; an edit made only of these is not a failure.
FUNCTION = set(
    "a an the and to of in on at for is it's its this that i i'm you we he she they "
    "be are was do does it um uh oh so well yes yeah no".split()
)
SPELLING = {
    "jewelry": "jewellery", "color": "colour", "colors": "colours", "harbor": "harbour",
    "gray": "grey", "center": "centre", "favor": "favour", "flavor": "flavour",
    "labor": "labour", "license": "licence", "canceled": "cancelled", "okay": "ok",
    "mr": "mister", "ms": "miz", "mrs": "missus", "dr": "doctor", "st": "street",
    "theater": "theatre", "meter": "metre", "liter": "litre", "milliliter": "millilitre",
    "luster": "lustre", "traveling": "travelling", "traveler": "traveller",
    "anesthetic": "anaesthetic", "cheque": "check", "apologise": "apologize",
}

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def say_number(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        rest = n % 100
        return ONES[n // 100] + " hundred" + ("" if rest == 0 else " " + say_number(rest))
    if n < 1_000_000:
        rest = n % 1000
        return say_number(n // 1000) + " thousand" + ("" if rest == 0 else " " + say_number(rest))
    return " ".join(ONES[int(d)] for d in str(n))


def norm(text: str) -> list[str]:
    t = text.lower().replace("’", "'").replace("{{learner}}", "learner").replace("{{learner-spell}}", "learner")
    t = re.sub(r"\$(\d+)\.00\b", r"\1 dollars", t)
    t = re.sub(r"\$(\d+)\.(\d\d)\b", r"\1 dollars \2", t)
    t = re.sub(r"\$(\d+)", r"\1 dollars", t)
    t = re.sub(r"(\d+)%", r"\1 percent", t)
    t = re.sub(r"(\d),(\d{3})", r"\1\2", t)
    t = re.sub(r"(\d+)(st|nd|rd|th)\b", r"\1", t)
    t = re.sub(r"(\d+):(\d\d)", lambda m: m.group(1) + ("" if m.group(2) == "00" else " " + m.group(2)), t)
    t = re.sub(r"\d+", lambda m: " " + say_number(int(m.group(0))) + " ", t)
    t = re.sub(r"\bo'clock\b", "oclock", t)
    t = re.sub(r"[^a-z' ]+", " ", t.replace("-", " "))
    words = [w.strip("'") for w in t.split()]
    return [SPELLING.get(w, w) for w in words if w]


def close(a: str, b: str) -> bool:
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.8


def compare(text: str, heard: str) -> list[str]:
    """Return the edits that matter, as 'text→heard' strings; empty means a match."""
    want, got = norm(text), norm(heard)
    if want == got or "".join(want) == "".join(got):
        return []
    problems = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, want, got, autojunk=False).get_opcodes():
        if op == "equal":
            continue
        a, b = want[i1:i2], got[j1:j2]
        if all(w in FUNCTION for w in a + b):
            continue
        if "".join(a) == "".join(b):
            continue
        if len(a) == len(b) and all(close(x, y) for x, y in zip(a, b)):
            continue
        problems.append(f"{' '.join(a) or '∅'}→{' '.join(b) or '∅'}")
    return problems


def render_text(line: dict) -> str:
    say = line.get("say")
    return say if isinstance(say, str) and say else str(line.get("en") or "")


def clips() -> list[dict]:
    """Every recorded clip with the text a learner sees next to it."""
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    out: list[dict] = []
    seen: set[str] = set()

    def add(rel: str | None, shown: str, say: str, where: str) -> None:
        if not rel or rel in seen:
            return
        seen.add(rel)
        out.append({"rel": rel, "text": shown, "say": say, "where": where})

    for item in lex["items"]:
        add(item["audio"], item.get("example") or item["lemma"], item["say"], f"{item['id']} main")
        for i, ex in enumerate(item.get("examples") or []):
            add(ex.get("audio"), ex["en"], render_text(ex), f"{item['id']} ex{i}")
        for i, turn in enumerate(item.get("miniDialogue") or []):
            rel = turn.get("audio") or f"assets/audio/words/{item['id']}-md{i}.mp3"
            add(rel, turn["en"], render_text(turn), f"{item['id']} md{i}")
    for line in lines:
        add(line["audio"], line["text"], line["say"], line["id"])
    return out


def load_pcm(path: Path):
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def recognizer(folder: Path, name: str, threads: int):
    import sherpa_onnx

    base = folder / f"sherpa-onnx-whisper-{name}"
    return sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(base / f"{name}-encoder.int8.onnx"),
        decoder=str(base / f"{name}-decoder.int8.onnx"),
        tokens=str(base / f"{name}-tokens.txt"),
        language="en",
        task="transcribe",
        num_threads=threads,
    )


def transcribe(rec, path: Path) -> str:
    stream = rec.create_stream()
    stream.accept_waveform(16000, load_pcm(path))
    rec.decode_stream(stream)
    return stream.result.text.strip()


def changed_since(ref: str, jobs: list[dict]) -> list[dict]:
    """Clips whose rendered text differs from the version at ref."""
    def old_json(rel: str):
        try:
            return json.loads(subprocess.run(["git", "show", f"{ref}:{rel}"], cwd=ROOT, capture_output=True, check=True).stdout)
        except subprocess.CalledProcessError:
            return None

    old_lex, old_lines = old_json("content/lexicon.json"), old_json("content/lines.json")
    old: dict[str, str] = {}
    if old_lex:
        for item in old_lex["items"]:
            old.setdefault(item["audio"], item["say"])
            for ex in item.get("examples") or []:
                old.setdefault(ex.get("audio"), render_text(ex))
            for i, turn in enumerate(item.get("miniDialogue") or []):
                old.setdefault(turn.get("audio") or f"assets/audio/words/{item['id']}-md{i}.mp3", render_text(turn))
    for line in old_lines or []:
        old.setdefault(line["audio"], line["say"])
    return [j for j in jobs if old.get(j["rel"]) != j["say"]]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default=os.environ.get("EQ_ASR_MODELS", ""))
    ap.add_argument("--only", nargs="*", help="clip paths (assets/audio/...) to check")
    ap.add_argument("--changed", metavar="REF", help="only clips whose text changed since this git ref")
    ap.add_argument("--slow", action="store_true", help="also check the -slow twin of each clip")
    ap.add_argument("--json", metavar="FILE", help="write every result to this file")
    ap.add_argument("--threads", type=int, default=os.cpu_count() or 2)
    args = ap.parse_args()
    if not args.models:
        sys.exit("set EQ_ASR_MODELS or --models to the folder with the sherpa-onnx Whisper models")
    folder = Path(args.models)

    jobs = clips()
    if args.only:
        wanted = set(args.only)
        jobs = [j for j in jobs if j["rel"] in wanted]
    if args.changed:
        jobs = changed_since(args.changed, jobs)
    if args.slow:
        jobs = jobs + [dict(j, rel=j["rel"].replace(".mp3", "-slow.mp3")) for j in jobs]
    known = json.loads(KNOWN.read_text(encoding="utf-8")) if KNOWN.exists() else {}

    first = recognizer(folder, "base.en", args.threads)
    results = []
    heard = []
    for n, job in enumerate(jobs, 1):
        heard.append(transcribe(first, ROOT / job["rel"]))
        if n % 200 == 0:
            print(f"  {n}/{len(jobs)}", flush=True)
    for job, text in zip(jobs, heard):
        job = dict(job, base=text, problems=compare(job["text"], text))
        results.append(job)
    suspects = [r for r in results if r["problems"]]
    print(f"base.en: {len(results) - len(suspects)} / {len(results)} match; rechecking {len(suspects)} with small.en")
    if suspects:
        second = recognizer(folder, "small.en", args.threads)
        for r in suspects:
            r["small"] = transcribe(second, ROOT / r["rel"])
            r["problems"] = compare(r["text"], r["small"])

    failed, waived = [], []
    for r in results:
        if not r["problems"]:
            continue
        (waived if r["rel"] in known else failed).append(r)
    for label, rows in (("KNOWN (ear check)", waived), ("FAIL", failed)):
        for r in rows:
            print(f"{label}: {r['rel']} [{r['where']}]\n  text:  {r['text']}\n  base:  {r['base']}\n  small: {r.get('small', '')}\n  diff:  {'; '.join(r['problems'])}")
    if args.json:
        Path(args.json).write_text(json.dumps(results, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"checked {len(results)} clips: {len(failed)} fail, {len(waived)} known")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
