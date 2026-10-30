# Changelog — English Quest

## Round 21 fixes
- Learning progress stays on this device. IndexedDB is version 2 and reopens after `close`, `versionchange`, or a failed read/write, instead of reusing a dead connection. Records carry `schemaVersion`. Version 1 records migrate forward without dropping XP, streak, finished lessons, or FSRS cards.
- If a save fails, a 「未儲存」 banner stays on the screen with the reason and a 「再試」 button until a later save works. If the saved record cannot be read, the app stops writing and shows 「再試」 rather than replacing it with an empty profile. A private-mode browser that blocks IndexedDB can still start an empty session and does not call put.
- Persistent storage is requested once after a successful read. Settings can 匯出進度 and 匯入進度 as JSON. Import asks before it overwrites, and a newer schema is rejected in Cantonese.
- The round 20 path order is unchanged: one easy-to-hard list, and the CEFR test still fails if a chip steps backwards. No new lessons this round.

## Round 20 fixes
- The chrome is the light cartoon system: sky-to-cream screens, a teal path, chunky nodes, CEFR chips, 52px buttons, and white lesson sheets. 小燈 (a harbour lantern, not an owl) waves on the path and cheers on the lesson-complete screen. There is no `#58CC02`.
- Sound effects are synthesized in the Web Audio API: a bright plink for a correct answer, a soft thud for a miss, a short fanfare when a lesson ends, a sparkle for XP, a warm blip for a streak, and a tiny click when a path node starts. Settings has a mute toggle, saved with the rest of the profile. Sound defaults to on. The audio context resumes on the first tap and never throws. Pronunciation clips take priority, so a sound effect waits while speech is playing.
- J7 付款同退稅 (A2/B1), R3 過敏同特別要求 (A2), and T3 酒店入住 (A2) are full 12-beat lessons. The path and the unlock order are one list, easy to hard: F1–F4, J1, R1, J2, T1, J3, T2, R2, J4, J5, T3, R3, J6, J7. Soon teasers sit in the same bands (T4 and R4 at A2, T5 and R5 at A2/B1, J8–J10, T6, and R6 at B1). J8 is B1. A test fails if a chip drops a band. The end copy says 呢輪十七課.
- J4 teaches comparatives (heavier, shinier) in a 7-line dialogue and glosses only the key lines. J5 is 7 lines and glosses the try-on offer and “How does it feel?”. J6 stays A2/B1 and teaches “If you take both…”. T3, R3, and J7 are longer and less glossed than the lesson before them. shinier has no CMUdict entry, so it is not a card and has no invented IPA.
- The jewellery deck now includes the payment words. New 生字 decks cover the restaurant allergy words and the hotel check-in words. Listen-choose and meaning-choose still grade those cards.
- New clips only. Lead is about 180 ms and the trail is about 200 ms. allergic and password cards still show the CMU vowel ɝ; the Piper clips force ɜ because this voice has no ɝ. receipt, the refund-form noun stress, wifi, without, peanut, wrap, and on the side are forced to the card. refund’s verb stress, wifi’s wee-fee reading, and the /ɑn/ form of on stay flagged, not taught.
- Hooks are new 900×1200 scenes: a counter with a card and a gift box, a table with the sauce set apart, and a hotel desk with a key card. No readable prices.
- Tests are 13/13. At 390px the path, a lesson feedback sheet, the celebration, the 生字 card, settings, and the word page stay inside the phone, on the light background. Lighthouse mobile: performance 1, accessibility 1, best-practices 1, seo 1.

## Round 19 fixes
- J4 金、銀、鑽石、玉 (A2), J5 尺寸同試戴 (A2), and J6 價錢同折扣 (A2/B1) are full 12-beat lessons. J3 opens J4, then J5, then J6, then T1. J7 收尾同道別, J8 售後同保養, J9 投訴同退換, T3–T5, and R3–R5 stay upcoming (nine soon teasers). The path end says 呢輪十四課.
- resize is not in CMUdict, so this round teaches adjust instead and does not invent a pronunciation. comfortable is in CMUdict and is included (`/ˈkʌm.fɚ.tə.bəl/`).
- Path nodes show A1 / A2 / B1 chips (including A1/A2 and A2/B1), wind left and right, and mark the current lesson with a gold pulse. Done, open, locked, and soon stay distinct. Feedback on a quiz choice is immediate: correct `#2F9E44`, wrong `#E85D4C`. Lesson complete shows a short calm celebration with XP and streak. There is no hearts lockout and no `#58CC02`.
- 生字 is on the path and on 重溫. The jewellery deck covers J1–J6 content words. A card has IPA and audio, a Cantonese gloss, usage notes, collocations, register, pitfalls, and at least two example sentences. 更多 opens the rest, related words, and a short dialogue when one exists. Due words come first through the existing FSRS store. Listen-choose and meaning-choose grade the card. 跟讀 and 填空 stay disabled for the next round. Each deck shows a progress percent and a due count.
- New clips only. Lead is about 180 ms and the trail is about 200 ms. certified and perfect cards still show the CMU vowel ɝ; the Piper clips force ɜ because this voice has no ɝ and was dropping the vowel. platinum, natural, karat, diamond, authentic, cost, expensive, treated, and offer are forced to the IPA on the card. The just-looking pitfall no longer quotes the stiff line 我只係睇吓.
- Hooks are new 900×1200 Harbor Glow scenes: a materials tray, a sizing mandrel with a mirror, and a gift box with a folder. No readable prices.
- The opening screen loads before the lesson bank. The service worker register script is deferred so it does not block the first paint.

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
