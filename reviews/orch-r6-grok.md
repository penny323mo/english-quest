VERDICT: SHIP

Round 6 review of the built app at `http://127.0.0.1:4174/english-quest/` (Vite preview, bundle `assets/index-BQ5l4cLz.js`). Viewport 390×844, touch, deviceScaleFactor 2, Chrome headless with a fake mic. `npm test`: 9/9 passed. Since round 5 the only commit is `c4983ca`, which adds a changelog note. The app bytes are unchanged. This round re-ran the walk, the tests, the phoneme spot-check, and Lighthouse. No CRITICAL, MAJOR, or MINOR findings.

## Rubric

| Dimension | Score | Why |
|---|---|---|
| Art / scene | 9 | Lesson hooks still use the Harbor Glow cast. No logos on the walked screens. |
| UI / iPhone | 9 | No horizontal ink past the 390px phone. On a fresh path the tab bar is right 390, bottom 844. |
| Lexicon accuracy | 9 | Lexicon check is green. The spot-check matches CMU senses, and the Cantonese glosses are natural. |
| Pronunciation UX | 9 | `hello` shows `/hə.ˈloʊ/` split as hel + lo, with the stress mark on lo. Jyutping, once switched on, reads 「粵拼（只標中文解釋）：nei5 hou2」 and does not relabel the English sounds. |
| Pedagogy | 9 | All six lessons complete the 12 beats. Skip does not lock a lesson. Role-play is three turns, then 去小測. |
| Speaking | 9 | F1 跟讀 offers 開始講 and 改為錄音比較. Recording produced 播我嘅錄音, and 跟完，去砌句 advanced to 砌句. |
| Review / SRS | 9 | After six lessons, 120 cards were due. 好 left 119 (`hello` → `breath`). Copy says grades do not penalize. Profile: 連續 1 日 · 92 XP · 6/6. |
| Flow / onboarding | 9 | Name, jewellery goal, 15 minutes. A fresh path has two links, `#/lesson/F1` and `#/lesson/J1`. The other 19 rows are locked `DIV`s with no href. After the six lessons the profile reads 6/6. |
| Perf | 9 | Lighthouse 12.8.2 mobile, re-run this round: performance 0.99, accessibility 1, best-practices 1. This CLI has no PWA category. Offline reload of `#/lesson/F1` showed the hook, and precached `f1-l1.mp3` returned 200. |
| Audio quality | 9 | One Piper en-US voice. The before-vowel `the` clip is still `ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː` with no extra `/ðə/`. Jewellery, of course, and table for two still match their cards. |

## What was exercised

- Onboarding, then F1 F2 J1 J2 T1 R1, each through 場景 → 下一課 (R1 ends at 今晚就到呢度). No soft-lock. Role-play samples show `1 / 3`. R1 sheet: 「今晚你係客人。Ana 喺門口。」
- Review grade, profile, word card `hello`, settings Jyutping toggle, attributions (MIT, CMUdict, Wiktionary, CC-Canto, ts-fsrs, IndexedDB). Those screens stayed at scrollWidth 390.
- F1 跟讀 record-compare, as above.
- Offline: cache `workbox-precache-v2-http://127.0.0.1:4174/english-quest/`, `f1-l1.mp3` hit, HTTP 200.
- Overflow method: every text-node `Range` client rect against the phone, plus `scrollWidth > clientWidth` on visible/auto overflow, on every lesson beat, the path, review, and the word list. Zero offenders.
- Secrets: the only new file in `c4983ca` is `CHANGELOG.md`.

## Spot-check (Piper en-us phones vs the card)

| Entry | Card | Phones of `say` | Verdict |
|---|---|---|---|
| the-art-vowel | /ði/ stress 0 | ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː | Match. No /ðə/. |
| the-art | /ðə/ stress 0 | ðə sˈaʊnd ɪz ʃˈɔːɹt | Match. Gloss 英文冠詞，子音前面弱讀. |
| to-prep | /tə/ stress 0 | … tə hˈɑːŋ kˈɑːŋ | Match. |
| a-art | /ə/ stress 0 | ə ˈteɪbəl fɚ ˈtu | Match. |
| of-prep | /ˈʌv/ | ʌv kˈɔːɹs | Citation match. |
| of-course-phrase | /əv ˈkɔɹs/ | əv kˈɔɹs | Match. |
| for-prep | /ˈfɔɹ/ | fɔːɹ | Match. |
| table-for-two-phrase | /ə ˈteɪ.bəl fɚ ˈtu/ | ə ˈteɪbəl fɚ ˈtu plˈiːz | Match. |
| our-det | /ˈaʊ.ɚ/ one syllable | sentence ˌaʊɚ | Match. |
| your-det | /ˈjʊɹ/ | jʊɹ | Match. |
| jewellery-noun | /ˈdʒul.ɹi/ | dʒˈulɹi, no əl | Match. |
| free-adj | /ˈfɹi/ | fɹˈiː | Match. Gloss 空嘅；仲有位. |
| thank-verb / think-verb / three-num | /θ/ | θˈæŋk, θˈɪŋk, θɹˈiː | Match. |
| with-prep | /ˈwɪð/ | wɪð | Match. |
| ship-noun / sheep-noun | /ˈʃɪp/ /ˈʃip/ | ʃˈɪp / ʃˈiːp | Match. |
| read present / past | /ˈɹid/ /ˈɹɛd/ | ɹˈid / ɹˈɛd | Match. |
| live verb / adj | /ˈlɪv/ /ˈlaɪv/ | lˈɪv / lˈaɪv | Match. Gloss 現場嘅；直播嘅. |
| wind-noun | /ˈwɪnd/ | wˈɪnd | Match. |
| bass fish / pitch | /ˈbæs/ /ˈbeɪs/ | bˈæs / bˈeɪs | Match. |
| close verb / adj | /ˈkloʊz/ /ˈkloʊs/ | klˈoʊz / klˈoʊs | Match. |
| table-noun | /ˈteɪ.bəl/ | ˈteɪbəl, no ɹ | Match. |
| check-in-noun | /ˈtʃɛk ˈɪn/ | tʃˈɛkˈɪn | Match. |
| sure-adj | /ˈʃʊɹ/ | ʃˈʊɹ | Match. |
| want-verb | /ˈwɑnt/ | wˈɑnt | Match. |
| hello-intj | /hə.ˈloʊ/ stress 2 | həlˈoʊ | Match. On screen: hel hə, lo ˈloʊ, gloss 你好. |
| again-adv | /ə.ˈɡɛn/ stress 2 | ɐɡˈɛn | Match. |
| here-adv | /ˈhɪɹ/ | hˈɪɹ | Match. |
| wine-noun / vine-noun | /ˈwaɪn/ /ˈvaɪn/ | wˈaɪn / vˈaɪn | Match. |
| boarding-noun | /ˈbɔɹ.dɪŋ/ | bˈɔːɹdɪŋ | Match. |
