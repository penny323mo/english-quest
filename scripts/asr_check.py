#!/usr/bin/env python3
"""Check that each recorded clip says the text the learner sees.

Every clip is transcribed with Whisper base.en. A clip whose transcript is too
far from its text is transcribed again with the larger small.en, and it fails
only when both models disagree with the text. Clips listed in
tests/fixtures/asr-known.json are known TTS mispronunciations waiting for a
human ear check; they are reported but do not fail the run.

    python3 scripts/asr_check.py --all            # every normal-speed clip
    python3 scripts/asr_check.py --changed REF    # clips whose mp3 or text changed since REF
    python3 scripts/asr_check.py --clips a.mp3 b.mp3

Needs: pip install faster-whisper, and ffmpeg on PATH.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEX = ROOT / "content" / "lexicon.json"
LINES = ROOT / "content" / "lines.json"
KNOWN = ROOT / "tests" / "fixtures" / "asr-known.json"
THRESHOLD = 0.25

NUM = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6",
    "seven": "7", "eight": "8", "nine": "9", "ten": "10", "eleven": "11", "twelve": "12",
    "thirteen": "13", "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30", "forty": "40",
    "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90",
    "hundred": "100", "thousand": "1000", "oh": "0",
}
# Spelling variants Whisper writes the American way, plus split/joined forms.
EQ = {
    "jewelry": "jewellery", "harbour": "harbor", "colour": "color", "okay": "ok", "labour": "labor",
    "flavour": "flavor", "centre": "center", "cancelled": "canceled", "metre": "meter", "litre": "liter",
    "millilitres": "milliliters", "millilitre": "milliliter", "travelling": "traveling", "grey": "gray",
    "practise": "practice", "wi": "wifi", "fi": "", "checkout": "check out", "dr": "doctor",
    "mr": "mister", "ms": "miss", "cafe": "café", "neighbour": "neighbor", "apologise": "apologize",
    "realise": "realize", "email": "e mail", "e": "", "mail": "mail", "favourite": "favorite",
    "organise": "organize", "lustre": "luster", "theatre": "theater", "programme": "program",
    "cheque": "check", "kerb": "curb", "tyre": "tire", "anaesthetic": "anesthetic",
}


def norm(text: str) -> list[str]:
    s = text.lower().replace("’", "'").replace("-", " ").replace("%", " percent ").replace("$", " dollars ")
    s = re.sub(r"\{\{[^}]+\}\}", " ", s)
    s = re.sub(r"[^a-z0-9' ]", " ", s)
    toks: list[str] = []
    for t in s.split():
        t = EQ.get(t.strip("'"), t.strip("'"))
        for u in t.split():
            u = NUM.get(u, u)
            if u in {"dollars", "dollar"} and toks and toks[-1] == "dollars":
                continue
            if u:
                toks.append(u)
    out: list[str] = []
    for t in toks:
        if out and t.isdigit() and out[-1].isdigit():
            out[-1] += t
        else:
            out.append(t)
    return [t for t in out if t not in {"dollars", "dollar", "percent"}]


def wer(ref: list[str], hyp: list[str]) -> float:
    sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal")
    return errs / max(1, len(ref))


def clips() -> list[dict]:
    """Every recorded clip with the text shown for it (not the phoneme 'say' text)."""
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    out: list[dict] = []
    seen: set[str] = set()

    def add(rel: str | None, text: str, where: str) -> None:
        if not rel or rel in seen:
            return
        seen.add(rel)
        out.append({"path": rel, "text": text, "where": where})

    for item in lex["items"]:
        add(item["audio"], item["example"], f"{item['id']} main")
        for i, ex in enumerate(item.get("examples") or []):
            add(ex.get("audio"), ex["en"], f"{item['id']} e{i}")
        for i, turn in enumerate(item.get("miniDialogue") or []):
            add(turn.get("audio"), turn["en"], f"{item['id']} md{i}")
    for line in lines:
        if line.get("runtimeTts"):
            continue  # spoken by the device voice with the learner's name, not a recording
        add(line["audio"], line["text"], line["id"])
    return out


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decode(path: Path):
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "quiet", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.float32)


class Transcriber:
    def __init__(self, cache: Path | None, threads: int) -> None:
        self.models: dict[str, object] = {}
        self.threads = threads
        self.cache_path = cache
        self.cache: dict[str, str] = {}
        if cache and cache.exists():
            for row in cache.read_text(encoding="utf-8").splitlines():
                if row.strip():
                    rec = json.loads(row)
                    self.cache[rec["key"]] = rec["text"]

    def __call__(self, path: Path, model: str) -> str:
        key = f"{model}:{sha(path)}"
        if key in self.cache:
            return self.cache[key]
        if model not in self.models:
            from faster_whisper import WhisperModel

            self.models[model] = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=self.threads)
        beam = 1 if model == "base.en" else 5
        segs, _ = self.models[model].transcribe(
            decode(path), language="en", beam_size=beam, without_timestamps=True,
            condition_on_previous_text=False, vad_filter=False,
        )
        text = " ".join(s.text.strip() for s in segs)
        self.cache[key] = text
        if self.cache_path:
            with self.cache_path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({"key": key, "text": text}, ensure_ascii=False) + "\n")
        return text


def changed_since(ref: str, all_clips: list[dict]) -> list[dict]:
    names = subprocess.run(
        ["git", "diff", "--name-only", ref, "--", "assets/audio"], cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout.split()
    touched = {n.replace("-slow.mp3", ".mp3") for n in names}
    # A text edit without a re-render is caught by tests/audio-text-hash.mjs, so mp3 changes are enough here.
    return [c for c in all_clips if c["path"] in touched]


def main() -> int:
    ap = argparse.ArgumentParser()
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true")
    group.add_argument("--changed", metavar="REF")
    group.add_argument("--clips", nargs="+")
    ap.add_argument("--slow", action="store_true", help="also check the -slow clip of each selected clip")
    ap.add_argument("--cache", type=Path, default=None)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--report", type=Path, default=None)
    args = ap.parse_args()

    every = clips()
    if args.all:
        chosen = every
    elif args.changed:
        chosen = changed_since(args.changed, every)
    else:
        want = {p.replace("-slow.mp3", ".mp3") for p in args.clips}
        chosen = [c for c in every if c["path"] in want]
    if args.slow or args.changed or args.clips:
        chosen = chosen + [dict(c, path=c["path"].replace(".mp3", "-slow.mp3"), where=c["where"] + " slow") for c in chosen]
    known = json.loads(KNOWN.read_text(encoding="utf-8")) if KNOWN.exists() else {}
    tr = Transcriber(args.cache, args.threads)

    failures, allowed, fixed = [], [], []
    for n, clip in enumerate(chosen, 1):
        path = ROOT / clip["path"]
        if not path.exists():
            failures.append({**clip, "why": "missing file"})
            continue
        ref = norm(clip["text"])
        first = tr(path, "base.en")
        if wer(ref, norm(first)) <= THRESHOLD:
            if clip["path"] in known:
                fixed.append(clip["path"])
            continue
        second = tr(path, "small.en")
        score = wer(ref, norm(second))
        if score <= THRESHOLD:
            if clip["path"] in known:
                fixed.append(clip["path"])
            continue
        row = {**clip, "base": first, "small": second, "wer": round(score, 2)}
        base_path = clip["path"].replace("-slow.mp3", ".mp3")
        (allowed if clip["path"] in known or base_path in known else failures).append(row)
        if n % 200 == 0:
            print(f"  {n}/{len(chosen)}", flush=True)

    print(f"checked {len(chosen)} clips: {len(failures)} fail, {len(allowed)} known (awaiting a human ear check)")
    for row in allowed:
        print(f"  known  {row['path']}  text={row['text']!r}  heard={row['small']!r}")
    for path in fixed:
        print(f"  now passes, remove from asr-known.json: {path}")
    for row in failures:
        print(f"  FAIL   {row['path']} ({row['where']})\n         text : {row['text']}\n         base : {row.get('base')}\n         small: {row.get('small')}")
    if args.report:
        args.report.write_text(json.dumps({"failures": failures, "known": allowed, "fixed": fixed}, ensure_ascii=False, indent=1))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
