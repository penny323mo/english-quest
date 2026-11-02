# Stage 5 changelog

Base: `main` `f27ba11b`. No new lesson. The path stays 97.

## WebKit full lesson

`e2e/full-lesson.mjs` finishes F1 at 390×844 in WebKit and Chromium: real taps, including the hear, shadow, role-play, quiz, and sound audio buttons, through 搞掂, then a reload. XP and `progress.F1` have to still be there, and the path has to show the XP and 完成.

Headless WebKit on this machine played all 36 clips and reached the result screen. It did not crash. The player was still doing the thing that faults WebKit’s media pipeline on iOS Safari: one `Audio` element, `currentTime = 0` before metadata, and a new `src` while the previous mp3 is opening. `playAsset` now swaps in a fresh element and releases the old one. `stopAudio` does not seek until `readyState >= 1`. Sound-effect oscillators disconnect when they end, and the audio context closes on `pagehide`.

## Content

- J17’s care line, goal, understand key, and chunk now follow “wipe the pearl, then put perfume on.”
- R7’s dessert gloss, goal, and understand key ask for a dessert after the plate is fixed. They no longer say two free desserts. The spoken line is unchanged.
- W6-l4 is “Last year I handled a busy Saturday at the counter, and I cleared the queue before lunch.” The understand item, chunk, shadow line, and role-play model use that sentence.
- D3 is a B1 viewing: rent and utilities, a one-month deposit if you sign today, the agency fee, and the written notice before the deposit. Eight lines, 96 words, mean 12.00. Neighbours and the band means still rise.
- Gloss sweep: dropped clauses, numbers, and items the English does not say (allergy on d1-l4, the bank deposit on d2-l6, the key and the guard on d8-l5, the embassy phone, the fitting room, the empty belt, the two wheels, and the others in the lesson diff). Spoken Cantonese replaces 然後, 並且, 並, 嗎, 把, and 我不在 in lesson glosses.
- Unnatural spoken lines were rewritten without cutting them down to dodge a detector: d7-l5, j9-l1, j9-l3, t2-l5, t9-l5, and w2-l8.

Fourteen clips whose `say` changed were re-rendered with Piper `en_US-ljspeech-medium` at normal and slow speed. Gloss-only lines kept their audio.

## Detectors

`tests/content-correctness.mjs`:

- Cantonese-vs-Mandarin on lesson glosses, goals, understand items, chunks, and quiz copy, not only the lexicon.
- Gloss/English agreement on numbers, dosage (one tablet twice a day), extra items, and clause markers (`because` / `but`, and written 然後 / 並且). Three reviewed exemptions are in `tests/fixtures/gloss-exemptions.json`, each with a reason.
- Every listen key is the lemma, every order key is a phrase in the lesson, and every understand or translation key that quotes a line cannot reverse that line or add a number or item.

A fixture of the old dessert gloss, the Mandarin security line, the reversed pearl key, and “一日兩粒” for one tablet twice a day fails those checks.
