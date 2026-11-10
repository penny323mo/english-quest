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
Word-only clips (每日抽卡 🔊) use WORD_VOICE instead: LJSpeech garbles many
isolated words (good as "bed", job as "jar"), while it reads them correctly in a
sentence. That voice is Kokoro in PREP/voices/<WORD_VOICE model>/, or EQ_WORD_TTS_DIR.
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

from word_recordings import recordings, render_pair

from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parents[1]
MODEL = Path(os.environ.get("EQ_PIPER_MODEL") or ROOT / "PREP" / "voices" / "en_US-ljspeech-medium.onnx")
# Word-only clips: Kokoro v0.19 (Apache-2.0 weights) voice "af", a US female voice,
# run with sherpa-onnx. Recorded in content/word-audio.json so the checker renders its
# references with the same voice. Piper voices that read lone words well are all
# fine-tuned from the Lessac data, whose licence is research-only.
WORD_VOICE = {"engine": "kokoro", "model": "kokoro-en-v0_19", "speaker": 0}
WORD_MODEL = Path(os.environ.get("EQ_WORD_TTS_DIR") or ROOT / "PREP" / "voices" / WORD_VOICE["model"])
RENDERED = ROOT / "assets" / "audio" / "rendered.json"
LEX = ROOT / "content" / "lexicon.json"
LINES = ROOT / "content" / "lines.json"
WORDS = ROOT / "content" / "word-audio.json"
SKIP = ROOT / "content" / "word-audio-skip.json"
WORD_SPEAKERS = ROOT / "content" / "word-audio-voices.json"
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
    # Word-only Kokoro readings: retain US rhotic vowels and vowel length. The
    # older sentence overrides were tuned for Piper and can misread in Kokoro.
    "allergic-adj": "[[əlˈɜːɹdʒɪk]]",
    "sir-noun": "[[sˈɜːɹ]]",
    "read-verb-present": "[[ɹˈiːd]]",
    "refund-noun": "[[ɹˈiːfʌnd]]",
    "buffet-noun": "[[bəfˈeɪ]]",
    "the-art-vowel": "[[ðˈiː]]",
    "fee-noun": "fee",
    "it-pron": "[[ˈɪt]]",
    "off-adv": "[[ˈɑːf]]",
    "madam-noun": "[[mˈædəm]]",
    "lustre-noun": "[[lˈʌstəɹ]]",
    "return-noun": "[[ɹɪtˈɜːɹn]]",
    "the-art": "[[ðˈə]]",
    "stamp-verb": "stamp",
    "cough-noun": "cough",
    "sorry-adj": "sorry",
    "email-noun": "email",
    "laptop-noun": "laptop",
    "key-card-phrase": "key card",
    "late-checkout-phrase": "late checkout",
    "rose-gold-phrase": "rose gold",
    "savings-account-phrase": "savings account",
    # A lone "a" is read as the letter name /eɪ/, so these phrases give the article's own sound.
    "table-for-two-phrase": "[[ɐ tˈeɪbəl fɚ tˈuː]]",
    "twice-a-day-phrase": "[[twˈaɪs ɐ dˈeɪ]]",
    "times-a-day-phrase": "[[tˈaɪmz ɐ dˈeɪ]]",
    "half-size-phrase": "[[hˈæf ɐ sˈaɪz]]",
    # espeak reads these as the noun "excuse" /s/ and as "resistant" with /s/.
    "excuse-me-phrase": "[[ɛkskjˈuːz mˈiː]]",
    "water-resistant-adj": "[[wˈɔːɾɚ ɹᵻzˈɪstənt]]",
    # espeak's own reading of these lone words is wrong: REB-ook, drowsy with /s/,
    # MACK-ow, out-DOOR, and the verb's re-FILL for the noun.
    "rebook-verb": "[[ɹiːbˈʊk]]",
    "drowsy-adj": "[[dɹˈaʊzi]]",
    "macau-noun": "[[məkˈaʊ]]",
    "outdoor-adj": "[[ˈaʊtdɔːɹ]]",
    "refill-noun": "[[ɹˈiːfɪl]]",
    # Its sentence clip no longer needs an override; the lone word still does.
    "live-verb": "[[lˈɪv]]",
    # The plain word is right here; the old override put the stress on "un".
    "understated-adj": "understated",
    # Kokoro has ɝ, so this card keeps it. The sentence voice does not.
    "alternative-noun": "[[ɔltˈɝnətɪv]]",
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
    external = recordings()
    speakers = json.loads(WORD_SPEAKERS.read_text(encoding="utf-8"))["items"] if WORD_SPEAKERS.exists() else {}
    for item in lex["items"]:
        if item.get("hidden") or item["id"] in skip:
            continue
        rel = f"assets/audio/words/{item['id']}-word.mp3"
        items[item["id"]] = {
            "audio": rel,
            "audioSlow": rel.replace(".mp3", "-slow.mp3"),
            "say": word_say(item, allowed),
        }
        if item["id"] in external:
            items[item["id"]]["recording"] = "wikimedia-commons"
        if item["id"] in speakers:
            items[item["id"]]["speaker"] = speakers[item["id"]]
    return {
        "note": "Word-only clips for 每日抽卡. Synthesised rows use `say` and `voice`; rows marked `recording` use licensed dictionary sources in word-audio-recordings.json. Checked by scripts/check_audio_asr.py.",
        "voice": dict(WORD_VOICE),
        "items": items,
    }


