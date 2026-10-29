VERDICT: NOT READY

Round 1 review of the built app at `http://127.0.0.1:4174/english-quest/` (Vite preview of `dist`). Viewport 390×844, touch, deviceScaleFactor 2, Chrome headless with a fake mic. `npm test`: 7/7 passed, including `tests/lexicon-check.mjs`. That suite does not phonemize the `say` lines, so a green lexicon check does not mean the mp3 matches the IPA.

Shipped flow is real: onboarding, path locks, all 12 beats of F1/F2/J1/J2/T1/R1, record-compare, FSRS, word cards, attributions, and an offline lesson. Horizontal overflow at 390px was not found. Ship is blocked by card/audio mismatches and one wrong gloss.

## Rubric

| Dimension | Score | Why |
|---|---|---|
| Art / scene | 9 | Harbor Glow holds across cover, Mei, Tom, Kai, Ana, and the lesson heroes. No logos. Full-bleed. |
| UI / iPhone | 9 | No horizontal ink past the 390px phone. Tabs and CTAs stay tappable. Safe-area padding is in the CSS. |
| Lexicon accuracy | 8 | Heteronyms and the CMU spot-check are right. `the` is glossed as this/that, and `our` is split into the spellings “ow” and “er”. |
| Pronunciation UX | 9 | US audio, slow clips, mouth notes, and minimal pairs are in the lessons. Jyutping is not used to teach English sounds. |
| Pedagogy | 9 | Six complete 12-beat lessons. Skip and a wrong answer do not lock the lesson. |
| Speaking | 9 | Web Speech button plus 錄音比較. F1 and J1 produced 播我嘅錄音 and still advanced. Role-play is 3 turns. |
| Review / SRS | 9 | After six lessons, 120 cards were due. 好 went to 119. Streak 1, 92 XP, no hearts. |
| Flow / onboarding | 9 | Goal, minutes, level. Coming-soon rows are divs, not links. Finishing a lesson opens the next one. |
| Perf | 9 | Lighthouse mobile on localhost: performance 0.99, accessibility 1, best-practices 1. Offline F1 shell and `f1-l1.mp3` came from the Workbox precache (HTTP 200). |
| Audio quality | 8 | One Piper US voice, no Edge/Azure. Jewellery and two phrase cards do not match the printed IPA. |

## What was exercised

- Onboarding (name, jewellery goal, 15 minutes, beginner), path, direct URLs for locked F2/T1/R1, then all six lessons in order through 場景 → 下一課. R1 ends at 今晚就到呢度.
- Hear beat: dialogue mp3 returned 200. Slow toggle is present.
- Shadow: 開始講 is offered; 改為錄音比較 records and shows 播我嘅錄音. 跟完，去砌句 stays available.
- Role-play copy shows `1 / 3`, then two 下一句, then 去小測. No mid-turn gate.
- 發音 sheet is taller than the pane (F1 sheet scrollHeight 726 vs client 607). 去溫習 is below the fold and was reached by scrolling. Not a soft-lock.
- Word cards for thank, our, the, read (past), jewellery. Words search and a scrolled list.
- Review grade, profile, settings (long name, Jyutping toggle, goal change), attributions.
- Service worker scope `http://127.0.0.1:4174/english-quest/`, controlling after reload. Offline reload of `#/lesson/F1` still showed the hook, and the precache contained `f1-l1.mp3`.
- Overflow method: every text-node `Range` client rect against the phone box, plus `scrollWidth > clientWidth` on visible/auto overflow. 58 screens in the first pass and every lesson beat plus the word list in the second. Zero offenders. Document and phone `scrollWidth` stayed 390.
- Secrets: `git ls-files` has no `.env`, key, or token file. `LICENSE` is MIT. Attributions names Wiktionary, CC-Canto, CMUdict, ECDICT, Piper/LJSpeech, ts-fsrs, and local IndexedDB.

## CRITICAL

1. Jewellery audio is three syllables; the card teaches two. `scripts/emit_content.py:526` and `:532` set `JH UW1 L . R IY0` → `/ˈdʒul.ɹi/` (`content/lexicon.json` jewellery-noun / jewelry-noun). The note at `emit_content.py:531` says the teaching form is the two-syllable one. Piper `en-us` phonemizes the `say` line `Welcome to our jewellery store.` as `dʒˈuːəlɹi` (dʒuː.əl.ɹi), which is CMU `JH UW1 AH0 L R IY0`, the variant, not the headword. The same three-syllable form is in `content/lines.json:110` (J1 greeting). A learner reads `/ˈdʒul.ɹi/` and hears `/ˈdʒuː.əl.ɹi/`.
   Fix: pick one form and use it in the card, the note, `review/flags.json` jewellery resolution, and the audio. Either phoneme-force `say` (and the J1 line) to `[[dʒˈulɹi]]` and re-run `python3 scripts/render_audio.py`, or change the ARPAbet to `JH UW1 AH0 L . R IY0`, syllables `jew·el·ry`, IPA `/ˈdʒu.əl.ɹi/`, and rewrite the note so the printed form is the one in the mp3. Add a lexicon test that phonemizes `say` with this voice and fails if jewellery contains `əl`.

