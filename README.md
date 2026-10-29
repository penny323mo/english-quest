# English Quest · 情景英文

Scenario-based English learning for Cantonese speakers (jewellery sales, travel, restaurant).

**Live:** https://penny323mo.github.io/english-quest/

iPhone-first PWA. Progress stays on-device (IndexedDB). See `SPEC.md`, `DECISIONS.md`, and the in-app Attributions page for licences.

```bash
npm install
npm test
npm run dev
```

Dev and the production preview both use the Pages base path: http://127.0.0.1:5173/english-quest/

Night-1 ships six lessons (F1, F2, J1, J2, T1, R1). Teaching audio is Piper `en_US-ljspeech-medium` with the espeak voice forced to `en-us`. Regenerate it with the PREP virtualenv: `npm run audio` only works where that Piper install exists (`PREP_PATH.txt`).