def clips() -> list[dict]:
    lex = json.loads(LEX.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    out = []
    seen = set()

    def add(rel: str | None, say: str, sha_id: str | None, word: bool = False, speaker: int | None = None) -> None:
        if not rel or rel in seen:
            return
        seen.add(rel)
        out.append({"rel": rel, "say": say, "sha_id": sha_id, "word": word, "speaker": speaker})

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
        add(row["audio"], row["say"], None, word=True, speaker=row.get("speaker", WORD_VOICE["speaker"]))
        if row.get("recording"):
            out[-1]["recording"] = row["audio"].removeprefix("assets/audio/words/").removesuffix("-word.mp3")
    return out


def placeholder_word(n: int) -> str:
    """A letters-only lexicon word for the n-th [[phonemes]] say: eqphonemesa, eqphonemesb, …"""
    return "eqphonemes" + "".join(chr(97 + int(d)) for d in str(n))


class WordVoice:
    """Kokoro through sherpa-onnx for word-only clips. sherpa-onnx needs a lexicon for
    Kokoro, so one is built from espeak-ng (en-us, the phonemes Kokoro v0.19 was
    trained on) for every word it will be asked to say. A `[[phonemes]]` say (a
    heteronym's reading) gets a placeholder word mapped to exactly those phonemes."""

    def __init__(self, folder: Path, speaker: int, says: list[str], threads: int = os.cpu_count() or 2):
        import sherpa_onnx
        from piper.phonemize_espeak import EspeakPhonemizer

        self.speaker = speaker
        tokens = {line.rsplit(" ", 1)[0] for line in (folder / "tokens.txt").read_text(encoding="utf-8").splitlines() if line.strip()}
        espeak = EspeakPhonemizer()
        lexicon: dict[str, str] = {}
        self.placeholder: dict[str, str] = {}

        def spell(phonemes: str) -> str:
            kept = [c for c in phonemes if c in tokens and c not in " .,!?"]
            return " ".join(kept)

        for say in says:
            forced = re.fullmatch(r"\[\[([^\]]+)\]\]", say.strip())
            if forced:
                if say in self.placeholder:
                    continue  # two cards share these phonemes (jewellery, jewelry): one entry
                word = placeholder_word(len(self.placeholder))
                self.placeholder[say] = word
                lexicon[word] = spell(forced.group(1))
                continue
            for word in re.findall(r"[A-Za-z']+", say):
                key = word.lower()
                if key not in lexicon:
                    lexicon[key] = spell("".join("".join(s) for s in espeak.phonemize("en-us", key)))
        TMP.mkdir(exist_ok=True)
        lex_path = TMP / "kokoro-words-lexicon.txt"
        lex_path.write_text("".join(f"{w} {p}\n" for w, p in sorted(lexicon.items())), encoding="utf-8")
        self.tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=str(folder / "model.onnx"), voices=str(folder / "voices.bin"), tokens=str(folder / "tokens.txt"),
                data_dir=str(folder / "espeak-ng-data"), lexicon=str(lex_path),
            ),
            num_threads=threads,
        )))

    def synth(self, say: str, wav_path: Path, scale: float, speaker: int | None = None) -> None:
        import numpy as np

        audio = self.tts.generate(self.placeholder.get(say, say), sid=self.speaker if speaker is None else speaker, speed=1.0 / scale)
        wav_path.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(wav_path), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(audio.sample_rate)
            wf.writeframes((np.clip(np.asarray(audio.samples), -1, 1) * 32767).astype(np.int16).tobytes())


def load_word_voice(says: list[str] | None = None, folder: Path | None = None) -> WordVoice:
    if says is None:
        says = [row["say"] for row in word_clips(include_skipped=True)["items"].values()]
    return WordVoice(folder or WORD_MODEL, WORD_VOICE["speaker"], says)


PHONEME_BLOCK = re.compile(r"\[\[(.*?)\]\]")
IPA_VOWELS = set("aeiouæɑɒɔəɚɛɜɝɪʊʌɐᵻ")
# Made-up words that stand in for a [[phonemes]] block while espeak reads the rest of
# the sentence. espeak reads each as one stressed word, so the words around the block
# keep the form they have in the whole sentence. One list starts with a vowel sound and
# one with a consonant, because "the" and "to" change before a vowel.
STAND_INS = {True: ["izzok", "ozzik", "ezzok", "uzzek"], False: ["vezzok", "zobbik", "vizzek", "zebbok"]}