2. Two phrase cards print reduced vowels the mp3 does not say.
   - `of-course-phrase` at `scripts/emit_content.py:738-741` is `/əv ˈkɔɹs/` and the note says of is weak `/əv/`. Piper phonemizes `Of course.` as `ʌv kˈɔːɹs` (`/ʌv/`).
   - `table-for-two-phrase` at `scripts/emit_content.py:761-764` is `/ə ˈteɪ.bəl fɚ ˈtu/` and the note says for is weak. Piper says `ɐ tˈeɪbəl fɔːɹ tˈuː` (`/fɔɹ/`, the strong for).
   Fix: phoneme-force those `say` strings to the printed IPA (`[[əv kˈɔɹs]]`, `[[ə ˈteɪbəl fɚ ˈtu]]`) and re-render, or change the IPA and the note to the strong forms the file already contains. Do not leave the note claiming a reduction the clip does not use.

3. `the` is defined as this/that. `scripts/emit_content.py:308-312` and `content/lexicon.json:1204-1206`: glossYue `嗰個／呢個（子音前面，弱讀）`, glossZh `这／那（弱读）`, jyutping `go2 go3`. That is 嗰個, not the article. The card is on the F1 drill. `the-art-vowel` (`emit_content.py:313-316`) has jyutping `go2` and an empty meaning gloss `（元音前面）`.
   Fix: gloss the article as having no Cantonese word, for example `英文冠詞，子音前面弱讀，中文往往唔使譯` / `定冠词（弱读）`. Leave jyutping blank or drop it. Keep the pronunciation note. Do not use 呢個/嗰個 or go2 go3. `this` is already `呢個` at `emit_content.py:400-403`; the two cards must not share a gloss.

## MAJOR

4. `our` syllable chips spell “ow” and “er”, not “our”. `scripts/emit_content.py:404` passes `["ow", "er"]` for `AW1 . ER0`. The card shows those chips under the headword our (`content/lexicon.json:2415-2421`). The IPA `/ˈaʊ.ɚ/` matches CMU’s first entry and the clip (`ˌaʊɚ` in the jewellery sentence). The orthographic split does not.
   Fix: if the careful two-syllable form stays, label a single chip `our` (or `our` / `our`) instead of `ow` + `er`. If the store sentence should teach the usual weak form, switch the headword to CMU `AA1 R` `/ɑɹ/` and keep `/aʊɚ/` as the variant already listed.

5. Unstressed `a` and `the` are described as stressed. `ipa_of` in `scripts/emit_content.py:141-142` sets `primary_at = 1` when no vowel has stress 1, so `DH AH0` and `AH0` are stored as `stress: 1` even though the IPA is `/ðə/` and `/ə/` with no stress mark. `web/src/pages.tsx:263` gold-fills that syllable, and `web/src/pages.tsx:330` always prints `重音喺第 {n} 個音節`.
   Fix: use stress `0` when the ARPAbet has no primary, and render `弱讀，冇重音` with no gold chip.

6. `free` (sense `available`) is glossed with the wrong sense. `scripts/emit_content.py:730-732`: `有得揀；空`. The example `The aisle seat is free.` / `通道位仲有。` is the empty-seat sense. 有得揀 means free to choose. Jyutping `hung1` only matches 空.
   Fix: `空嘅；仲有位` / `空着`. Drop 有得揀.

7. `to-prep` headword is `/ˈtu/` (`emit_content.py:379-382`) but the only clip is the example `I am flying to Hong Kong.`, which Piper says with `tə`. The variant list mentions `/tə/`, and the button is 聽例句, so the file is a true sentence and the printed headword is the citation form.
   Fix: force `[[tˈu]]` in that clip if `/ˈtu/` remains the headword, or make `/tə/` the head IPA and `/tu/` the strong variant so the example button matches the big IPA.

## MINOR

