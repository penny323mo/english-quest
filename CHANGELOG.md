# Changelog — English Quest

## Round 18 fixes
- Round 18 found no critical, major, or minor defects. The round 16 items stay closed: hour, with, and shoe are full sentences, the short-example test is in place, the R2 recap eyebrow is on screen, minute is 等陣。, and the aisle seat is 走廊位. T2 安檢同方向 and the speak-beat record compare stay as shipped in round 17.
- Tests stayed 13/13. The live review at 390px found no overflow on the path, the locked T2 screen, the T2 lesson, R2, the checked cards, settings, or attributions.

## Round 17 fixes
- T2 安檢同方向 is now a full 12-beat lesson after T1. It was a soon teaser. Learners clear security (boarding pass, liquids in the bin, laptop, belt) and ask 「Which way to the gate?」 / 「去閘口邊邊行？」. Kai answers 「Straight ahead.」 / 「直行就得。」 T3 酒店入住 stays upcoming. The path end now says 呢輪十一課.
- New cards: bin 膠盤, liquid /ˈlɪk.wɪd/ (CMU also has /ˈlɪk.wəd/, flagged, clip forced to /ɪ/), laptop, belt, which /wɪtʃ/ (the /hw/ variant is flagged), left / lift, straight / street, security /sɪ.ˈkjʊɹ.ə.ti/ (the /sə/ variant is flagged, clip forced to /sɪ/). Only those new says were rendered.
- The hook is a new 900×1200 Harbor Glow scene: Kai beside the security bins, not the check-in desk. An /l/ sound beat shows the /l/ mouth instead of /θ/.
- Speak beat: record mode says to play 「聽我」 then 「聽模範」. If the mic is off, the note is 「咪未開。你可以聽模範，然後繼續。呢課唔會卡住。」 Speech and record switch with one tap each way. A short bar shows while recording.
- Cantonese skim found no leftover 俾, 午安, 晚上好, or 我只係睇吓. New lines stay spoken Hong Kong Cantonese.
- Tests are 13/13. At 390px, onboarding, the path, the locked T2 screen, the new cards, settings, attributions, and the T2 hook through the recap stay inside the phone. 「放低今日」 on T2 clears the sheet corner. Lighthouse mobile: performance 0.98, accessibility 1, best-practices 1, seo 1.

## Round 16 fixes
- hour-noun: "One hour." / 「我等一個鐘。」 → "I waited for one hour." / 「我等咗一個鐘。」 The normal and slow clips were resynthesized. IPA stays /ˈaʊ.ɚ/ (CMU AW1 ER0, variant /ˈaʊɹ/).
- with-prep-voiceless: "With you." / 「同你一齊。」 → "I'll be right with you." / 「我即刻嚟招呼你。」 The say line forces voiceless /wɪθ/. shoe-noun: "A new shoe." / 「一隻新鞋。」 → "I need a new shoe." / 「我要一隻新鞋。」 Both clips were resynthesized. The voiced with card stays /wɪð/.
- tests/lessons.mjs now fails an English example of two words or fewer unless it is an allowlisted greeting or set phrase. "With you.", "One hour.", and "A new shoe." are not on that list; those entries were rewritten instead.
- R2 canDoYue: the long I'd like line → 「你能夠喺餐廳落單。」 The recap sheet padding-top went from 16px to 28px, past the 22px corner radius, and max-height also stops 76px below the top bar. At 390×844, 「放低今日」 is fully inside the sheet on all ten lesson ends (24–29px below the sheet edge, under the top bar). The path still ends with 「呢輪十課你行完啦。」
- minute-noun exampleYue: 「等一分鐘。」 → 「等陣。」 English stays "Wait a minute." and that clip was not re-rendered.
- Aisle seat sense: 通道 / 通道位 → 走廊位, including the label noun:passage-seat and 「靠窗定係走廊位？」. 通道 remains only as the passageway beside the seat.
- Tests are 13/13. At 390px the path, the locked R2 screen, the rewritten cards, and every shipped recap stay inside the phone. Lighthouse mobile: performance 0.98, accessibility 1, best-practices 1.

