# Changelog — English Quest

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
