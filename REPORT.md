# English Quest — orchestrator report

- Generated: 2026-10-30 02:01 (Macau, UTC+8)
- Live: https://penny323mo.github.io/english-quest/ (HTTP 200)
- Rounds: 10  ·  Started: 2026-10-29T23:31:15+08:00

## Phases
- build finished 2026-10-30T00:28:53+08:00
- review-1 finished 2026-10-30T00:47:49+08:00
- fix-1 finished 2026-10-30T01:01:55+08:00
- review-2 finished 2026-10-30T01:19:55+08:00
- fix-2 finished 2026-10-30T01:21:59+08:00
- review-3 finished 2026-10-30T01:30:20+08:00
- fix-3 finished 2026-10-30T01:37:01+08:00
- review-4 finished 2026-10-30T01:40:26+08:00
- fix-4 finished 2026-10-30T01:41:30+08:00
- review-5 finished 2026-10-30T01:43:33+08:00
- fix-5 finished 2026-10-30T01:44:16+08:00
- review-6 finished 2026-10-30T01:46:09+08:00
- fix-6 finished 2026-10-30T01:46:43+08:00
- review-7 finished 2026-10-30T01:48:56+08:00
- fix-7 finished 2026-10-30T01:49:39+08:00
- review-8 finished 2026-10-30T01:51:33+08:00
- fix-8 finished 2026-10-30T01:52:16+08:00
- review-9 finished 2026-10-30T01:56:19+08:00
- fix-9 finished 2026-10-30T01:57:04+08:00
- review-10 finished 2026-10-30T01:59:47+08:00
- fix-10 finished 2026-10-30T02:01:34+08:00
- publish finished 2026-10-30T02:01:39+08:00

## Reviews
- orch-r1-grok.md: VERDICT: NOT READY
- orch-r10-grok.md: VERDICT: SHIP
- orch-r2-grok.md: VERDICT: NOT READY
- orch-r3-grok.md: VERDICT: SHIP
- orch-r4-grok.md: VERDICT: SHIP
- orch-r5-grok.md: VERDICT: SHIP
- orch-r6-grok.md: VERDICT: SHIP
- orch-r7-grok.md: VERDICT: SHIP
- orch-r8-grok.md: VERDICT: SHIP
- orch-r9-grok.md: VERDICT: SHIP

## Tests
### tests-build
```
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 146.6643
```
### tests-fix-1
```
# tests 8
# suites 0
# pass 8
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1582.236387
```
### tests-fix-10
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1654.29848
```
### tests-fix-2
```
# tests 8
# suites 0
# pass 8
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1962.892192
```
### tests-fix-3
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1670.548431
```
### tests-fix-4
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1667.419829
```
### tests-fix-5
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1704.680772
```
### tests-fix-6
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1613.950719
```
### tests-fix-7
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1733.566175
```
### tests-fix-8
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1729.050418
```
### tests-fix-9
```
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2551.782855
```

## Screenshots
- screenshots/orch/live-390-full.png
- screenshots/orch/live-390.png

## Changelog (tail)
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