## Round 15 fixes
- Round 15 found no critical, major, or minor defects. The round 13 audit items stay closed: R2 落單, the fuller example sentences, and the madam line 好嘅，小姐。. No product code changed.
- Tests stayed 12/12. At 390px, the path, the locked R2 screen, the rewritten word cards, settings, the hello card with Jyutping on, attributions, and the R2 hook through the last beat stay inside the phone column.

## Round 14 fixes
- R2 落單 is a full 12-beat lesson after R1. It teaches I'd like, Can I have, What do you recommend?, and Anything else?, and it keeps chicken /tʃ/ apart from sheet /ʃ/ and weak can /kən/ apart from can't /kænt/. Coffee, water, and can are flagged where the sources disagree, and the clip matches the card. The hook is its own 900×1200 scene. T2 安檢同方向 stays upcoming so this lesson stays complete.
- Bare examples are full sentences. Seven through ten say what time the door opens, money is 我冇帶夠錢。, let me know is 有咩需要就話我知。, and o'clock is 而家係三點。. Madam’s spoken line is 好嘅，小姐。 The gloss still says madam is the polite form.
- The end of the path now says 呢輪十課. Tests are 12/12. At 390px the path, the locked R2 screen, the new word cards, and the R2 hook through the last beat stay inside the phone. Lighthouse mobile: performance 0.99, accessibility 1, best-practices 1.

## Round 13 fixes
- Spoken Cantonese now uses 你好 for afternoon and evening greetings, and the F2 set is 早晨／你好／晚安. 我只係睇吓 is 我睇吓先, 請周圍睇吓 is 隨便睇吓, and the restaurant opens with 你好，有冇訂位呀？. 一位好朋友喺度 is 有個好朋友喺度。. The gloss 我諗係。 keeps 諗 (U+8AD7).
- F2, F3, and F4 hooks are separate Harbor Glow scenes: a greeting at the counter, a clock with coins, and a polite exchange. Each file is a 900×1200 WebP with width and height. The app still preloads them onto the navy–teal placeholder.
- J3 件件嘅名 is a full 12-beat lesson after J2. It names a necklace, a bracelet, and a pair of pearl earrings, and it keeps this/these and pair/pearl apart. CMU and dictionary disagreements are flagged and resolved. New clips have about 180 ms of lead. Bracelet is forced to /slət/, and the weak “of” is /əv/.
- Tests are 12/12. At 390px the path, the locked J3 screen, the rewritten word cards, and the J3 hook, shadow, role, and sound beats stay inside the phone. Lighthouse mobile: performance 0.98, accessibility 1, best-practices 1.

## Round 12 fixes
- Round 12 found no critical, major, or minor defects. The seven live-audit items stay closed. No product code changed.
- Tests stayed 12/12. At 390px, the path, the locked J2 screen, the read card, settings, the hello card with Jyutping on, and attributions stay inside the phone column.

## Round 11 fixes
- Role-play tips no longer say 「你而家係 你。」 A named part says 「你扮 Mei。」 (or Tom). The learner’s own part says 「輪到你講。」 Both still say to wait until the other person finishes.
- Word cards use a Cantonese part-of-speech and sense label, such as 動詞 · 現在式. The raw sense id and the simplified-Chinese gloss stay in the data and are not shown.
- Spoken Cantonese glosses use 畀, 呢本係我嘅護照, and 好高興認識你. Stiff lines such as 係，先生 are now 好嘅，先生.
- Every teaching clip has about 180 ms of silence before the voice and about 200 ms after, so Safari does not clip the first sound. certainly-adv-slow was resynthesized; speech recognition hears “Certainly. Please take a look.”
- Cast portraits and lesson art declare width and height, preload on startup, and sit on a navy–teal placeholder instead of an empty circle or a green square.
- Foundations F3 數字、錢同時間 and F4 禮貌用語 ship as full 12-beat lessons, with Harbor Glow art, dual-checked IPA, Piper audio, role-play, and a quiz. The foundation path opens them after F2. Jewellery, travel, and restaurant still open their first lesson from the goal.
- Fingerprinted bundles whose Vite hash contains a hyphen, such as index-Bzs9-eJL.js, keep a null Workbox revision. Nested mp3 and webp files still get a content revision.
- Tests are 12/12. At 390px the path, the new lesson screens, the word cards, and both role tips stay inside the phone. Lighthouse mobile: performance 0.98, accessibility 1, best-practices 1.

