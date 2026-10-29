VERDICT: SHIP

Round 3 review of the built app at `http://127.0.0.1:4174/english-quest/` (Vite preview of the current `dist`, bundle `assets/index-BQ5l4cLz.js`). Viewport 390×844, touch, deviceScaleFactor 2, Chrome headless with a fake mic. `npm test`: 8/8 passed. The round-2 blocker is fixed: Piper en-us phonemizes `the-art-vowel`’s say `[[ðˈi]] aisle seat is free.` to `ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː`, with no `ðə`. The mp3 sha256 matches `content/lexicon.json` (`356e861b96606807…`, 11211 bytes) in both the repo root and `dist`.

One major remains. It does not trip the ship block list: a fresh load teaches the corrected clip, overflow is clean, tests pass, and every rubric dimension is 9. Installed clients that already precached the old mp3 will not pick up that correction until the cache key changes.

## Rubric

| Dimension | Score | Why |
|---|---|---|
| Art / scene | 9 | Lesson hooks still use the Harbor Glow cast. This round’s commit did not touch art. No logos on the walked screens. |
| UI / iPhone | 9 | No horizontal ink past the 390px phone on every lesson beat, the path, review, the word list, four word cards, and attributions. |
| Lexicon accuracy | 9 | Lexicon check is green, including the new vowel-the phoneme assertion. Heteronyms, weak forms, and the Cantonese glosses in the spot-check match the senses. |
| Pronunciation UX | 9 | Cards show IPA, syllables, and 弱讀，冇重音 when stress is 0. Slow buttons and mouth notes are on the lesson beats. Jyutping is not used as English phonics. |
| Pedagogy | 9 | All six lessons complete the 12 beats. Skip does not lock a lesson. Role-play is three turns, then 去小測. |
| Speaking | 9 | F1 跟讀 offers 開始講 and 改為錄音比較. Recording produced 播我嘅錄音, and 跟完，去砌句 advanced to 砌句. |
| Review / SRS | 9 | After six lessons, 120 cards were due. 好 left 119 (`hello` → `breath`). Copy says grades do not penalize. Profile: 連續 1 日 · 92 XP · 6/6. |
| Flow / onboarding | 9 | Name, jewellery goal, 15 minutes. Coming-soon rows stay locked divs. Finishing a lesson opens the next shipped lesson. |
| Perf | 9 | Lighthouse 12.8.2 mobile: performance 0.99, accessibility 1, best-practices 1 (no PWA category in this CLI). Offline reload of `#/lesson/F1` showed the hook, and precached `f1-l1.mp3` returned 200. |
| Audio quality | 9 | One Piper en-US voice. Jewellery, of course, table for two, and the before-vowel `the` clips match the cards. Attributions now name the 1.35 synth scale instead of claiming every file is 1.35× long. |

## What was exercised

- Onboarding, then F1 F2 J1 J2 T1 R1, each through 場景 → 下一課 (R1 ends at 今晚就到呢度). No soft-lock. Role-play samples show `1 / 3`. R1 sheet: 「今晚你係客人。Ana 喺門口。」
- Path after each lesson. Coming-soon rows are `DIV` + locked. J1 opens with the jewellery goal, J2 after J1, T1 after J2, R1 after T1.
- Review grade, profile, word list, word cards `the-art-vowel`, `the-art`, `our-det`, `jewellery-noun`, attributions.
- F1 跟讀. This Chrome has `SpeechRecognition`. 改為錄音比較 switches to 錄音，同模範比較. Start shows 停錄音, stop shows 播我嘅錄音, advance stays available.
- Offline: cache `workbox-precache-v2-http://127.0.0.1:4174/english-quest/`, `f1-l1.mp3` hit, HTTP 200.
- Overflow method: every text-node `Range` client rect against the phone, plus `scrollWidth > clientWidth` on visible/auto overflow. Zero offenders. Document and phone `scrollWidth` stayed 390.
- Secrets: the round-3 commit adds no `.env`, token, or key. The only “SECRET” string in the bundle is React’s `SECRET_INTERNALS`.
- Piper phonemize (`en_US-ljspeech-medium`, `espeak_voice=en-us`, sentences joined) of every `[[…]]` say, plus the spot-check below. CMU alternates were checked for the heteronyms; the cards use a real CMU entry (often entry 2 or 3), not a silent invented transcription.

## MAJOR

1. Replaced teaching audio does not update in an already installed PWA. `node_modules/vite-plugin-pwa/dist/index.js:843` sets `dontCacheBustURLsMatching` to `^assets/`, and `vite.config.ts:102` does not override it. Workbox then writes `revision:null` for every file under `assets/`. The shipped `sw.js` has 434 mp3 entries with `revision:null` and zero mp3 entries with a revision hash, including `{url:"assets/audio/words/the-art-vowel.mp3",revision:null}`. Workbox treats a null revision as “this URL never changes” and will not re-download it on service-worker update. JS and CSS are safe because the filename contains a hash (`index-BQ5l4cLz.js`). Mp3 and webp names are stable, so a client that precached the old vowel-the clip (or the old jewellery / of course / table-for-two clips) keeps those bytes. `vite.config.ts:111` also registers a CacheFirst runtime route for `assets/audio/*.mp3` named `eq-audio` with `maxAgeSeconds` of 365 days, which pins a copy for a year if a request misses the precache.
   Fix: in `vite.config.ts` `workbox`, set `dontCacheBustURLsMatching` so it matches only fingerprinted filenames (for example `/assets\/.*-[A-Za-z0-9_-]{8}\./`), rebuild, and confirm `sw.js` gives `the-art-vowel.mp3` a non-null revision. Drop the year-long CacheFirst audio route, or give that cache a versioned name, so it cannot sit in front of a corrected file. A fresh install of this build is already correct; this fix is what makes the correction reach phones that opened an earlier build.

