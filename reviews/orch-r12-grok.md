VERDICT: SHIP

Round 12 review of the built app at `http://127.0.0.1:4174/english-quest/` (Vite preview, bundle `assets/index-BSYHjuYF.js`). Viewport 390×844, touch, deviceScaleFactor 2, Chrome headless with a fake mic. `npm test`: 12/12 passed (2719 ms). HEAD is `a9679be` (F3, F4, and the round-11 learner fixes). This round re-walked every shipped lesson, re-ran the tests, the phoneme spot-check, the silence-edge scan, Lighthouse, and every item in `review/loop-r3/coder-audit.md`. No CRITICAL, MAJOR, or MINOR findings.

## Rubric

| Dimension | Score | Why |
|---|---|---|
| Art / scene | 9 | F3 and F4 hooks are Harbor Glow night scenes with Mei, coins/clock and the shop door. No logos. Stalled portraits keep a 44px navy circle instead of an empty ring. |
| UI / iPhone | 9 | No horizontal ink past the 390px phone. Path tab bar: left 0, right 390, top 786, bottom 844, height 58. |
| Lexicon accuracy | 9 | Lexicon check is green. Every card has a Cantonese sense label. Spot-check matches CMU senses. Glosses use 畀, 本 for 護照, and 好高興認識你. |
| Pronunciation UX | 9 | Cards show IPA, syllable chips, and stress. Slow buttons and mouth notes are on the lesson beats. Jyutping is not used as English phonics. |
| Pedagogy | 9 | F1–F4, J1, J2, T1, and R1 each complete 12 beats. F3 teaches price and clock time for a beginner. F4 teaches excuse me, sorry, and you're welcome. Skip does not lock a lesson. |
| Speaking | 9 | F1 跟讀 offers 開始講 and 改為錄音比較. Recording produced 播我嘅錄音, and 跟完，去砌句 advanced to 砌句. Role tips no longer say 你而家係 你. |
| Review / SRS | 9 | After eight lessons, 153 cards were due. 好 left 152 (`hello` → `breath`). Copy says grades do not penalize. Profile: 連續 1 日 · 122 XP · 8/8. |
| Flow / onboarding | 9 | After F2 the path opens F3. After F3 it opens F4. Coming-soon rows stay divs. Jewellery still opens J1 early. A fresh 餐廳入座 profile opens R1. |
| Perf | 9 | Lighthouse 12.8.2 mobile, re-run this round: performance 0.98, accessibility 1, best-practices 1. This CLI has no PWA category. Offline reload of `#/lesson/F1` showed the hook, and precached `f1-l1.mp3` returned 200. |
| Audio quality | 9 | One Piper en-US voice. All 526 mp3s have at least 180 ms of lead and 230 ms of tail. `certainly-adv-slow` phonemizes with `tˈeɪk ɐ lˈʊk`. |

## Coder audit (`review/loop-r3/coder-audit.md`)

1. Closed. `#/word/read-verb-present` shows 「動詞 · 現在式」, not `PRESENT-INTERPRET-TEXT`. Live cards also show 名詞 · 先生, 名詞 · 護照, 短語 · 初次見面, 副詞 · 當然, and 名詞 · 貨幣. `learnerEyebrow` (`web/src/labels.ts:7`) is the only eyebrow, and the label test requires a Han sense label for every item.
2. Closed. Those cards show the Cantonese gloss only. `web/src/pages.tsx` does not render `glossZh`. No simplified line appeared under 讀（而家／習慣）, 護照, or 好高興認識你.
3. Closed. F1 role tip, live: 「輪到你講。等對方講完先答，中途唔會插嘴。」 J1: 「你扮 Mei。…」 R1, on a fresh 餐廳入座 profile: 「你扮 Tom。…」 The old 「你而家係」 string is absent. `roleTip` is `web/src/Lesson.tsx:31`.
4. Closed. With webp responses held, the F1 cast circle was 44×44, `border-radius: 50%`, image opacity 0, background `rgb(27, 31, 59)`, and `is-ready` was false. Path thumbs were 72×72 on the same placeholder. After the images were released, 9/9 path frames became ready. Preload runs from `web/src/App.tsx:69` and `web/src/Lesson.tsx:74`.
5. Closed. Live and phoneme glosses: Nice to meet you → 好高興認識你。 Here is my passport → 呢本係我嘅護照。 Yes, sir → 好嘅，先生。 for-prep example → 送畀我太太。 The learner-Cantonese test bans 俾, 認識你真好, 我張護照, 係，先生, and the simplified set. It passed.
6. Closed. `scripts/render_audio.py` pads with 180 ms lead and 200 ms tail. Silence detect on all 526 files: shortest lead 0.18 s, shortest tail 0.231 s. `certainly-adv-slow.mp3` is 2.95 s, lead 0.193 s, tail 0.289 s. Piper en-us phones of its `say`: `sˈɜːʔn̩li. | plˈiːz tˈeɪk ɐ lˈʊk`.
7. Closed. F3 數字、錢同時間 and F4 禮貌用語 are on the path, in `SHIPPED`, and each walked through all 12 beats with role-play `1 / 3`, a quiz, and a sound beat. Hook art is `assets/art/lessons/f3.webp` and `f4.webp`. After F1 the only extra open link is J1 (jewellery). F3 is a locked div until F2 is finished, then it becomes `#/lesson/F3`.

