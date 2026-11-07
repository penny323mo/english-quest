# Recovering the 114 missing word recordings

Base: `8f3b7e4add20e4831e090683d84db08d997c0683` (after #39).

**All 114 restored; all 753 visible cards have a normal/slow word pair.**
The first 111 recovered pairs use the unchanged dual-recogniser selection policy.
The final three use licensed US dictionary recordings by Dvortygirl, with source
and derivation verification. This is a distinct verification method, **not** an
ASR pass or a human listening claim. Sentence recordings and progress are unchanged.

See [the per-card audit](word-audio-selection.json) for selected file hashes,
methods and diagnostic transcripts, and [the listening page](word-audio-ear-check.md).

## What changed

- The producer now uses the same Parakeet veto as CI for a pure Whisper repetition.
  It always requires Parakeet agreement, including when Whisper matches directly.
  All six Whisper variants must pass: original, quieter, louder, two seeded noise
  levels and a 40 ms shift. Both speeds must pass before either replaces a file.
- Kokoro is deterministic, so repeating an identical request is not a new take.
  Candidates vary ending punctuation and duration. Slow candidates can instead
  preserve the accepted normal recording's pitch while extending duration by
  1.2, 1.25 or 1.35; extra silence is also checked as a distinct candidate.
- Word-only pronunciation overrides repair Piper-specific phonemes that do not
  transfer well to Kokoro. Sentence pronunciation overrides are unchanged. The
  weak `/ðə/` and vowel-before `/ði/` cards remain distinct.
- 106 restored cards keep `af`. Five use other US female voices in the **same
  Kokoro v0.19 model**: `chew`, `else`, `with` use `af_bella` (1), `lustre` uses
  `af_sarah` (3), and vowel-before `the` uses `af_sky` (4). Both speeds always use
  the same speaker. Overrides are recorded in `content/word-audio-voices.json`;
  rendering, CI references and the attribution page honor them. No new model or
  Lessac-derived voice was introduced.
- Reviewed exact homophones include `chew/choo`, `wine/whine`, `wrap/rap`,
  `complimentary/complementary` and US `gram/Graham`. Phoneme-specific entries
  stay scoped to their card. No fuzzy matching or new `asr-known` exceptions.
- Whisper can render `quote` as a single quotation mark. A mark alone **does not
  pass** the word comparator: Parakeet must explicitly hear `quote`, once. Missing,
  disagreeing or repeating Parakeet output fails without acoustic fallback.
- Changing a card speaker, the renderer or the CI model pins schedules the affected
  word recordings for ASR again, even when their text and MP3 bytes did not change.

## Final three: cause and resolution

- **a /ə/**: isolated weak-form synthesis was garbled. The original was heard as
  "This"/"But". Strong letter-name /eɪ/ would not match this card. Use the
  dictionary's explicitly labelled **US unstressed a** recording.
- **fee /fiː/**: the original produced "Feed"/"Feet" and "Fade"/"Feat"; replacement
  TTS pairs were unstable. Use the dictionary's complete US **fee** recording.
- **led /lɛd/**: recognisers often write "lead", an ambiguous spelling. Use the
  dictionary recording labelled **led**, rather than allowing every "lead" result.

Sources and license: [a](https://commons.wikimedia.org/wiki/File:En-us-a-unstressed.ogg),
[fee](https://commons.wikimedia.org/wiki/File:En-us-fee.ogg),
[led](https://commons.wikimedia.org/wiki/File:En-us-led.ogg), all by
[Dvortygirl](https://commons.wikimedia.org/wiki/User:Dvortygirl),
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
Original Ogg files are committed in `scripts/audio-sources/`; the six adapted
MP3s retain CC BY-SA 3.0. The attribution screen names each source and the changes.
The whole utterance is retained. Normal: mono 22.05 kHz MP3, 180 ms leading and
200 ms trailing silence. Slow: pitch-preserving 1.35x speech duration, then padding.

`python3 scripts/word_recordings.py` recreates all six. CI checks the dictionary
label mapping, source/output hashes, then independently recreates and compares
the decoded audio. Even changing the output hash cannot bless substituted speech.
Results are counted as `dictionary`; no new homophones or ASR waivers were added.
These checks establish provenance and preservation of the dictionary recording;
they do not independently prove its linguistic correctness or replace human listening.

Local recogniser diagnostics for the selected files:

| Card | Normal Whisper / Parakeet | Slow Whisper / Parakeet |
|---|---|---|
| a | uh / Hmm. | uh / Yeah. |
| fee | fee / C | fee / C |
| led | lead / Red | LED / Lead |

These disagreements are retained in the audit, not reported as ASR successes.
Changing the source, labels or adaptation requires source/license review again.

## Reproduce selection

Use `sherpa-onnx==2.0.1`, `piper-tts==1.8.0`, NumPy and ffmpeg, with the same
Kokoro v0.19, Whisper small.en and Parakeet TDT 0.6b v2 int8 models as
`.github/workflows/audio-asr.yml`:

```sh
EQ_WORD_TTS_DIR=/path/to/kokoro-en-v0_19 \
EQ_ASR_MODELS=/path/to/asr-models \
EQ_PARAKEET=/path/to/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 \
python scripts/pick_word_takes.py --only chew-verb --takes 9 \
  --speakers 0 1 3 4 --pad-candidates --report /tmp/word-audio-takes.json
```

A failed run preserves both original files. Keep the single-run report separate
from the committed 114-card audit; replacing a published clip requires updating
its audit evidence and passing CI again. Dictionary recordings are excluded from
`pick_word_takes.py` so synthesis cannot silently overwrite them. The audit test checks the actual file
hashes, speaker, pronunciation and saved recognition decisions.
