VERDICT: NOT READY

Round 2 review of the built app at `http://127.0.0.1:4174/english-quest/` (Vite preview). Viewport 390×844, touch, deviceScaleFactor 2, Chrome headless with a fake mic. `npm test`: 8/8 passed, including the new Piper phoneme test in `tests/lexicon-check.mjs`. That test covers jewellery, of course, and table for two. It does not phonemize `the-art-vowel`, and that card’s clip is still wrong. Ship stays blocked.

Round 1’s jewellery, of course, table-for-two, article-gloss, `our` chip, `free`, and weak-`to` bugs are fixed. Evidence is in the last section. Do not revert those.

## Rubric

| Dimension | Score | Why |
|---|---|---|
| Art / scene | 9 | The six lesson hooks still use the Harbor Glow cast (Mei, Tom, Kai, Ana). No logos in the walked screens. |
| UI / iPhone | 9 | No horizontal ink past the 390px phone. Tabs and lesson CTAs stay tappable. Word cards and attributions also stay inside 390. |
| Lexicon accuracy | 8 | CMU spot-check, glosses, stress 0, and the joined `our` chip are right. `the-art-vowel`’s `say` contradicts its own `/ði/`. |
| Pronunciation UX | 9 | Cards show IPA, syllables, and 弱讀，冇重音 when stress is 0. Slow buttons and minimal-pair notes are in the lessons. Jyutping is not used as English phonics. |
| Pedagogy | 9 | All six lessons complete the 12 beats. Skip does not lock a lesson. Role-play is three turns. |
| Speaking | 9 | F1 跟讀 offers 開始講 and 改為錄音比較. Recording produced 播我嘅錄音, and 跟完，去砌句 advanced to 砌句. |
| Review / SRS | 9 | After six lessons, 120 cards were due. 好 left 119 (`hello` → `breath`). Copy says grades do not penalize. Profile: 連續 1 日 · 92 XP · 6/6. |
| Flow / onboarding | 9 | Name, jewellery goal, 15 minutes. Coming-soon rows are locked divs. Finishing a lesson opens the next shipped lesson. |
| Perf | 9 | Offline reload of `#/lesson/F1` still showed the hook. `f1-l1.mp3` returned 200 from the Workbox precache. Lighthouse was not re-run this round; round 1 on this app was performance 0.99, accessibility 1, best-practices 1 (Lighthouse 12.8.2 has no PWA category). |
| Audio quality | 8 | One Piper en-US voice. The round-1 phrase fixes match their cards. The before-vowel `the` clip says an extra word. |

## What was exercised

- Onboarding, then F1 F2 J1 J2 T1 R1, each through 場景 → 下一課 (R1 ends at 今晚就到呢度). No soft-lock. Role-play samples show `1 / 3`, then two 下一句, then 去小測. R1 intro on screen: 「今晚你係客人。Ana 喺門口。」
- Path after each lesson. Coming-soon rows stay `DIV` + locked. J1 opens after the jewellery goal, J2 after J1, T1 after J2, R1 after T1.
- Review grade, profile, word list scrolled at 400/900/1600/2400, word cards `the-art`, `the-art-vowel`, `our-det`, `jewellery-noun`, `free-adj`, `to-prep`, `of-course-phrase`, `table-for-two-phrase`, attributions.
- F1 跟讀. This Chrome build has `SpeechRecognition`, so the primary button is 開始講. 改為錄音比較 switches to 錄音，同模範比較. Start shows 停錄音, stop shows 播我嘅錄音, and the advance button stays on screen.
- Offline: service-worker cache `workbox-precache-v2-http://127.0.0.1:4174/english-quest/`, `f1-l1.mp3` cache hit, HTTP 200.
- Overflow method: every text-node `Range` client rect against the phone box, plus `scrollWidth > clientWidth` on visible/auto overflow, on every lesson beat, the path, review, the word list, eight word cards, and attributions. Zero offenders. Document and phone `scrollWidth` stayed 390.
- Secrets: no `.env` or token file in the tree. A pattern scan hits only React’s `SECRET_INTERNALS` string inside the bundle.
- Piper phonemize (`en_US-ljspeech-medium`, `espeak_voice=en-us`, sentences joined) of every `[[…]]` say in the lexicon and lines, plus the spot-check below.

## CRITICAL

1. The before-vowel `the` card teaches `/ði/` and the clip says `/ðə/` plus `/ði/`. `scripts/emit_content.py:323` sets `piper="The [[ðˈi]] aisle seat is free."`, which `content/lexicon.json:1255` stores as `say`. Piper en-us phonemizes that string to `ðə ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː.` The orthographic “The” is still spoken as the consonant-form article, and the forced `[[ðˈi]]` is inserted after it. The on-screen example (`content/lexicon.json:1253`, and the live card at `#/word/the-art-vowel`) is a single “The aisle seat is free.” The card IPA is `/ði/` (`content/lexicon.json:1235`), CMU `the(3) DH IY0`, stress 0, one syllable. 聽例句 plays `assets/audio/words/the-art-vowel.mp3` (`web/src/pages.tsx:322`). `audioSha256` matches that file (`9c8e16692b6712c0…`). `scripts/render_audio.py:85` skips any mp3 that already exists, so a say-only edit will not replace the clip. The new test at `tests/lexicon-check.mjs:118` never phonemizes this entry. The card is linked from the `the-art` note (`content/lexicon.json:1218`) and opens from the word list.
   Fix: change the piper/say string so the word is not spoken twice. Both of these phonemize to a single `ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː`: `[[ðˈi]] aisle seat is free.` and `[[ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː]]`. Keep the displayed example as “The aisle seat is free.” Delete `assets/audio/words/the-art-vowel.mp3` and `the-art-vowel-slow.mp3`, re-run `scripts/render_audio.py` so the sha is restamped, and extend the phoneme test to fail if this say’s phones contain `ðə`.

