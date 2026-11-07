# US dictionary recordings — Dvortygirl

These original recordings and our six adapted MP3 files are licensed under
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
Author: [Dvortygirl](https://commons.wikimedia.org/wiki/User:Dvortygirl).
The author does not endorse English Quest.

| Source | Dictionary label | Adapted files in `assets/audio/words/` |
|---|---|---|
| [En-us-a-unstressed.ogg](https://commons.wikimedia.org/wiki/File:En-us-a-unstressed.ogg) | [a, US unstressed /ə/](https://en.wiktionary.org/wiki/a#English) | a-art-word.mp3, a-art-word-slow.mp3 |
| [En-us-fee.ogg](https://commons.wikimedia.org/wiki/File:En-us-fee.ogg) | [fee, US /fiː/](https://en.wiktionary.org/wiki/fee#English) | fee-noun-word.mp3, fee-noun-word-slow.mp3 |
| [En-us-led.ogg](https://commons.wikimedia.org/wiki/File:En-us-led.ogg) | [led, US /lɛd/](https://en.wiktionary.org/wiki/led#English) | led-verb-word.mp3, led-verb-word-slow.mp3 |

Downloaded 2026-11-07. Original uploads: 2006-09-27 (a), 2006-10-04 (fee),
2006-09-30 (led). File description pages offer several licenses; we select
CC BY-SA 3.0. These files are excluded from the repository's MIT license.

Changes: full utterance converted to mono 22.05 kHz MP3 with 180 ms leading and
200 ms trailing silence. Slow versions use pitch-preserving `atempo=1/1.35`
before adding silence. No speech is cropped, spliced or synthesised.

Rebuild with `python3 scripts/word_recordings.py` (ffmpeg required).
`content/word-audio-recordings.json` pins source and adapted SHA-256 values.
`check_audio_asr.py` reports these as **dictionary**, not ASR passes or waivers:
it verifies the label mapping and hashes, recreates the adaptation, and compares
the decoded audio (2% relative RMS error maximum for codec rounding).
Changing a source requires checking its dictionary entry, license and attribution
again; never update hashes just to make an unrelated recording pass.
