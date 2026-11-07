# Recovering the 114 missing word recordings

Base: `8f3b7e4add20e4831e090683d84db08d997c0683` (after #39).

**111 cards restored; 750 of 753 visible cards now have a normal/slow word pair.**
`a-art`, `fee-noun` and `led-verb` remain unavailable. Their checked example
sentences are unchanged and still play. No sentence recordings, existing accepted
word recordings, lexicon text or progress data were changed.

See [the per-card audit](word-audio-selection.json) for the exact selected file
hashes, methods, all six Whisper transcripts per speed, Parakeet output and failed
candidate attempts. [The listening checklist](word-audio-ear-check.md) links each
remaining original file and lists every restored card. These are machine checks;
this work does not claim that a human listened to every recording.

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

## Remaining three

- **a /ə/**: isolated weak-form synthesis remains unreliable. Substituting the
  strong letter-name /eɪ/ would not match this card.
- **fee**: some unperturbed takes are recognized correctly, but no normal/slow pair
  survives all six variants; `phi`, `fie` and `fear` are not automatic matches.
- **led /lɛd/**: both recognizers often write `lead`, whose two readings make that
  spelling insufficient evidence for the intended vowel. No broad `led → lead`
  exception was added.

## Reproduce selection

Use `sherpa-onnx==2.0.1`, `piper-tts==1.8.0`, NumPy and ffmpeg, with the same
Kokoro v0.19, Whisper small.en and Parakeet TDT 0.6b v2 int8 models as
`.github/workflows/audio-asr.yml`:

```sh
EQ_WORD_TTS_DIR=/path/to/kokoro-en-v0_19 \
EQ_ASR_MODELS=/path/to/asr-models \
EQ_PARAKEET=/path/to/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 \
python scripts/pick_word_takes.py --only fee-noun --takes 9 \
  --speakers 0 1 3 4 --pad-candidates --report /tmp/word-audio-takes.json
```

A failed run preserves both original files. Keep the single-run report separate
from the committed 114-card audit; replacing a published clip requires updating
its audit evidence and passing CI again. The audit test checks the actual file
hashes, speaker, pronunciation and saved recognition decisions.
