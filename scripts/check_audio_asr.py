#!/usr/bin/env python3
"""Check that every recorded clip says the text it is shown with.

Each clip is transcribed with an offline Whisper model (sherpa-onnx) and
compared with its on-screen text. A match passes. Whisper mishears this Piper
voice in the same places every time (shop as shark, water as war), so a
transcript that differs is not proof on its own: the shown text is rendered
afresh with the same voice and pipeline, and the clip fails only when it is
acoustically far from that fresh render (MFCC + dynamic time warping). Clips
that say another sentence sit far above the threshold; re-renders of the same
text sit well below it. A single wrong word is caught without audio by
tests/audio-rendered.mjs. Clips in tests/fixtures/asr-known.json are reported
but do not fail the run.

Models: the sherpa-onnx Whisper exports sherpa-onnx-whisper-base.en (sentences)
and sherpa-onnx-whisper-small.en (word-only clips, which base.en mishears too
often alone) from https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models.
Point EQ_ASR_MODELS (or --models) at the folder that holds them, EQ_PIPER_MODEL
(or --voice) at the en_US-ljspeech-medium.onnx the sentences were rendered with,
and EQ_WORD_TTS_DIR (or --word-voice) at the folder of the voice in
content/word-audio.json (Kokoro kokoro-en-v0_19).
A word-only clip is compared strictly (compare_word), with the reviewed
homophones in tests/fixtures/word-homophones.json.

    python3 scripts/check_audio_asr.py                 # every clip
    python3 scripts/check_audio_asr.py --only rel ...  # just these clips
    python3 scripts/check_audio_asr.py --changed main  # clips whose text or mp3 changed since main

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
WORDS = ROOT / "content" / "word-audio.json"
KNOWN = ROOT / "tests" / "fixtures" / "asr-known.json"
# Word-only clips are heard by a stronger model than sentences: base.en mishears a
# lone short word too often to tell a good take from a bad one.
WORD_ASR = "small.en"
HOMOPHONES = ROOT / "tests" / "fixtures" / "word-homophones.json"

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


def _homophone_table(data: dict | None) -> dict:
    low = lambda d: {k.lower(): [v.lower() for v in vals] for k, vals in (d or {}).items()}
    data = data or {}
    return {"words": low(data.get("words")), "cards": low(data.get("cards"))}


def word_recheck(job: dict, old_table: dict, new_table: dict, rules_changed: bool) -> bool:
    """Whether --changed must listen to this word-only clip again although its text and
    mp3 did not change: the gate it passed changed (the checker or the word voice), or
    the homophones it may match did."""
    if not job.get("word"):
        return False
    if rules_changed:
        return True
    card = job["where"].rsplit(" ", 1)[0]
    return alternates(job["text"], card, old_table) != alternates(job["text"], card, new_table)


def homophones() -> dict:
    """Reviewed spellings a recogniser may write for a lone word that sound the same:
    `words` by lemma (tea as "T", pearl as "purl") and `cards` by card id, for a
    heteronym card whose reading has its own homophone (bass the pitch as "base").
    Only for word-only clips."""
    if not HOMOPHONES.exists():
        return _homophone_table(None)
    return _homophone_table(json.loads(HOMOPHONES.read_text(encoding="utf-8")))


def alternates(lemma: str, card_id: str | None, same_sound: dict | None = None) -> list[str]:
    table = same_sound if same_sound is not None else homophones()
    return table["words"].get(" ".join(norm(lemma)), []) + table["cards"].get((card_id or "").lower(), [])


def compare_word(lemma: str, heard: str, alts: list[str] = ()) -> list[str]:
    """Stricter than compare for a word-only clip: an exact match after norm (which
    applies the listed spelling variants), or a reviewed homophone. No word is waved
    through as a function word (the heard as "that" fails) and there is no
    similarity score (water heard as "waiter" fails)."""
    want, got = norm(lemma), norm(heard)
    if not got:
        return [f"{' '.join(want)}→∅"]
    # Exact only (after norm's listed spelling variants, colour/color): no similarity
    # score, which passed different words (water as "waiter", price as "prize").
    if "".join(want) == "".join(got):
        return []
    if " ".join(got) in alts or "".join(got) in alts:
        return []
    return [f"{' '.join(want)}→{' '.join(got)}"]


def render_text(line: dict) -> str:
    say = line.get("say")
    return say if isinstance(say, str) and say else str(line.get("en") or "")


def clips() -> list[dict]:
    """Every recorded clip with the text a learner sees next to it."""
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    out: list[dict] = []
    seen: set[str] = set()

    def add(rel: str | None, shown: str, say: str, where: str, ref: str | None = None) -> None:
        if not rel or rel in seen:
            return
        seen.add(rel)
        if "{{learner" in say:
            return  # the device voice speaks the learner's name (web/src/learner.ts needsRuntimeSpeech)
        row = {"rel": rel, "text": shown, "say": say, "where": where, "word": where.endswith(" word")}
        if ref:
            row["ref"] = ref
        out.append(row)

    for item in lex["items"]:
        add(item["audio"], item.get("example") or item["lemma"], item["say"], f"{item['id']} main")
        for i, ex in enumerate(item.get("examples") or []):
            add(ex.get("audio"), ex["en"], render_text(ex), f"{item['id']} ex{i}")
        for i, turn in enumerate(item.get("miniDialogue") or []):
            rel = turn.get("audio") or f"assets/audio/words/{item['id']}-md{i}.mp3"
            add(rel, turn["en"], render_text(turn), f"{item['id']} md{i}")
    for line in lines:
        if line.get("runtimeTts"):
            continue  # the device voice speaks this line
        add(line["audio"], line["text"], line["say"], line["id"])
    # Word-only clips for 每日抽卡: the card shows the lemma.
    lemma = {item["id"]: item["lemma"] for item in lex["items"]}
    words = json.loads(WORDS.read_text(encoding="utf-8")) if WORDS.exists() else {"items": {}}
    for item_id, row in words["items"].items():
        # A word clip's [[phonemes]] are a reviewed pair for exactly that word
        # (tests/audio-rendered.mjs + tests/fixtures/say-overrides.json), and the
        # plain spelling is the other reading (bass, read, close). Compare it with a
        # fresh render of those phonemes, so a bad take is caught, not the heteronym.
        add(row["audio"], lemma.get(item_id, ""), row["say"], f"{item_id} word", row["say"] if "[[" in row["say"] else None)
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
    """Clips whose text or mp3 differs from the version at ref."""
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
    for row in (old_json("content/word-audio.json") or {"items": {}})["items"].values():
        old.setdefault(row["audio"], row["say"])
    diff = subprocess.run(
        ["git", "diff", "--name-only", ref, "--", "assets/audio"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.split()
    touched = {rel.replace("-slow.mp3", ".mp3") for rel in diff}
    # A change to the word gate re-checks the word clips it affects, though none of
    # their text or audio changed: the checker itself, the word voice, or a homophone.
    checker_changed = bool(subprocess.run(
        ["git", "diff", "--name-only", ref, "--", "scripts/check_audio_asr.py"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.strip())
    old_words = old_json("content/word-audio.json") or {}
    new_words = json.loads(WORDS.read_text(encoding="utf-8")) if WORDS.exists() else {}
    rules_changed = checker_changed or old_words.get("voice") != new_words.get("voice")
    old_table = _homophone_table(old_json("tests/fixtures/word-homophones.json"))
    new_table = homophones()
    return [
        j for j in jobs
        if old.get(j["rel"]) != j["say"] or j["rel"] in touched or word_recheck(j, old_table, new_table, rules_changed)
    ]


# Distance between a clip and a fresh render of its text. Over all 4,227 clips,
# re-renders of the same text measured 1.1-1.75; clips that said a different
# sentence measured 1.9-3.4. Clips whose say forces phonemes (a table for two)
# can sit above the line too; those are listed in tests/fixtures/asr-known.json.
DTW_MAX = 1.8

# A word-only clip whose transcript is off may still pass if it is near-identical to a
# fresh render of the same word in the same voice, and that render is heard as the
# word. CI's Whisper sometimes doubles a lone word ("Floor Floor") that it hears right
# on a fresh render. Kokoro re-renders of one word measured 0.33-0.65; the closest
# different words measured 0.88 (price/prize, pen/pin), the rest over 1.0. Homophones
# (wine/whine, 0.40) are the same word to the ear anyway.
WORD_DTW_MAX = 0.7


def word_acoustic_ok(r: dict, alts: list[str]) -> bool:
    """A word-only clip that was misheard passes only as a near copy of a render that
    is heard as its word (see WORD_DTW_MAX)."""
    return r.get("distance", 99) <= WORD_DTW_MAX and not compare_word(r["text"], r.get("refBase", ""), alts)


def similarity(a: str, b: str) -> float:
    x, y = norm(a), norm(b)
    if not x and not y:
        return 1.0
    return difflib.SequenceMatcher(None, x, y, autojunk=False).ratio()


def _mel_dct():
    import numpy as np

    sr, nfft, n = 16000, 512, 40
    hz_to_mel = lambda f: 2595 * np.log10(1 + f / 700)
    mel_to_hz = lambda m: 700 * (10 ** (m / 2595) - 1)
    bins = np.floor((nfft + 1) * mel_to_hz(np.linspace(hz_to_mel(60), hz_to_mel(7600), n + 2)) / sr).astype(int)
    fb = np.zeros((n, nfft // 2 + 1))
    for i in range(1, n + 1):
        lo, mid, hi = bins[i - 1], bins[i], bins[i + 1]
        fb[i - 1, lo:mid] = (np.arange(lo, mid) - lo) / max(mid - lo, 1)
        fb[i - 1, mid:hi] = (hi - np.arange(mid, hi)) / max(hi - mid, 1)
    dct = np.cos(np.pi / n * (np.arange(n) + 0.5)[None, :] * np.arange(1, 14)[:, None])
    return fb, dct


def mfcc(path: Path):
    import numpy as np

    x = load_pcm(path)
    energy = np.convolve(x**2, np.ones(160) / 160, "same")
    voiced = np.where(energy > energy.max() * 1e-3)[0]
    if len(voiced):
        x = x[voiced[0] : voiced[-1] + 1]  # drop the lead-in and tail silence
    frame, hop = 400, 160
    x = np.pad(x, (0, max(0, frame - len(x))))
    frames = np.stack([x[i * hop : i * hop + frame] for i in range(1 + (len(x) - frame) // hop)]) * np.hamming(frame)
    fb, dct = _mel_dct()
    c = np.log((np.abs(np.fft.rfft(frames, 512)) ** 2) @ fb.T + 1e-8) @ dct.T
    return (c - c.mean(0)) / (c.std(0) + 1e-8)


def dtw_distance(a: Path, b: Path) -> float:
    import numpy as np

    x, y = mfcc(a), mfcc(b)
    cost = np.sqrt(((x[:, None, :] - y[None, :, :]) ** 2).sum(-1))
    n, m = cost.shape
    acc = np.full((n + 1, m + 1), np.inf)
    acc[0, 0] = 0.0
    for i in range(1, n + 1):
        row, prev, c = acc[i], acc[i - 1], cost[i - 1]
        for j in range(1, m + 1):
            row[j] = c[j - 1] + min(prev[j], row[j - 1], prev[j - 1])
    return float(acc[n, m] / (n + m))


class WordReference:
    """Fresh renders of word-only clips with their own voice (render_audio.WORD_VOICE)."""

    def __init__(self, folder: Path, says: list[str]):
        sys.path.insert(0, str(ROOT / "scripts"))
        import render_audio as ra

        self.ra = ra
        self.voice = ra.load_word_voice(says, folder)
        self.tmp = Path(os.environ.get("TMPDIR", "/tmp")) / "eq-asr-ref"
        self.tmp.mkdir(parents=True, exist_ok=True)

    def mp3(self, job: dict) -> Path:
        slow = job["rel"].endswith("-slow.mp3")
        stem = self.tmp / job["rel"].replace("/", "_")
        wav, mp3 = stem.with_suffix(".wav"), stem
        self.voice.synth(job.get("ref") or job["text"], wav, 1.35 if slow else 1.0)
        self.ra.to_mp3(wav, mp3)
        return mp3


class Reference:
    """Render the on-screen text with the app's Piper voice, through the same mp3 pipeline."""

    def __init__(self, model: str, speaker: int | None = None):
        from piper import PiperVoice

        self.voice = PiperVoice.load(model)
        self.voice.config.espeak_voice = "en-us"
        self.speaker = speaker
        self.tmp = Path(os.environ.get("TMPDIR", "/tmp")) / "eq-asr-ref"
        self.tmp.mkdir(parents=True, exist_ok=True)

    def mp3(self, job: dict) -> Path:
        import wave
        from piper.config import SynthesisConfig

        slow = job["rel"].endswith("-slow.mp3")
        stem = self.tmp / job["rel"].replace("/", "_")
        wav, mp3 = stem.with_suffix(".wav"), stem
        text = job.get("ref") or re.sub(r"\{\{learner(-spell)?\}\}", "Ling", job["text"])
        with wave.open(str(wav), "wb") as wf:
            self.voice.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=1.35 if slow else 1.0, speaker_id=self.speaker))
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", "adelay=180:all=1,apad=pad_dur=0.2",
             "-ac", "1", "-ar", "22050", "-codec:a", "libmp3lame", "-qscale:a", "5", str(mp3)],
            check=True,
        )
        return mp3


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default=os.environ.get("EQ_ASR_MODELS", ""))
    ap.add_argument("--voice", default=os.environ.get("EQ_PIPER_MODEL", ""), help="Piper en_US-ljspeech-medium.onnx")
    ap.add_argument("--word-voice", default=os.environ.get("EQ_WORD_TTS_DIR", ""), help="folder of the word-only clips' voice (content/word-audio.json `voice`, Kokoro)")
    ap.add_argument("--only", nargs="*", help="clip paths (assets/audio/...) to check")
    ap.add_argument("--changed", metavar="REF", help="only clips whose text or mp3 changed since this git ref")
    ap.add_argument("--slow", action="store_true", help="also check the -slow twin of each clip")
    ap.add_argument("--json", metavar="FILE", help="write every result to this file")
    ap.add_argument("--reuse", metavar="FILE", help="reuse base.en transcripts from an earlier --json run (unchanged clips only)")
    ap.add_argument("--threads", type=int, default=os.cpu_count() or 2)
    args = ap.parse_args()
    if not args.models:
        sys.exit("set EQ_ASR_MODELS or --models to the folder with the sherpa-onnx Whisper models")
    if not args.voice:
        sys.exit("set EQ_PIPER_MODEL or --voice to the Piper voice the clips were rendered with")
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
    reuse = {}
    if args.reuse:
        for r in json.loads(Path(args.reuse).read_text(encoding="utf-8")):
            reuse[(r["rel"], r["say"])] = r["base"]

    # 1. base.en on a sentence clip, small.en on a word-only clip: a match with the
    #    text passes straight away.
    first = recognizer(folder, "base.en", args.threads)
    word_rec = recognizer(folder, WORD_ASR, args.threads) if any(j["word"] for j in jobs) else None
    same_sound = homophones()
    results = []
    for n, job in enumerate(jobs, 1):
        if job["word"]:
            heard = transcribe(word_rec, ROOT / job["rel"])
            card = job["where"].rsplit(" ", 1)[0]
            results.append(dict(job, base=heard, problems=compare_word(job["text"], heard, alternates(job["text"], card, same_sound))))
        else:
            heard = reuse.get((job["rel"], job["say"])) or transcribe(first, ROOT / job["rel"])
            results.append(dict(job, base=heard, problems=compare(job["text"], heard)))
        if n % 200 == 0:
            print(f"  {n}/{len(jobs)}", flush=True)
    suspects = [r for r in results if r["problems"]]
    words = sum(1 for r in results if r["word"])
    print(
        f"heard as their text: {len(results) - len(suspects)} / {len(results)} "
        f"(sentences by base.en, {words} word-only clips by {WORD_ASR}); {len(suspects)} compared with a fresh render"
    )
    if not suspects:
        print(f"checked {len(results)} clips: 0 fail")
        return 0

    # 2. The transcript differs: compare the clip with a fresh render of the shown text,
    #    in the voice the clip was made with.
    ref = Reference(args.voice)
    word_ref = None
    if any(r["word"] for r in suspects):
        if not args.word_voice:
            sys.exit("set EQ_WORD_TTS_DIR or --word-voice to the word clips' voice folder")
        word_ref = WordReference(Path(args.word_voice), [r.get("ref") or r["text"] for r in suspects if r["word"]])
    for n, r in enumerate(suspects, 1):
        fresh = (word_ref if r["word"] else ref).mp3(r)
        r["refBase"] = transcribe(word_rec if r["word"] else first, fresh)
        r["distance"] = round(dtw_distance(ROOT / r["rel"], fresh), 3)
        if n % 100 == 0:
            print(f"  fresh render {n}/{len(suspects)}", flush=True)
    for r in results:
        if not r["problems"]:
            r["ok"] = True
        elif r["word"]:
            # A word clip passes on sound only as a near copy (WORD_DTW_MAX, far tighter
            # than a sentence's DTW_MAX) of a fresh render that is itself heard as the word.
            card = r["where"].rsplit(" ", 1)[0]
            r["ok"] = word_acoustic_ok(r, alternates(r["text"], card, same_sound))
        else:
            r["ok"] = r["distance"] <= DTW_MAX

    failed, waived = [], []
    for r in results:
        if not r["ok"]:
            (waived if r["rel"] in known else failed).append(r)
    for label, rows in (("KNOWN (ear check)", waived), ("FAIL", failed)):
        for r in rows:
            print(
                f"{label}: {r['rel']} [{r['where']}] distance {r['distance']} > {WORD_DTW_MAX if r['word'] else DTW_MAX}\n"
                f"  text:        {r['text']}\n  clip heard:  {r['base']}\n  fresh heard: {r['refBase']}"
            )
    if args.json:
        Path(args.json).write_text(json.dumps(results, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"checked {len(results)} clips: {len(failed)} fail, {len(waived)} known")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