8. `live-adj` gloss uses Mandarin 的: `現場的；直播的` at `scripts/emit_content.py:223`. Use `現場嘅；直播嘅`.
9. R1 role-play intro uses 在: `content/lessons/r1.json:203` `Ana 在門口`. Use 喺.
10. `your-det` teaches CMU’s second entry `Y UH1 R` `/ˈjʊɹ/` (`emit_content.py:408`) and does not list CMU’s first `/jɔɹ/`. The phoneme is valid US and the clip matches `jʊɹ`. Add `/jɔɹ/` as a variant, and a `review/flags.json` row if you want the same trail as want/sure.
11. T1 sound note writes `/ˈbɔr.dɪŋ/` (`content/lessons/t1.json:306`) while the boarding card is `/ˈbɔɹ.dɪŋ/`. Use the card IPA in the note.
12. Slow/normal duration ratios on a 22-clip sample sit between 1.19 and 1.44 (target ~1.35). `with-prep` and `live-adj` are 1.19. Not a wrong word. Re-render only if a later pass wants a tighter 1.35.

## Spot-check (CMUdict 0.7b at `/tmp/cmudict.dict`, plus Piper en-us phonemes of `say`)

These match the card and the clip. Stress and syllables are on the card. Cantonese glosses here are natural.

| id | CMU used | IPA | Clip check |
|---|---|---|---|
| thank-verb | TH AE1 NG K | /ˈθæŋk/ | θˈæŋk |
| with-prep | W IH1 DH | /ˈwɪð/ | wɪð in “I'll go with you.” |
| with-prep-voiceless | W IH1 TH | /ˈwɪθ/ | forced wˈɪθ |
| three-num | TH R IY1 | /ˈθɹi/ | card matches CMU |
| think-verb | TH IH1 NG K | /ˈθɪŋk/ | card matches CMU |
| ship-noun / sheep-noun | SH IH1 P / SH IY1 P | /ˈʃɪp/ /ˈʃip/ | minimal pair kept |
| wine-noun / vine-noun | W AY1 N / V AY1 N | /ˈwaɪn/ /ˈvaɪn/ | forced wˈaɪn / vˈaɪn |
| read-verb-present / past | R IY1 D / R EH1 D | /ˈɹid/ /ˈɹɛd/ | forced ɹˈid / ɹˈɛd |
| live-verb / live-adj | L IH1 V / L AY1 V | /ˈlɪv/ /ˈlaɪv/ | forced lˈɪv / lˈaɪv |
| bow-noun / bow-verb | B OW1 / B AW1 | /ˈboʊ/ /ˈbaʊ/ | separate forced clips |
| wind-noun / wind-verb | W IH1 N D / W AY1 N D | /ˈwɪnd/ /ˈwaɪnd/ | separate forced clips |
| bass-noun-fish / pitch | B AE1 S / B EY1 S | /ˈbæs/ /ˈbeɪs/ | separate cards |
| close-verb / close-adj | K L OW1 Z / K L OW1 S | /ˈkloʊz/ /ˈkloʊs/ | z vs s |
| table-noun | T EY1 B AH0 L | /ˈteɪ.bəl/ | tˈeɪbəl, no /ɹ/ |
| check-in-noun | CH EH1 K + IH1 N | /ˈtʃɛk ˈɪn/ | tʃˈɛkˈɪn, not bare /ʃ/ |
| sure-adj | SH UH1 R | /ˈʃʊɹ/ | ʃˈʊɹ |
| want-verb | W AA1 N T | /ˈwɑnt/ | forced wˈɑnt |
| hello-intj | HH AH0 L OW1 | /hə.ˈloʊ/ | həlˈoʊ |
| again-adv | AH0 G EH1 N | /ə.ˈɡɛn/ | ɐɡˈɛn |
| here-adv | HH IY1 R, NEAR map | /ˈhɪɹ/ | hˈɪɹ, flagged |
| nice-to-meet-phrase | includes T AH0 | /tə/ | tə in the clip |

Failures from the same pass are Critical 1–2 and Major 7, not repeated here.

Cantonese that sounded natural on the same pass: 多謝, 早晨, 只係睇吓, 有咩可以幫到你, 靠窗位, 我哋嘅, 通道位仲有, 呢條頸鏈好靚. The bad glosses are Critical 3 and Major 6.

## Not blockers

No horizontal overflow and no clipped tab bar at 390px. No lesson soft-lock. Lexicon test is green. No secrets in the tree. PWA manifest, apple-touch icon, and offline precache of the F1 line are present. Heteronym bank vowels are the right ones. `check-in` is taught as /tʃ/, and the T1 note says so.