## Spot-check (Piper en-us phones vs the card)

| Entry | Card | Phones of `say` | Verdict |
|---|---|---|---|
| the-art-vowel | /ði/ stress 0 | ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː | Match. No second /ðə/. UI note says the clip says /ði/ once. Example on screen remains “The aisle seat is free.” |
| the-art | /ðə/ stress 0 | ðə sˈaʊnd ɪz ʃˈɔːɹt | Match. Gloss 英文冠詞，子音前面弱讀. CMU primary `DH AH0`. |
| to-prep | /tə/ stress 0 | … flˈaɪɪŋ tə hˈɑːŋ kˈɑːŋ | Match. UI: 弱讀，冇重音. Weak form is CMU-compatible `T AH0`; strong /tu/ is a listed variant. |
| a-art | /ə/ stress 0 | ə ˈteɪbəl fɚ ˈtu | Match. |
| of-prep | /ˈʌv/ | ʌv kˈɔːɹs | Citation match. |
| of-course-phrase | /əv ˈkɔɹs/ | əv kˈɔɹs | Match. Same on j1-l3, j2-l5, j1-m1. |
| for-prep | /ˈfɔɹ/ | fɔːɹ | Match. |
| table-for-two-phrase | /ə ˈteɪ.bəl fɚ ˈtu/ | ə ˈteɪbəl fɚ ˈtu plˈiːz | Match. Same on r1-l2. |
| our-det | /ˈaʊ.ɚ/, one chip “our” | sentence ˌaʊɚ | Card matches CMU `AW1 ER0`. UI is one syllable, not “ow” + “er”. |
| your-det | /ˈjʊɹ/ | jʊɹ | Match. CMU also lists `Y AO1 R`; the card’s variant line includes /jɔɹ/. |
| jewellery-noun | /ˈdʒul.ɹi/, jewel + ry | dʒˈulɹi, no əl | Match. Same on j1-l1. Three-syllable CMU form is only a variant. |
| free-adj | /ˈfɹi/ | fɹˈiː | Match. Gloss 空嘅；仲有位. |
| thank-verb / think-verb / three-num | /θ/ | θˈæŋk, θˈɪŋk, θɹˈiː | Match. |
| with-prep | /ˈwɪð/ | wɪð | Match. |
| ship-noun / sheep-noun | /ˈʃɪp/ /ˈʃip/ | ʃˈɪp / ʃˈiːp | Match. |
| read present / past | /ˈɹid/ /ˈɹɛd/ | ɹˈid / ɹˈɛd | Match. CMU `R IY1 D` and `R EH1 D`. |
| live verb / adj | /ˈlɪv/ /ˈlaɪv/ | lˈɪv / lˈaɪv | Match. Gloss 現場嘅；直播嘅. |
| wind noun / verb | /ˈwɪnd/ /ˈwaɪnd/ | wˈɪnd / wˈaɪnd | Match. |
| bass fish / pitch | /ˈbæs/ /ˈbeɪs/ | bˈæs / bˈeɪs | Match. |
| close verb / adj | /ˈkloʊz/ /ˈkloʊs/ | klˈoʊz / klˈoʊs | Match. |
| table-noun | /ˈteɪ.bəl/ | ˈteɪbəl, no ɹ | Match. |
| check-in-noun | /ˈtʃɛk ˈɪn/ | tʃˈɛkˈɪn | Match. |
| sure-adj | /ˈʃʊɹ/ | ʃˈʊɹ | Match. |
| want-verb | /ˈwɑnt/ | wˈɑnt | Match. |
| hello-intj | /hə.ˈloʊ/ stress 2 | həlˈoʊ | Match. |
| again-adv | /ə.ˈɡɛn/ stress 2 | ɐɡˈɛn | Match. |
| here-adv | /ˈhɪɹ/ | hˈɪɹ | Match. |
| have-verb | /ˈhæv/ | hæv | Match. |
| nice-to-meet-phrase | /ˈnaɪs tə ˈmit ˈju/ | nˈaɪs tə mˈiːt juː | Match. |
| wine-noun / vine-noun | /ˈwaɪn/ /ˈvaɪn/ | wˈaɪn / vˈaɪn | Match. |
| boarding-noun | /ˈbɔɹ.dɪŋ/ | bˈɔːɹdɪŋ | Match. |
| aisle-noun | /ˈaɪl/ | ˈaɪəl | Match. |

`enjoy-verb` `/ɪn.ˈdʒɔɪ/` is CMU `enjoy(2) IH0 N JH OY1`. The primary CMU line `EH2 N JH OY1` is the listed variant `/ˌɛnˈdʒɔɪ/`. Not a silent disagreement.

## Round-2 item verified fixed

`scripts/emit_content.py:323` and `content/lexicon.json:1255` now say `[[ðˈi]] aisle seat is free.` The live card at `#/word/the-art-vowel` shows `/ði/`, one syllable, 弱讀，冇重音, and the note 「例句錄音只讀一次 /ði/，唔會先加個 /ðə/」. `tests/lexicon-check.mjs` phonemizes that say and fails if the phones contain `ðə`.
