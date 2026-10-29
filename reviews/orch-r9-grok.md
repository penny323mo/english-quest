VERDICT: SHIP

Round 9 review of the built app at `http://127.0.0.1:4174/english-quest/` (Vite preview, bundle `assets/index-BQ5l4cLz.js`). Viewport 390×844, touch, deviceScaleFactor 2, Chrome headless with a fake mic. `npm test`: 9/9 passed (1903 ms). Since round 8 the only commit is `3c13068`, which adds a changelog note. The app bytes are unchanged. This round re-ran the walk, the tests, the phoneme spot-check, Lighthouse, the locked J2 URL, and the sheep card. No CRITICAL, MAJOR, or MINOR findings.

## Rubric

| Dimension | Score | Why |
|---|---|---|
| Art / scene | 9 | Lesson hooks still use the Harbor Glow cast. No logos on the walked screens. |
| UI / iPhone | 9 | No horizontal ink past the 390px phone. Path tab bar: left 0, right 390, top 786, bottom 844, height 58. |
| Lexicon accuracy | 9 | Lexicon check is green. The spot-check matches CMU senses, and the Cantonese glosses are natural. |
| Pronunciation UX | 9 | `sheep` on screen is `/ˈʃip/` on one chip, gloss 羊. Slow buttons and mouth notes are on the lesson beats. Jyutping is not used as English phonics. |
| Pedagogy | 9 | All six lessons complete the 12 beats. Skip does not lock a lesson. Role-play is three turns, then 去小測. |
| Speaking | 9 | F1 跟讀 offers 開始講 and 改為錄音比較. Recording produced 播我嘅錄音, and 跟完，去砌句 advanced to 砌句. |
| Review / SRS | 9 | After six lessons, 120 cards were due. 好 left 119 (`hello` → `breath`). Copy says grades do not penalize. Profile: 連續 1 日 · 92 XP · 6/6. |
| Flow / onboarding | 9 | Jewellery finishes 6/6 and leaves six lesson links. A fresh jewellery profile that opens `#/lesson/J2` before J1 sees 「先完成上一課」. Coming-soon rows stay divs. |
| Perf | 9 | Lighthouse 12.8.2 mobile, re-run this round: performance 0.99, accessibility 1, best-practices 1. This CLI has no PWA category. Offline reload of `#/lesson/F1` showed the hook, and precached `f1-l1.mp3` returned 200. |
| Audio quality | 9 | One Piper en-US voice. The before-vowel `the` clip is `ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː`. Jewellery, of course, table for two, and ship/sheep match their cards. |

## What was exercised

- Onboarding (jewellery, name 阿琳, 15 minutes), then F1 F2 J1 J2 T1 R1, each through 場景 → 下一課 (R1 ends the lesson). No soft-lock. Role-play samples show `1 / 3`. R1 sheet: 「今晚你係客人。Ana 喺門口。」
- Path after F2: links only `#/lesson/F1`, `#/lesson/F2`, `#/lesson/J1`. J2, T1, and R1 are locked divs (`未開`), and the other rows are locked divs (`即將推出`). After R1: six completed links (`F1` `F2` `J1` `J2` `T1` `R1`) and 15 locked divs. Zero locked links.
- Fresh profile, direct `#/lesson/J2`: 「先完成上一課，呢度就會開。」 scrollWidth 390.
- Review grade, profile, word list (scrolled), word card `sheep`, attributions (MIT, CMUdict, Wiktionary, CC-Canto, IndexedDB). Sheep card and attributions stayed at scrollWidth 390. Zero text rects past the phone.
- F1 跟讀 record-compare: Web Speech present (`sr True`); 改為錄音比較 → 停錄音 → 播我嘅錄音; 跟完，去砌句 reached 砌句.
- Offline: cache `workbox-precache-v2-http://127.0.0.1:4174/english-quest/`, `f1-l1.mp3` hit, HTTP 200. Precache: 434 mp3 and 12 webp revisions are content hashes; `the-art-vowel.mp3` revision `4f5b8c578a595568c4f33a5c3325ba27` equals the file MD5. `eq-audio` is absent. Fingerprinted `index-BQ5l4cLz.js` and `index-DZWR8D84.css` keep revision null.
- Overflow method: every text-node `Range` client rect against the phone, plus `scrollWidth > clientWidth` on visible/auto overflow, on every lesson beat, the path, review, and the word list. Zero offenders. A second pass on `#/word/sheep-noun` and the path found the same.
- Secrets: the only file in `3c13068` is `CHANGELOG.md`.

