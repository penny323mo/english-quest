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

## Clause pass

Stage 3 had shortened some English lines and left the old clause in the gloss. This pass put the clause back into the English when the cap allowed it, and trimmed the gloss when the extra clause belonged to another turn.

- J12-l5 again says the caller will collect the bracelet tomorrow after a confirmation.
- W2-l3 again asks to clarify the deadline.
- R8 names the hot delivery. W6-l5 says “That sounds reliable” and the gloss keeps the shop.
- R6-l8 is 發個短訊. T2-l3 is 放入.
- Sentence counts match on all 97 lessons. The check also compares call / attach / confirm / collect and the objects hot, shop, taxi, tomorrow, deadline, stock, and bracelet. 寄…短訊, 一則, and 放進 fail the written-form check.

W2 uses contractions on four neighbouring lines so the restored deadline sentence still sits inside the two-and-a-half-word window. W10 asks “How much store credit should we offer her?” so the B1/B2 band stays above B1.

Twenty-one clips whose `say` changed were re-rendered with Piper. `review/stage5/clause-mismatch.md` lists the before and after. `review/stage5/gloss-pairs30-v2.md` is a new 30-line sample, seed 20261103.
