# Stage 4 re-audit

**Base:** `main` `f27ba11b` (Merge pull request #5, “Stage 3: natural lines inside the CEFR caps”). No later commit is on `origin/main`.
**Scope:** report only. App code, lesson content, and tests were not edited.
**Lessons read:** all 97, in path order (740 dialogue lines), plus the understand items on the lessons whose gloss and English had drifted, the lexicon detectors, `web/src/sfx.ts`, `web/src/pages.tsx`, `web/src/learner.ts`, and a spread of heroes and cast chips.

## Where the original audit is

`review/acceptance-2026-11-02/audit.md` is not in this tree. It is not on `main` at `f27ba11`, not in any other remote branch, and not in git history. The acceptance work consumed that audit as an attachment named `uploads/audit.md`. The item list below is every finding that work quoted from it: Stage 1 problems 1–5, Stage 2 items 7–8, and the Stage 3 known-issue list Stage 2 was told to copy into the changelog. Item 6 of that numbered list was never quoted in the prompts that remain, so it is not scored here.

The Stage 3 reviewer lines (the ten in `review/stage3/duet-fixes.md` and the seven sentences required before PR #5 was accepted) are checked in a separate table. They are not part of the original audit count.

## How this was checked

- Every dialogue line was read with its Cantonese gloss, in path order.
- Word means were recomputed for all 97 lessons. Caps used by the suite: A1 ≤ 8, A1/A2 ≤ 9.5, A2 ≤ 11, A2/B1 ≤ 12.5, B1 ≤ 14, B1/B2 ≤ 15, B2 ≤ 16.
- Lesson files match `content/lines.json` (0 drifts). No dialogue clip path is missing.
- All 1,556 lesson clips (normal and slow) were probed with `ffprobe`. None fell outside a wide duration band for its word count, and no two different `say` strings share an audio hash.
- `npm test` after `pip install pillow`: **87 pass, 1 skip, 0 fail**. The skip is `piper say matches the taught jewellery and weak forms` because the Piper venv is not on this machine. A first run without Pillow failed three image tests with `No module named 'PIL'`; that was the environment, not the content. Those three pass once Pillow is present. The green detectors do not catch the meaning and quiz bugs below. The Mandarin check in `tests/lexicon-detectors.mjs` only walks lexicon fields.

## Original audit items

| Item | Status | Evidence |
| --- | --- | --- |
| 1. #170 / #150. 236 examples on one skeleton, “Staff logged this X under code …”. | **FIXED** | Zero dialogue or lexicon hits for `Staff logged` or `under code`. `tests/lexicon-detectors.mjs` and `tests/lessons.mjs` cap a slot-stripped skeleton at two lemmas. Both pass. A fresh skeleton group of 4+ content words shared by three or more lemmas: 0. |
| 2. #171. 88 echo mini-dialogues, plus absurd collocations (“Can you engrave this complaint today?”). | **PARTIAL** | `mini-dialogues are not echoes` passes, and that example is gone. The same failure mode is still in lesson English: `w6-l4` (`content/lessons/w6.json:69`) is “because I achieved a queue before lunch.” `d7-l5` (`content/lessons/d7.json:80`) is “Eighty dollars is how much it is…”. `j9-l1` and `j9-l3` (`content/lessons/j9.json:31` and `:53`) are “I listen before I offer a repair” and “I apologize when inconvenience shows, so I understand that you feel sad.” |
| 3. #174. Grammar: modal + past, truncated words, missing objects. | **PARTIAL** | `a modal is not followed by a past-tense verb` passes on the lexicon. No dialogue line matches `can/should/will` + a past form. `w6-l4` is still not a sentence a native speaker would say, and the lesson repeats it in the understand prompt (`w6.json:133`), the chunk example (`w6.json:167`), the shadow hint (`w6.json:190`), and the role-play expect (`w6.json:245`). |
| 4. #173. Cantonese sense mismatches: 實報實銷, 輸送帶, 傳送帶, 安檢篩查. | **PARTIAL** | Those four strings are gone from `content/lexicon.json`. 傳送帶 and 安檢篩查 are gone from lessons. 實報實銷 is gone. 輸送帶 remains four times in T20, where the English says “belt” during screening, not “carousel”: `t20-l1` through `t20-l4` (`content/lessons/t20.json:28`, `:39`, `:50`, `:61`). T21’s carousel lines use 行李轉盤 (`t21.json:39`, `:90`). |
| 5. #168. Mandarin in Cantonese fields (的, 把). | **PARTIAL** | Lexicon scan is clean, and the detector passes. It does not read lesson glosses. `t2-l3` (`content/lessons/t2.json:59`) is “請而家把液體放進托盤，並取出電腦。” That is Mandarin (disposal 把, 並取出), not Hong Kong speech. `w9-l3` (`w9.json:80`) uses 我不在. `w11-l2` (`w11.json:66`) and `j18-l4` (`j18.json:87`) end on 嗎. `r4-l3` “你把刀” (`r4.json:54`) is the Cantonese classifier and is fine. The 的 in 的士 and 目的 was left on purpose in Stage 1 and is still only those words. |
| 7. #172. Anti-gaming tests must fail on bad content, not on string presence. Cover lesson near-duplicates, lemma swaps, copied glosses, and exemption lists. | **PARTIAL** | `tests/anti-game.mjs` and `tests/lib/anti-game-check.mjs` exist. The fixture fails; the live lexicon and lessons pass. The two-lemma cap is back. `echoAllow` is gone. What still passes while the content is bad: the Mandarin check ignores lesson glosses, and no test compares a gloss clause to the English clause. `hideGloss: true` hides several drifted lines from the dialogue card and from a casual read. |
| 8. #160 / #175. Changelog and README must not claim quality the audit disproved, and must list the Stage 3 issues. | **PARTIAL** | `CHANGELOG.md` Stage 2 no longer treats “77/77” as a quality score, and `README.md:19` says a green test is not a content score. `README.md:19` still says “Moving GitHub Pages onto Actions is not approved.” That sentence is false on this commit: Pages is built by Actions (`0525019e` / PR #2). The same line still says quiz items are only “on watch.” J17 and R7 now have wrong keys. |
| Mixed hero art, and cast chips that do not match the hero. | **STILL OPEN** | Two drawing systems sit on one path. F1, J1, and R4 are soft flat scenes with a large empty sky and a thin line (`assets/art/lessons/f1.webp`, `j1.webp`, `r4.webp`). W8, W9, W12, T21, and D11 are thick-outline cartoons (`w8.webp`, `w9.webp`, `w12.webp`, `t21.webp`, `d11.webp`). W9’s cast is `sora` and `nina` (`content/lessons/w9.json:11-13`). The Nina chip matches the hero. The Sora chip (`assets/art/refs/sora.webp`) is a small childlike figure in a green shirt. The W9 hero’s second person is a bearded adult in a scarf. W8’s purple-haired person matches the chip; W9’s does not. The saturation test is green and does not see this. |
| Sound toggle is a bare checkbox. | **STILL OPEN** | `web/src/pages.tsx:481-484`. The control is `<input type="checkbox">` beside the label 音效. `ART-STYLE.md` asks for a chunky 52px button, not a native checkbox. |
| Correct / wrong / complete sounds are a 440 Hz oscillator, thinner than the plink, thud, and fanfare in `ART-STYLE.md`. | **PARTIAL** | `web/src/sfx.ts` does not play 440 Hz. Correct is two sines (523 Hz then 659 Hz, `sfx.ts:66-69`). Wrong is a 110 Hz sine (`sfx.ts:71-73`). Complete is a six-note sine fanfare of about 0.88 s (`sfx.ts:89-95`). That is closer to the style guide than one beep, and it is still a Web Audio oscillator, not the recorded plink, thud, and fanfare the guide names. |
| 25 lessons sit over their CEFR band cap. | **FIXED** | Recomputed means: 0 lessons over the cap. Neighbour gaps are at most 2.00 (W5 13.00 → W10 11.00, R5 11.88 → R11 9.88). No two-step drop exceeds 2.5. Band means rise: A1 7.257, A1/A2 9.325, A2 10.654, A2/B1 11.596, B1 12.250, B1/B2 12.333, B2 14.977. The suite’s window test passes. A dip inside those gates is listed under new issues. |
| Quiz items had no new critical bug and stay on watch. | **STILL OPEN** | Indexes are in range, choices are unique, and chunk answers sit in their choice lists (0 structural failures). Two keys now teach the wrong meaning. See new P0s for J17 and R7. |
| Cantonese glosses still drift from the English beyond the terms Stage 1 aligned. | **STILL OPEN** | The pattern is a shortened English line whose gloss still has the old extra clause. Worst visible case is `r7-l5`. The list is under new issues. |
| The path stays 97 lessons. | **FIXED** | `content/path.json` and `content/lessons/` are 97 ids. No new lesson file. |

**Counts for those 14 items: 3 FIXED, 7 PARTIAL, 4 STILL OPEN.**

FIXED: #170/#150, the 25-lesson cap, the 97-lesson freeze.
PARTIAL: #171, #174, #173, #168, #172, #160/#175, the oscillator SFX.
STILL OPEN: mixed heroes and the Sora chip, the bare checkbox, quiz keys, gloss drift.

## Stage 3 reviewer lines (not in the original count)

All 17 are present as specified.

| Line | Status | Now |
| --- | --- | --- |
| f4-l2 | FIXED | “I'm sorry, I did not see you there.” `f4.json:44` |
| f5-l2 | FIXED | “I'm from Hong Kong, and I live here now.” `f5.json:43` |
| r13-l5 | FIXED | “Can I get this to go?” `r13.json:101` |
| w9-l7 | FIXED | “Nine in total, so I'll have five left after this.” `w9.json:120` |
| j16-l3 | FIXED | “The twelfth of June, 2021. Can you also add our initials, G and M?” `j16.json:79` |
| t14-l2 | FIXED | “The next flight to Tokyo leaves at nine tonight.” No “from here.” `t14.json:66` |
| w15-l5 | FIXED | “Could you list me as the owner, and skip reading every line out in the meeting?” `w15.json:68` |
| t21-l6 | FIXED | “Immigration is just through those doors.” `t21.json:79` |
| j11-l5 | FIXED | “If I paid a deposit on a custom piece…” `j11.json:81` |
| r1-l2 | FIXED | “Yes. A table for two, please.” `r1.json:52` |
| r10-l5 | FIXED | “Yes, oat milk, please, and the name Cleo on the cup.” `r10.json:81` |
| t3-m3 | FIXED | “Late checkout is fine. You can leave your bags by the elevator.” `t3.json:112` |
| j8-l1 | FIXED | “…Should I explain the warranty before you go?” `j8.json:33` |
| d9-l2 | FIXED | “…Did you try the cancel button on the screen first?” `d9.json:67` |
| r7-l8 | FIXED | “…heat the soup properly because you waited.” `r7.json:108` |
| r1-l5 | FIXED | “Here's your table. Please have a seat. I'll bring the menu.” `r1.json:82` |

`r7-l8` is fine. The broken dessert line is `r7-l5`, two turns earlier.

## New issues

**14 new findings: 3 P0, 6 P1, 5 P2.** A P1 or P2 row can name several line ids.

### P0

1. **J17 teaches two opposite pearl-care orders, and the key is the one the line does not say.** The spoken line is “Wipe the pearl, then put perfume on.” The gloss under it matches: “先抹乾珍珠，再搽香水。” (`j17.json:114-115`, gloss shown). The lesson goal says the other order: “戴之前噴香水、之後抹乾” (`j17.json:6`). The understand item marks that other order correct (`j17.json:166-172`, `answer: 2`). The chunk gloss is “戴之前噴香水。” (`j17.json:202`). A learner who followed the line is marked wrong.

2. **R7’s dessert line, its goal, and its key invent a free dessert.** English: “Could you bring a dessert for us after you fix that plate?” (`r7.json:78`). Gloss, shown on the card: “換完之後，可唔可以畀我哋兩份免費甜品？” (`r7.json:79`). The can-do is “並接受換菜同免費甜品” (`r7.json:6`). The understand answer is “問換完可唔可以有免費甜品” and the explain says “complimentary 係免費送。” (`r7.json:140-148`). The word complimentary is not in the line.

3. **W6-l4 is not English, and the lesson drills it.** “Last year I handled a busy Saturday at the counter, because I achieved a queue before lunch.” (`w6.json:69`). The gloss tries to repair it (“將條隊處理到好定”, `w6.json:70`, hidden on the card). The same sentence is the understand prompt, the chunk example, the shadow line, and the model the learner is asked to say (`w6.json:133`, `:167`, `:190`, `:245`).

### P1

4. **Glosses still narrate clauses the English no longer says.** Several are hidden on the dialogue card (`hideGloss: true`) and still sit in the file. Visible ones are marked.

   - `d2-l6` hidden (`d2.json:87-92`). English: “I would like to withdraw some cash.” Gloss adds “然後將剩低嘅存入戶口。”
   - `d8-l5` hidden (`d8.json:79-84`). English: “I will be out after six tomorrow.” Gloss adds “請向前門保安攞鎖匙。”
   - `d8-l1` (`d8.json:32` in the dialogue block) adds water on the floor since yesterday. `d8-l3` (`d8.json:54`) adds that it is much worse and that an urgent repair is required.
   - `d1-l2` hidden (`d1.json:43-44`) adds a worse throat. `d1-l4` hidden (`d1.json:65-66`) adds “我對任何藥都冇過敏。” `d1-l7` adds a follow-up visit the English does not mention.
   - `t5-l4` hidden (`t5.json:67-68`). “I think the wallet was stolen.” Gloss adds “所以我亦都要大使館電話。”
   - `d6-l3` (`d6.json:52`). “The only extra symptom is a drug allergy.” Gloss adds that they came in because of the cough and addresses Mei.
   - `d6-l5` (`d6.json:74`). “one tablet twice a day” is glossed “一日兩粒”, which drops “twice.”
   - `r3-l8` hidden (`r3.json:113-114`). “Then I'll take the chicken, please.” Gloss adds “醬汁放一邊。”
   - `r8-l2` (`r8.json:40`). The question is only “What is the full street address for this delivery?” The gloss adds “今午呢份雞由我哋舖頭送。”
   - `j5-l7` **shown** (`j5.json:101-102`). “How does it feel?” is glossed “你戴一陣，感覺點？”
   - `j10-l1` (`j10.json:30`) adds a birthday gift set. `j10-l6` (`j10.json:85`) adds “然後我哋走之前我再決定。”
   - `j12-l3` (`j12.json:55`). “I will describe the gold piece.” Gloss adds pickup tomorrow and holding the piece.
   - `j17-l2` (`j17.json:67`). A six-word line about saltwater lustre is glossed with price and the whole freshwater comparison.
   - `t7-l3` and `t7-l4` (`t7.json:51`, `:62`) add an open fitting room, another colour, and a narrower size.
   - `t10-l1` and `t10-l3` (`t10.json:27`, `:49`) add an empty belt and two small wheels.
   - `t13-l6` (`t13.json:111`) opens the gloss with 會, answering the previous question rather than translating this sentence.

5. **Mandarin and written Chinese left in lesson glosses.** `t2-l3` (`t2.json:59`, hidden) as in item 5 above. Also `w9-l3` 我不在 (`w9.json:80`), `w11-l2` 係嗎 (`w11.json:66`), `j18-l4` 嗎 (`j18.json:87`), and written 並且 / 然後 at `d5-l2` (`d5.json:42`), `f6-l2` (`f6.json:44`), `d2-l6`, `j10-l6`, `w10-l2` and `w10-l8` (`w10.json:68`, `:134`). A shop or office in Hong Kong would say 跟住, 同埋, 呀 / 嘛, 我唔喺度.

6. **English that is grammatical and still not how a person talks.** `d7-l5` (`d7.json:80`) “Eighty dollars is how much it is, and the price covers the blow dry.” `j9-l1` and `j9-l3` (`j9.json:31`, `:53`) as quoted under #171. `t2-l5` (`t2.json:77`) “Your gate is on the left after the shops for you.” `t9-l5` (`t9.json:79`) “the gate change is not posted yet for you.” `w2-l8` (`w2.json:106`) puts “Best regards for now” in a spoken turn.

7. **CEFR shape still dips inside the numeric gates.** D3 is B1 at 9.75 words per line (`d3.json`, eight short lines such as “I will sign the lease and pay the agency fee.”). The lesson three steps back, W11, is 12.12. The drop is 2.38, inside the 2.5 test, and the sentences are A2. R13 is A2 at 8.62, with “Regular, please.” and “For here or to go?” (`r13.json:79`, `:90`), after R9 at 10.25. R11 is 9.88 in A2/B1. B1/B2 is almost flat against B1 (12.333 vs 12.250) because W10 is 11.00.

8. **Art does not match `ART-STYLE.md` as one system.** Besides the open hero/chip item: W8 is a night office (`w8.webp`), and the guide asks for bright daylight on illustrations and forbids dark night harbour chrome on the path. W9’s back wall is a neon rainbow (`w9.webp`); the guide says high chroma, not neon, and no primary-school look. The Sora chip is the primary-school figure. The lantern mascot (`assets/art/mascot-wave.webp`) does match the guide: brass body, teal glass, coral bow, thick ink line.

9. **The Mandarin detector cannot see lesson glosses.** `tests/lexicon-detectors.mjs:164-172` only loops `lex.items`. `t2-l3` is why a green run is not a Cantonese pass.

### P2

10. **`README.md:19` is stale on the deploy.** “Moving GitHub Pages onto Actions is not approved.” The workflow is on `main` and the live URL in that same file is the Pages site.

11. **Small gloss additions that do not change the action.** `t1-l5` (`t1.json:82`) adds “我畀你睇吓資料” in front of the boarding pass. `j2-l1` (`j2.json:42`) adds 今日. `j4-l8` (`j4.json:101`) adds “燈光一照”. `t4-l3` (`t4.json:53`) adds 今日 and 呢條街. `t15-l1` (`t15.json:57`) names one o’clock; the English only says “a late checkout.” `t15-l6` (`t15.json:112`) adds 大約 to three hundred dollars.

12. **Latin left in glosses on purpose for teaching spellings and names.** `f1-l2` Ship/Sheep (`f1.json:49`), `f1-l4` About (`f1.json:69`), `r10-l5` Cleo (`r10.json:81`), `t3-l5` wifi (`t3.json:79`), `r14-l3` “Happy birthday Mei” (`r14.json:78`). These match the “teaching spellings” note already in the changelog. They are not new sense errors.

13. **R7’s chunk pattern is an older, padded sentence.** `r7.json:153` still says “Excuse me please, Ana. I ___ the soup, but the bowl arrived cold at our little table.” The example under it is the current Suki line. The blank still rebuilds `ordered`.

14. **“five five” and “nine nine nine” are numbers, not doubled-word bugs.** `f5-l4` (`f5.json:63`) is a phone number. `j20-l2` (`j20.json:62`) is 999 gold.

## Learner name

**FIXED** for the hardcoded name. Content has no 阿林, 阿琳, or the display name Ling. `tests/learner-name.mjs` passes. The profile token is `{{learner}}` and `{{learner-spell}}` (`web/src/learner.ts:2-24`). F2 line 2 and the `my-det` example store the token (`content/lessons/f2.json:47`, `content/lexicon.json` example “My name is {{learner}}.”). `playAsset` speaks those clips with `speechSynthesis` instead of the mp3 (`web/src/media.ts:48-55`). The cast id `ling` is not shown as a name (`web/src/Lesson.tsx:48-53`). The fallback when onboarding stored nothing is 阿琳 (`learner.ts:6`). That string is not in content.

## Audio

No new mismatch found by the checks that do not need a speech recognizer.

- Every lesson `audio` and `audioSlow` file exists.
- 1,556 clips: duration tracks the word count; no outliers under the band used (about 0.35× to 2.8× an expected length of 0.45 s per word plus a short lead; slow clips use 1.35×).
- No hash is shared by two different `say` strings.
- `example and mini audio matches the rendered-text hash` passes, so lexicon example and mini clips match the text hash stored on the line.
- Twenty dialogue `say` strings differ from `text` only by Piper phoneme brackets, for example `j1-l1` `say` is `Welcome to our [[dʒˈulɹi]] store…` while `text` is “jewellery” (`j1.json:44` area). The words are the same sentence.
- This pass did not run ASR. A clip could still pronounce a phoneme hint badly. The Piper phoneme test is the skipped test.

## What the green suite does not prove

`npm test` is 87 pass / 1 skip on this machine with Pillow installed. It confirms the cap, the neighbour window, the skeleton cap, the echo ban, the lexicon Mandarin ban, the learner-name ban, and the audio-hash ban. It does not compare a gloss to its English sentence, it does not read lesson glosses for 把, and the hero test checks brightness and a face, not whether Sora on W9 is the person on the chip.
