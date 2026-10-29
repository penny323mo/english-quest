VERDICT: SHIP

Round 4 review of the built app at `http://127.0.0.1:4174/english-quest/` (Vite preview, bundle `assets/index-BQ5l4cLz.js`). Viewport 390×844, touch, deviceScaleFactor 2, Chrome headless with a fake mic. `npm test`: 9/9 passed. No CRITICAL, MAJOR, or MINOR findings this round.

The round-3 cache hole is closed. `vite.config.ts:111` sets `dontCacheBustURLsMatching` to `/^assets\/[^/]+-[A-Za-z0-9_]{8}\.[a-z0-9]+$/`, so only a top-level fingerprinted file such as `assets/index-BQ5l4cLz.js` gets `revision:null`. All 434 precached mp3s and all 12 webp files now have a 32-character revision. `assets/audio/words/the-art-vowel.mp3` is revision `4f5b8c578a595568c4f33a5c3325ba27`, which is the MD5 of the file on disk. `cover.webp` and `f1-l1.mp3` match the same way. The year-long `eq-audio` CacheFirst route is gone from `vite.config.ts` and from `sw.js`. `tests/lessons.mjs:98` locks this in. Root `sw.js` and `dist/sw.js` are the same bytes, and port 4174 serves that file. `workbox-9c191d2f.js` returns HTTP 200.

## Rubric

| Dimension | Score | Why |
|---|---|---|
| Art / scene | 9 | Lesson hooks still use the Harbor Glow cast. This commit did not change art. No logos on the walked screens. |
| UI / iPhone | 9 | No horizontal ink past the 390px phone. The path tab bar sits at left 0, right 390, top 786, bottom 844 (height 58) and is fully on screen. |
| Lexicon accuracy | 9 | Lexicon check is green. The spot-check below matches CMU senses, and the Cantonese glosses are natural. |
| Pronunciation UX | 9 | Cards show IPA, syllables, and 弱讀，冇重音 when stress is 0. Slow buttons and mouth notes are on the lesson beats. Jyutping is not used as English phonics. |
| Pedagogy | 9 | All six lessons complete the 12 beats. Skip does not lock a lesson. Role-play is three turns, then 去小測. |
| Speaking | 9 | F1 跟讀 offers 開始講 and 改為錄音比較. Recording produced 播我嘅錄音, and 跟完，去砌句 advanced to 砌句. |
| Review / SRS | 9 | After six lessons, 120 cards were due. 好 left 119 (`hello` → `breath`). Copy says grades do not penalize. Profile: 連續 1 日 · 92 XP · 6/6. |
| Flow / onboarding | 9 | Name, jewellery goal, 15 minutes. All six shipped lessons opened in order. R1 ends at 今晚就到呢度. |
| Perf | 9 | Lighthouse 12.8.2 mobile, re-run this round: performance 0.99, accessibility 1, best-practices 1. This CLI has no PWA category. Offline reload of `#/lesson/F1` showed the hook, and precached `f1-l1.mp3` returned 200. |
| Audio quality | 9 | One Piper en-US voice. Jewellery, of course, table for two, and the before-vowel `the` clips match the cards. |

## What was exercised

- Onboarding, then F1 F2 J1 J2 T1 R1, each through 場景 → 下一課. No soft-lock. Role-play samples show `1 / 3`. R1 sheet: 「今晚你係客人。Ana 喺門口。」
- Review grade, profile, word cards `the-art-vowel`, `our-det`, `jewellery-noun`, `free-adj`, attributions (MIT, CMUdict, CC-Canto, and the 1.35 synth-scale sentence).
- F1 跟讀. This Chrome has `SpeechRecognition`. 改為錄音比較 switches to 錄音，同模範比較. Start shows 停錄音, stop shows 播我嘅錄音, and the advance button stays available.
- Offline: cache `workbox-precache-v2-http://127.0.0.1:4174/english-quest/`, `f1-l1.mp3` hit, HTTP 200.
- Overflow method: every text-node `Range` client rect against the phone, plus `scrollWidth > clientWidth` on visible/auto overflow, on every lesson beat, the path, review, and the word list. Zero offenders. Document and phone `scrollWidth` stayed 390 on the word cards and attributions too.
- Secrets: commit `3b3e48f` touches only the changelog, `sw.js`, the workbox runtime, `vite.config.ts`, and `tests/lessons.mjs`. No `.env` or token.

## Spot-check (Piper en-us phones vs the card)

| Entry | Card | Phones of `say` | Verdict |
|---|---|---|---|
| the-art-vowel | /ði/ stress 0 | ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː | Match. No /ðə/. UI: 弱讀，冇重音, and the note says the clip says /ði/ once. |
| the-art | /ðə/ stress 0 | ðə sˈaʊnd ɪz ʃˈɔːɹt | Match. Gloss 英文冠詞，子音前面弱讀. CMU `DH AH0`. |
| to-prep | /tə/ stress 0 | … tə hˈɑːŋ kˈɑːŋ | Match. |
| a-art | /ə/ stress 0 | ə ˈteɪbəl fɚ ˈtu | Match. |
| of-prep | /ˈʌv/ | ʌv kˈɔːɹs | Citation match. |
| of-course-phrase | /əv ˈkɔɹs/ | əv kˈɔɹs | Match. |
| for-prep | /ˈfɔɹ/ | fɔːɹ | Match. |
| table-for-two-phrase | /ə ˈteɪ.bəl fɚ ˈtu/ | ə ˈteɪbəl fɚ ˈtu plˈiːz | Match. Not fɔ. |
| our-det | /ˈaʊ.ɚ/, one chip “our” | sentence ˌaʊɚ | Match. UI is one syllable. |
| your-det | /ˈjʊɹ/ | jʊɹ | Match. |
| jewellery-noun | /ˈdʒul.ɹi/, jewel + ry | dʒˈulɹi, no əl | Match. |
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
| hello-intj | /hə.ˈloʊ/ stress 2 | həlˈoʊ | Match. |
| again-adv | /ə.ˈɡɛn/ stress 2 | ɐɡˈɛn | Match. |
| here-adv | /ˈhɪɹ/ | hˈɪɹ | Match. |
| wine-noun / vine-noun | /ˈwaɪn/ /ˈvaɪn/ | wˈaɪn / vˈaɪn | Match. |
| boarding-noun | /ˈbɔɹ.dɪŋ/ | bˈɔːɹdɪŋ | Match. |
