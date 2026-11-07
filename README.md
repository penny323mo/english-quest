# English Quest · 情景英文

Practical, scenario-based English for Cantonese speakers: basics, everyday life, travel, restaurants, work and jewellery retail, each an equal track.

**Live:** https://penny323mo.github.io/english-quest/

iPhone-first PWA. Progress stays on-device (IndexedDB). See `SPEC.md`, `DECISIONS.md`, and the in-app Attributions page for licences.

```bash
npm install
npm test
npm run dev
```

Dev and the production preview both use the Pages base path: http://127.0.0.1:5173/english-quest/

The shipped path is 97 lessons. New lessons stay frozen. Night-1 started with F1, F2, J1, J2, T1, and R1. Teaching audio is Piper `en_US-ljspeech-medium` with the espeak voice forced to `en-us`. Word-only clips for 每日抽卡 use Kokoro v0.19 (Apache-2.0 weights) voice `af` through sherpa-onnx, because LJSpeech garbles many isolated words; `scripts/pick_word_takes.py` keeps only takes that Whisper `small.en` and Parakeet both hear as the word. Piper voices that read lone words well are fine-tuned from the Lessac data, whose licence is research-only, so none is used. Regenerate it with the PREP virtualenv: `npm run audio` only works where that Piper install exists (`PREP_PATH.txt`).

A passing `npm test` does not by itself mean the teaching lines are varied or the glosses match. Every lesson is inside its CEFR word cap. Known issues still open: mixed lesson-hero styles, a bare sound checkbox, thin oscillator sound effects, residual Cantonese gloss drift, and quiz items kept on watch. Moving GitHub Pages onto Actions is not approved.