## Spot-check (Piper en-us phones vs the card)

| Entry | Card | Phones of `say` | Verdict |
|---|---|---|---|
| the-art-vowel | /ði/ stress 0 | ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː | Match. One /ði/. |
| the-art | /ðə/ stress 0 | ðə sˈaʊnd ɪz ʃˈɔːɹt | Match. Gloss 英文冠詞，子音前面弱讀. |
| to-prep | /tə/ stress 0 | … tə hˈɑːŋ kˈɑːŋ | Match. |
| a-art | /ə/ stress 0 | ə ˈteɪbəl fɚ ˈtu | Match. |
| of-prep | /ˈʌv/ | ʌv kˈɔːɹs | Citation match. |
| of-course-phrase | /əv ˈkɔɹs/ | əv kˈɔɹs | Match. |
| for-prep | /ˈfɔɹ/ | fɔːɹ | Match. |
| table-for-two-phrase | /ə ˈteɪ.bəl fɚ ˈtu/ | ə ˈteɪbəl fɚ ˈtu plˈiːz | Match. |
| our-det | /ˈaʊ.ɚ/ one syllable | sentence ˌaʊɚ | Match. |
| your-det | /ˈjʊɹ/ | jʊɹ | Match. |
| jewellery-noun | /ˈdʒul.ɹi/ | dʒˈulɹi | Match. |
| free-adj | /ˈfɹi/ | fɹˈiː | Match. Gloss 空嘅；仲有位. |
| thank-verb / think-verb / three-num | /θ/ | θˈæŋk, θˈɪŋk, θɹˈiː | Match. |
| with-prep | /ˈwɪð/ | wɪð | Match. |
| ship-noun / sheep-noun | /ˈʃɪp/ /ˈʃip/ | ʃˈɪp / ʃˈiːp | Match. On screen: /ˈʃip/, 羊. |
| read present / past | /ˈɹid/ /ˈɹɛd/ | ɹˈid / ɹˈɛd | Match. |
| live verb / adj | /ˈlɪv/ /ˈlaɪv/ | lˈɪv / lˈaɪv | Match. Gloss 現場嘅；直播嘅. |
| wind-noun | /ˈwɪnd/ | wˈɪnd | Match. |
| bass fish / pitch | /ˈbæs/ /ˈbeɪs/ | bˈæs / bˈeɪs | Match. |
| close verb / adj | /ˈkloʊz/ /ˈkloʊs/ | klˈoʊz / klˈoʊs | Match. |
| table-noun | /ˈteɪ.bəl/ | ˈteɪbəl | Match. |
| check-in-noun | /ˈtʃɛk ˈɪn/ | tʃˈɛkˈɪn | Match. |
| sure-adj | /ˈʃʊɹ/ | ʃˈʊɹ | Match. |
| want-verb | /ˈwɑnt/ | wˈɑnt | Match. |
| hello-intj | /hə.ˈloʊ/ stress 2 | həlˈoʊ | Match. |
| again-adv | /ə.ˈɡɛn/ stress 2 | ɐɡˈɛn | Match. |
| here-adv | /ˈhɪɹ/ | hˈɪɹ | Match. |
| wine-noun / vine-noun | /ˈwaɪn/ /ˈvaɪn/ | wˈaɪn / vˈaɪn | Match. |
| boarding-noun | /ˈbɔɹ.dɪŋ/ | bˈɔːɹdɪŋ | Match. |