## MINOR

2. Short slow clips measure under the ~1.35 length the attributions page states. `scripts/render_audio.py` uses `length_scale` 1.35. File duration ratios (slow/normal) this round: `the-art-vowel` 1.25, `the-art` 1.26, `to-prep` 1.29, `our-det` 1.28, `jewellery-noun` 1.31, `of-course-phrase` 1.31, `table-for-two-phrase` 1.35. The slow button is still slower. Fix: raise the scale for short cards until the mp3 ratio is near 1.35, or change the attributions sentence so it names the synth scale rather than the file ratio.

## Spot-check (Piper en-us phones vs the card)

| Entry | Card | Phones of `say` | Verdict |
|---|---|---|---|
| the-art-vowel | /ði/ stress 0 | ðə ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː | Fail. Extra /ðə/. |
| the-art | /ðə/ stress 0 | ðə sˈaʊnd ɪz ʃˈɔːɹt | Match. Gloss is 英文冠詞，子音前面弱讀. Not 呢個/嗰個. |
| to-prep | /tə/ stress 0 | … flˈaɪɪŋ tə hˈɑːŋ kˈɑːŋ | Match. UI: 弱讀，冇重音. |
| a-art | /ə/ stress 0 | ə ˈteɪbəl fɚ ˈtu | Match. |
| of-prep | /ˈʌv/ | ʌv kˈɔːɹs | Citation match. |
| of-course-phrase | /əv ˈkɔɹs/ | əv kˈɔɹs | Match. Not ʌv. Same on j1-l3, j2-l5, j1-m1. |
| for-prep | /ˈfɔɹ/ | sˈʌmθɪŋ fɔːɹ maɪ wˈaɪf | Match. |
| table-for-two-phrase | /ə ˈteɪ.bəl fɚ ˈtu/ | ə ˈteɪbəl fɚ ˈtu plˈiːz | Match. Not fɔ. Same on r1-l2. |
| our-det | /ˈaʊ.ɚ/ one chip “our” | sentence ˌaʊɚ (welcome holds primary) | Card matches CMU AW1 ER0. UI chip is one syllable. |
| your-det | /ˈjʊɹ/ | jʊɹ bˈɔːɹdɪŋ | Match. Variant list includes /jɔɹ/. |
| jewellery-noun | /ˈdʒul.ɹi/ two syllables | wˈɛlkʌm tʊ ˌaʊɚ dʒˈulɹi stˈɔːɹ | Match. No əl. Same on j1-l1. |
| jewelry-noun | /ˈdʒul.ɹi/ | dʒˈulɹi ænd dʒˈulɹi sˈaʊnd ðə sˈeɪm | Match. |
| free-adj | /ˈfɹi/ | ðɪʲ ˈaɪəl … fɹˈiː | Vowel matches. Gloss 空嘅；仲有位. |
| thank-verb | /ˈθæŋk/ | θˈæŋk | Match. |
| three-num | /ˈθɹi/ | θɹˈiː | Match. |
| think-verb | /ˈθɪŋk/ | θˈɪŋk | Match. |
| with-prep | /ˈwɪð/ | wɪð | Match. |
| ship-noun / sheep-noun | /ˈʃɪp/ /ˈʃip/ | ʃˈɪp / ʃˈiːp | Match. |
| read present / past | /ˈɹid/ /ˈɹɛd/ | ɹˈid / ɹˈɛd | Match. |
| live verb / adj | /ˈlɪv/ /ˈlaɪv/ | lˈɪv / lˈaɪv | Match. Gloss 現場嘅；直播嘅. |
| bow noun / verb | /ˈboʊ/ /ˈbaʊ/ | bˈoʊ / bˈaʊ | Match. |
| wind noun / verb | /ˈwɪnd/ /ˈwaɪnd/ | ðə wˈɪnd / wˈaɪnd | Match. “The” here is the article. |
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
| store-noun | /ˈstɔɹ/ | stˈɔːɹ | Match. |
| wine-noun / vine-noun | /ˈwaɪn/ /ˈvaɪn/ | wˈaɪn / vˈaɪn | Match. |

CMU `the` is `DH AH0`, `the(2) DH AH1`, `the(3) DH IY0`. The two `the` cards use the weak consonant form and `DH IY0`. The failure is the extra spoken article, not the ARPAbet on the card.

## Round-1 items verified fixed

- Jewellery and the J1 greeting phonemize to `dʒˈulɹi` with no `əl`. Card stays two syllables, `/ˈdʒul.ɹi/`.
- Of course lines and the phrase card phonemize to `əv kˈɔɹs`, not `ʌv`.
- Table for two and r1-l2 phonemize to `ə ˈteɪbəl fɚ ˈtu`, not `fɔ`.
- `the-art` gloss no longer says 呢個/嗰個, jyutping is empty, stress is 0, and the card shows 弱讀，冇重音 (`web/src/pages.tsx:330`).
- `our-det` is one syllable chip “our”, IPA `/ˈaʊ.ɚ/`.
- `free-adj` gloss is 空嘅；仲有位.
- `to-prep` card is `/tə/`, stress 0, and the example phones use `tə`.
- `live-adj` gloss is 現場嘅；直播嘅.
- R1 role intro uses 喺 (`content/lessons/r1.json:203`). The walked sheet showed the same line.
- T1 boarding note is `/ˈbɔɹ.dɪŋ/` (`content/lessons/t1.json:306`).
- `your-det` variants include `/jɔɹ/`.