def phonemes_in_context(voice, say: str) -> list[list[str]]:
    """The phonemes for `say`, sentence by sentence, with each [[override]] set into
    the sentence as espeak reads it.

    Piper phonemizes the text on either side of a [[block]] as separate fragments.
    A fragment that ends in "a" is read as the letter name (I have /eɪ/ headache),
    "the" stays /ðə/ before a vowel, "to" and "can" take their strong forms, and a
    comma or full stop straight after the block is dropped, so the next words run on
    (/ˈkænsəlbʌt/). Here the whole sentence is phonemized once with a stand-in word
    where each block goes, and the stand-in's phonemes are then swapped for the block's.
    """
    blocks = PHONEME_BLOCK.findall(say)
    if not blocks:
        return voice.phonemize(say)
    used = {True: 0, False: 0}
    swaps: list[tuple[str, str]] = []

    def stand_in(match: re.Match) -> str:
        phonemes = match.group(1).strip()
        vowel = phonemes.lstrip("ˈˌ")[:1] in IPA_VOWELS
        if used[vowel] >= len(STAND_INS[vowel]):
            raise SystemExit(f"too many [[overrides]] in one clip: {say}")
        word = STAND_INS[vowel][used[vowel]]
        used[vowel] += 1
        swaps.append((word, phonemes))
        return word

    sentences = voice.phonemize(PHONEME_BLOCK.sub(stand_in, say))
    for word, phonemes in swaps:
        want = [p for p in voice.phonemize(word)[0] if p not in "ˈˌ"]
        hits = []
        for sentence in sentences:
            plain = [(i, p) for i, p in enumerate(sentence) if p not in "ˈˌ"]
            for start in range(len(plain) - len(want) + 1):
                if [p for _, p in plain[start:start + len(want)]] == want:
                    first = plain[start][0]
                    while first > 0 and sentence[first - 1] in "ˈˌ":
                        first -= 1  # the stand-in's own stress mark goes with it
                    hits.append((sentence, first, plain[start + len(want) - 1][0] + 1))
        if len(hits) != 1:
            raise SystemExit(f"cannot place [[{phonemes}]] in: {say}")
        sentence, first, end = hits[0]
        # "[[bɹˈeɪslət.]], and": the sentence already has its own punctuation here.
        if end < len(sentence) and sentence[end] in ".,!?;:":
            phonemes = phonemes.rstrip(".,!?;:")
        sentence[first:end] = list(phonemes)
    return sentences


def synth(voice, text: str, wav_path: Path, scale: float, speaker: int | None = None) -> None:
    if isinstance(voice, WordVoice):
        voice.synth(text, wav_path, scale, speaker)
        return
    cfg = SynthesisConfig(length_scale=scale, speaker_id=speaker)
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    sentences = phonemes_in_context(voice, text)
    voice.phonemize = lambda _text: sentences  # for this one call; the class method returns below
    try:
        with wave.open(str(wav_path), "wb") as wf:
            voice.synthesize_wav(text, wf, syn_config=cfg)
    finally:
        del voice.phonemize


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
    external = {f"{card}-word{suffix}.mp3" for card in recordings() for suffix in ("", "-slow")}
    files = sorted(p for p in AUDIO.rglob("*.mp3") if p.name not in external)
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

    previous_words = json.loads(WORDS.read_text(encoding="utf-8")) if WORDS.exists() else {}
    previous_speakers = {r["audio"]: r.get("speaker", (previous_words.get("voice") or {}).get("speaker", 0)) for r in previous_words.get("items", {}).values()}
    WORDS.write_text(json.dumps(word_clips(), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    jobs = clips()
    force = set(sys.argv[sys.argv.index("--force") + 1:]) if "--force" in sys.argv else set()
    rendered = json.loads(RENDERED.read_text(encoding="utf-8")) if RENDERED.exists() else {}
    todo = []
    for job in jobs:
        rel = job["rel"]
        mp3 = ROOT / rel
        mp3_slow = ROOT / rel.replace(".mp3", "-slow.mp3")
        if job.get("recording"):
            todo.append(job)  # six small files: always reproduce their current source recipe
            continue
        present = all(p.exists() and p.stat().st_size > 400 for p in (mp3, mp3_slow))
        voice_changed = job["word"] and (previous_words.get("voice") != WORD_VOICE or previous_speakers.get(rel, job["speaker"]) != job["speaker"])
        if present and rendered.get(rel) == text_hash(job["say"]) and rel not in force and not voice_changed:
            continue
        todo.append(job)
    print(f"clips {len(jobs)}; rendering {len(todo)} x2")
    TMP.mkdir(exist_ok=True)
    word_voice = load_word_voice() if any(job["word"] and not job.get("recording") for job in todo) else None
    for done, job in enumerate(todo, 1):
        rel = job["rel"]
        stem = rel.replace("/", "_").replace(".mp3", "")
        wav = TMP / f"{stem}.wav"
        wav_s = TMP / f"{stem}-slow.wav"
        if job.get("recording"):
            render_pair(job["recording"], ROOT / rel, ROOT / rel.replace(".mp3", "-slow.mp3"))
            rendered[rel] = text_hash(job["say"])
            continue
        v, speaker = (word_voice, job["speaker"]) if job["word"] else (voice, None)
        synth(v, job["say"], wav, 1.0, speaker)
        synth(v, job["say"], wav_s, 1.35, speaker)
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