## Round 10 fixes
- Round 10 found no critical, major, or minor defects. No product code changed.
- Tests stayed 9/9. At 390px, the restaurant path, the locked J1 screen, settings, and the hello card with Jyutping on stay inside the phone column.

## Round 9 fixes
- Round 9 found no critical, major, or minor defects. No product code changed.
- Tests stayed 9/9. At 390px, the path, the locked J2 screen, the sheep card, and attributions stay inside the phone column.

## Round 8 fixes
- Round 8 found no critical, major, or minor defects. No product code changed.
- Tests stayed 9/9. At 390px, the foundation path, the ship card, the sheep card, and attributions stay inside the phone column.

## Round 7 fixes
- Round 7 found no critical, major, or minor defects. No product code changed.
- Tests stayed 9/9. At 390px, the travel path, the restaurant path, the sure card, and attributions stay inside the phone column.

## Round 6 fixes
- Round 6 found no critical, major, or minor defects. No product code changed.
- Tests stayed 9/9. At 390px, the path, settings, the hello card with Jyutping on, F1, and attributions stay inside the phone column.

## Round 5 fixes
- Round 5 found no critical, major, or minor defects. No product code changed.
- Tests stayed 9/9. At 390px, attributions, the path, thank, check-in, table for two, and J1 stay inside the phone column.

## Round 4 fixes
- Round 4 found no critical, major, or minor defects. No product code changed.
- Tests stayed 9/9. At 390px, attributions, the path, the word list, the before-vowel *the* card, the jewellery card, and F1 stay inside the phone column.

## Round 3 fixes
- Precached mp3 and webp files now get a Workbox content revision. An installed PWA re-downloads a clip when the bytes change, including the corrected before-vowel *the*.
- Fingerprinted JS and CSS still use a null revision, because the filename already changes.
- The year-long CacheFirst `eq-audio` route is gone, so an old runtime copy cannot sit in front of a new file.

## Round 2 fixes
- The before-vowel *the* clip no longer says /ðə/ and then /ði/. The example on the card stays “The aisle seat is free.” The Piper line is `[[ðˈi]] aisle seat is free.`
- The phoneme test fails if that say line still contains ðə.
- The attributions page names the slow-speech synth scale 1.35, and no longer says every file is 1.35 times as long.

## Round 1 fixes
- Jewellery teaching clips are phoneme-forced to the two-syllable card `/ˈdʒul.ɹi/` (`[[dʒˈulɹi]]`), including the J1 greeting. The three-syllable form stays a noted variant.
- Of course and a table for two now say the weak forms printed on the cards (`/əv/`, `/ə/`, `/fɚ/`).
- the is glossed as an article, not 呢個／嗰個. Unstressed the, a, and to show 弱讀，冇重音 instead of a gold stress chip. to’s headword is the weak `/tə/` that the example already says.
- our is one chip, not ow + er. free (empty seat) is 空嘅；仲有位. live uses 嘅. your lists the `/jɔɹ/` variant. R1 says 喺. The T1 boarding note uses `/ˈbɔɹ.dɪŋ/`.
- A lexicon test phonemizes the Piper say strings and fails if jewellery still contains əl.

## Night-1
- Six lessons end to end: F1, F2, J1, J2, T1, R1. Harbor Glow art, Piper US audio, FSRS review, on-device progress.

## Setup
- Spec locked to DECISIONS.md; Harbor Glow cover key art; PREP samples copied; orchestrator 10-round loop armed.