## What was exercised

- Onboarding (jewellery, name 阿琳, 15 minutes), then F1 F2 F3 F4 J1 J2 T1 R1, each through 場景 → 下一課 (R1 ends the lesson). No soft-lock. Ink events: 0.
- Path links grow in order: after F2, F1 F2 F3 and J1; after F4, F1–F4 and J1; after R1, all eight completed links and 13 locked divs. Zero locked links.
- Fresh 餐廳入座 profile opens R1 and reaches the role beat.
- Review grade, profile (8/8), word list, word cards listed above, attributions (MIT, CMUdict, Wiktionary, CC-Canto, IndexedDB). Card and path scrollWidth stayed 390.
- F1 跟讀 record-compare, as above. The lesson copy still says the lesson will not block on the mic.
- Offline: cache `workbox-precache-v2-http://127.0.0.1:4174/english-quest/`, `f1-l1.mp3` hit, HTTP 200. Precache: 520 mp3 and 14 webp revisions are content hashes. `the-art-vowel.mp3` revision `4f4dfec851ce474becd1ee3cab7b7e35` equals the new file MD5. `eq-audio` is absent. Fingerprinted `index-BSYHjuYF.js` and `index-IOSE3BRs.css` keep revision null.
- Secrets: a scan of the tree found no `.env`, private key, or API token. The public commit is the lesson and audio ship.

## Spot-check (Piper en-us phones vs the card)

| Entry | Card | Phones of `say` | Verdict |
|---|---|---|---|
| the-art-vowel | /ði/ stress 0 | ðˈi ˈaɪəl sˈiːt ɪz fɹˈiː | Match. One /ði/. |
| the-art | /ðə/ stress 0 | ðə sˈaʊnd ɪz ʃˈɔːɹt | Match. |
| to-prep | /tə/ stress 0 | … tə hˈɑːŋ kˈɑːŋ | Match. |
| a-art | /ə/ stress 0 | ə ˈteɪbəl fɚ ˈtu | Match. |
| of-course-phrase | /əv ˈkɔɹs/ | əv kˈɔɹs | Match. |
| for-prep | /ˈfɔɹ/ | fɔːɹ | Match. Gloss example 送畀我太太. |
| table-for-two-phrase | /ə ˈteɪ.bəl fɚ ˈtu/ | ə ˈteɪbəl fɚ ˈtu plˈiːz | Match. |
| our-det | /ˈaʊ.ɚ/ | sentence ˌaʊɚ | Match. |
| jewellery-noun | /ˈdʒul.ɹi/ | dʒˈulɹi | Match. |
| free-adj | /ˈfɹi/ | fɹˈiː | Match. Gloss 空嘅；仲有位. |
| ship-noun / sheep-noun | /ˈʃɪp/ /ˈʃip/ | ʃˈɪp / ʃˈiːp | Match. |
| read present / past | /ˈɹid/ /ˈɹɛd/ | ɹˈid / ɹˈɛd | Match. On screen: 動詞 · 現在式. |
| live verb / adj | /ˈlɪv/ /ˈlaɪv/ | lˈɪv / lˈaɪv | Match. Gloss 現場嘅；直播嘅. |
| certainly-adv | /ˈsɝ.tən.li/ | sˈɜːʔn̩li … tˈeɪk ɐ lˈʊk | Match. 「take a」 is in the phones. |
| sir-noun | /ˈsɝ/ | sˈɝ | Match. Example 好嘅，先生。 |
| passport-noun | /ˈpæs.ˌpɔɹt/ | pˈæspɔːɹt | Match. Example 呢本係我嘅護照。 |
| nice-to-meet-phrase | /ˈnaɪs tə ˈmit ˈju/ | nˈaɪs tə mˈiːt juː | Match. 好高興認識你. |
| how-much-phrase | /ˈhaʊ ˈmʌtʃ/ | hˌaʊ mˈʌtʃ | Match. 幾多錢. |
| ten-num / dollar-noun | /ˈtɛn/ /ˈdɑl.ɚ/ | tˈɛn dˈɑːlɚz | Match. 十蚊. |
| oclock-adv | /ə.ˈklɑk/ stress 2 | θɹˈiːʲ əklˈɑːk | Match. 三點. |
| five-num / six-num | /ˈfaɪv/ /ˈsɪks/ | fˈaɪv / sˈɪks | Match. |
| excuse-me-phrase | /ɪk.ˈskjuz ˈmi/ | ɪkskjˈuz mˈiː | Match. 唔該借借. |
| im-sorry-phrase | /ˈaɪm ˈsɑ.ɹi/ | aɪm sˈɑːɹi | Match. 對唔住. |
| youre-welcome-phrase | /ˈjʊɹ ˈwɛl.kəm/ | jʊɹ wˈɛlkʌm | Match. 唔使客氣. |
| hello-intj | /hə.ˈloʊ/ stress 2 | həlˈoʊ | Match. |
| boarding-noun | /ˈbɔɹ.dɪŋ/ | bˈɔːɹdɪŋ | Match. |
| want-verb | /ˈwɑnt/ | wˈɑnt … fɔːɹ | Match. |
