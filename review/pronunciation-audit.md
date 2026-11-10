# Pronunciation audit: every card, sound note and recording

Base: `e7b90e56` (after #41). Scope: the 777 cards, the 97 lessons' sound
notes, and all 9,952 recordings (4,223 sentence clips and 753 word-only clips,
each at normal and slow speed).

**Short version.** The existing listening check passes every recording, but it
cannot hear stress, a voiced or voiceless consonant, or a word the voice reads
the same wrong way each time. Reading what the voice was *told* to say, sound by
sound, found mistakes the listening check let through. The clear ones are fixed
here: 29 cards, 3 lesson notes, 259 sentence recordings and 12 word-only
recordings. What is left for a human ear is listed at the end. No human
listening is claimed anywhere in this document.

## Follow-up candidates, 10 November 2026

The follow-up resolves 10 of the 11 sentence cases listed at the end of the
original audit. This is a **review checkout, not a deployment**. The D4 SIM-card
line remains unresolved and its original files are unchanged. There was no
human listening. Broader voice-quality and word-only questions remain open.

The accepted pairs use the existing Piper US voice and contextual renderer.
Each of Whisper base.en and Parakeet independently met or exceeded its own
same-speed baseline; no score improvement could hide a regression in the other
recognizer. The `a-art` phrase additionally matched the full text exactly in
both recognizers at both speeds while keeping /ə/ and /fɚ/. Only its two
obsolete ASR waivers were removed.

The unchanged official checker verified 20 files: 13 direct Whisper passes,
7 same-voice acoustic fallback passes, 0 waived and 0 failed. Typecheck, build
and 269 automated tests passed; one test was skipped. An acoustic fallback is
not independent pronunciation evidence. Full transcripts, phonemes, output
hashes and rechecks are in the
[run 3 artifact](https://github.com/penny323mo/english-quest/actions/runs/42836424709).
Original per-speed synthesis, donor and tempo provenance is preserved in
[run 1](https://github.com/penny323mo/english-quest/actions/runs/42830803751) and
[run 2](https://github.com/penny323mo/english-quest/actions/runs/42833928202).
Source commit: `b64b06f88eecdad22ab75541dba372e3c005d071`.

The corrected slow halves of `close-adj` and `engraving-noun-ex2` are retained
byte-for-byte. `not-feeling-well-phrase-ex2` reuses both exact-text dialogue
clips; `tax-refund-phrase-md1` reuses only the exact-text slow example. `a-art`
and `live-adj` slow files use pitch-preserving slowing of accepted normal
files. Other changed files were synthesized as complete sentences, not
spliced from isolated words. The article of `live-adj` is explicitly weak /ə/;
the article before `offer` is explicitly /ðiː/.

The original audit below records its earlier scope and counts. Its remaining
case lists have been updated for this follow-up checkout.

## How it was checked

1. **Cards against themselves and a dictionary.** For all 777 cards the IPA,
   ARPAbet, syllable chips, per-syllable IPA and stress number were compared
   with each other and with CMUdict, then read through by hand.
2. **Lesson sound notes.** All 97 notes and their contrast pairs were read
   against the cards they name.
3. **What the voice is fed.** Piper speaks phonemes that espeak-ng produces
   from the `say` text. Those phonemes were produced for all 4,223 sentence
   clips and compared, word by word, with CMUdict (2,240 different words) and
   with the cards. Words that have two readings (use, close, read, refund,
   bass…) were listed with every sentence they occur in and checked one by one.
   The word-only clips' phonemes were compared with their cards the same way.
4. **Listening.** `scripts/check_audio_asr.py` ran over all 9,952 files with
   the pinned models. Then NVIDIA Parakeet heard every file as a second
   opinion, and Whisper small.en heard the sentence clips that both of the
   others transcribed differently from the text.

## What the listening check said

| | Files | Heard as the text straight away | Passed another way | Failed |
|---|---|---|---|---|
| Sentence clips (Whisper base.en) | 8,446 | 4,696 | 3,746 close to a fresh render, 4 on the known list | 0 |
| Word-only clips (Whisper small.en) | 1,506 | 1,491 | 9 by Parakeet, 6 dictionary recordings | 0 |

A pass here means "sounds like a fresh render of the same text". A fresh render
repeats the voice's own mistakes, which is why step 3 was needed.

Parakeet and base.en both wrote something other than the text for 2,837 of the
8,446 sentence files, and Parakeet heard another word on 18 of the 1,506
word-only files. Most of that is the voice, not the script: see "For a human
ear".

## Fixed: cards

| Card | Was | Now | Why |
|---|---|---|---|
| `doctors-note-phrase` | /ˈdɑk.tɚ ˈnoʊt/ | /ˈdɑk.tɚz ˈnoʊt/ | the possessive /z/ was missing |
| `thank-you-for-telling-phrase` | …/ˈtɛ.lɪŋ/ | …/ˈtɛ.lɪŋ ˈmi/ | "me" was missing |
| `around-adv` | /ɚ.ˈaʊnd/ | /ə.ˈɹaʊnd/ | no /ɹ/ in the stressed syllable |
| `refund-noun` | /ˈɹi.fənd/ | /ˈɹi.ˌfʌnd/ | the second vowel is not reduced |
| `tax-refund-phrase` | /ˈtæks ɹɪ.ˈfʌnd/ | /ˈtæks ˈɹi.ˌfʌnd/ | noun, not verb |
| `permit-noun` | /pɚ.ˈmɪt/ | /ˈpɝ.ˌmɪt/ | noun, not verb |
| `understated-adj` | /ˈʌn.dɚ.ˌsteɪ.tɪd/ | /ˌʌn.dɚ.ˈsteɪ.tɪd/ | stress is on *state* |
| `toothache-noun` | /ˈtu.ˈθeɪk/ | /ˈtuθ.ˌeɪk/ | two primary stresses |
| `email-noun` | /i.ˈmeɪl/ | /ˈi.ˌmeɪl/ | stress is on the first syllable |
| `sometimes-adv` | /səm.ˈtaɪmz/ | /ˈsʌm.ˌtaɪmz/ | stress is on the first syllable |
| `surcharge-noun` | /sɚ.ˈtʃɑɹdʒ/ | /ˈsɝ.ˌtʃɑɹdʒ/ | noun, not verb; the recordings were already right |
| `excess-noun`, `perfume-noun`, `carousel-noun` | /ˈɛk.ˌsɛs/, /pɚ.ˈfjum/, /ˈkɛ.ɹə.ˌsɛl/ | /ɪk.ˈsɛs/, /ˈpɝ.ˌfjum/, /ˌkɛ.ɹə.ˈsɛl/ | the card and its own recordings disagreed; both readings are standard, so the card now shows the one that is recorded and lists the other as a variant |
| `valuation-noun` | /væl.ju.ˈeɪ.ʃən/ | /ˌvæl.ju.ˈeɪ.ʃən/ | secondary stress mark missing |
| `contactless-adj` | ARPAbet `L EH2 S` | `L AH0 S` | disagreed with its own IPA /ləs/ |

The card shows the syllable chips with the stressed one in capitals, so a chip
that respells the word shows a misspelling. Fixed: usually (was
*yu·zha·wa·ly*), buffet (*bu·fay*), opening hours (*o·pen·ing·our·s*), embassy
(*em·ba·sy*), collect (*co·lect*), attached (*a·tached*), business and business
days (*bus·ness*, *biz·ness*), allowance (*a·llow·ance*), savings account
(*sa·vings·a·ccount*), separate (*sep·rate*), jewellery (*jewel·ry*), MPF
(*em·pi·ef*), doctor's note (*doc·tor·note*).

## Fixed: lesson sound notes

| Lesson | Said | Now |
|---|---|---|
| J13 | "quote and bulk have no /l/" | bulk /bʌlk/ has one; the note and the second pair now contrast logo and bulk with quote and quantity |
| R7 | "replace and manager have no /l/" | replace /ɹɪ.ˈpleɪs/ has one; the pairs are now cold/manager and replace/understand |
| T15 | headed /u/ "the sound in luggage" | luggage is /ʌ/ and no word in the lesson has /u/; headed /ʌ/ |

## Fixed: sentence recordings

The clips below were rendered again with the same voice (Piper
`en_US-ljspeech-medium`, espeak `en-us`), at normal and slow speed.
Because this voice comes out a little differently on every render, up to five
takes were made of each file and base.en and Parakeet heard every take. A new
clip replaced the shipped one only when the two recognisers heard it at least
as well as the shipped one. 259 clips (515 files) were replaced. Seven clips
kept their shipped audio and text because no take met that bar; they are listed
under "For a human ear".

### The voice read the word wrong (161 clips)

| What you hear in the old clip | Clips | Fix |
|---|---|---|
| **shirt, work, return, early, journey, alternative, reserve, anniversary, salesperson, sir** with the stressed vowel missing. Their override used /ɝ/, a symbol this voice does not have, so it was dropped ("sht", "wk") | 24 | the override is gone; the voice's plain reading is right |
| **Macau** stressed on the first syllable, "MACK-ow" | 15 | /məˈkaʊ/ |
| **refund** (noun) as the verb, "re-FUND", or with a reduced "REE-fənd" | 14 of 15 | /ˈɹiːfʌnd/ |
| **overrun** (noun) as the verb, "over-RUN" | 12 | /ˈoʊvɚˌɹʌn/ |
| **SIM** spelled out, "ess-eye-em" | 9 of 11 | read as the word /sɪm/ |
| **use** (verb) with /s/, the noun's sound; and **uses** | 16 | /juːz/, /ˈjuːzɪz/ |
| **outdoor** stressed on *door* | 10 | /ˈaʊtdɔɹ/, as on the card |
| **rebook** as "REB-ook" | 8 | /ɹiːˈbʊk/ |
| **underwriter** stressed on *write* | 7 of 8 | /ˈʌndɚˌɹaɪtɚ/ |
| **buffet** as "BUFF-it" (the verb, to strike) or British "BUFF-ay" | 6 | /bəˈfeɪ/, which R15 teaches |
| **drowsy** with /s/ | 6 | /ˈdɹaʊzi/ |
| water-**resistant** with /s/ | 6 | /ɹɪˈzɪstənt/ |
| **cafe**, **cafes** stressed on the first syllable (British) | 6 | /kæˈfeɪ/ |
| **Excuse** me with /s/, the noun's sound | 4 | /ɪkˈskjuːz/ |
| **refill** (noun) as the verb, "re-FILL" | 4 | /ˈɹiːfɪl/ |
| **close** (verb) with /s/, the adjective's sound | 3 | /kloʊz/ |
| **email** forced to "ee-MAIL", **understated** forced to "UN-derstated" | 6 | email: the override is gone. understated: /ˌʌndɚˈsteɪtɪd/ |
| **doctor's note** forced to "doctor note" | 1 of 2 | the override is gone |
| past-tense **read** as "reed"; **bass** the fish as "base"; **congee** as "con-JEE"; **import** duty as "im-PORT"; **update** (verb) as "UP-date" | 5 | each given its own reading |

### The override spoiled the words around it (98 clips)

Piper reads the text on each side of a `[[phoneme]]` block as a separate
fragment. That changed the neighbouring words in ways nobody asked for:

| What you hear in the old clip | Clips |
|---|---|
| the article **a** as the letter name, "I have *ay* headache". The `a-art` card itself says the article is /ə/ and only the letter is /eɪ/ | 32 |
| **the** as /ðə/ before a vowel, "thuh offer", where `the-art-vowel` teaches /ði/ | 28 |
| a comma or full stop right after the block dropped, so the next words run on: "cancel-but", "gate change-we now board" | 28 |
| **to** in its strong form /tuː/ where the `to-prep` card teaches weak /tə/ | 13 |

Some clips had more than one of these. `scripts/render_audio.py` now reads the
whole sentence once, with a stand-in word where each block goes, and then puts
the block's phonemes in the stand-in's place (`phonemes_in_context`). For 11 of these
clips the block only repeated what the voice says anyway and came out unclear in
its new place, so the block was removed; the other 87 kept their `say` and only
the audio changed. The other override clips were not rendered again. They are not wrong in the ways listed above, but
see "Left alone" below.

After installing, `scripts/check_audio_asr.py --changed HEAD --slow` ran on
every changed file with the pinned models. Of 2,024 files (518 sentence files
and, because the renderer changed, all 1,506 word-only files) 1,821 were heard
as their text straight away, 9 passed on Parakeet, 188 were close to a fresh
render, 6 are the dictionary recordings, and none failed or needed the known
list. `sir-noun` and `late-checkout-phrase` now pass and are off that list;
`a-art` stayed on it at that stage; the follow-up above removes its two waivers.

## Fixed: word-only recordings

The word-only voice (Kokoro) is given each word on its own, so it had the same
mistakes: **rebook**, **drowsy**, **Macau**, **outdoor**, **refill** (noun),
**excuse me**, **water resistant** and **understated** (forced to the wrong
stress), and the article in **a table for two**, **twice a day**, **times a
day** and **half a size** was the letter name /eɪ/. All 12 were recorded again
with `scripts/pick_word_takes.py --fresh` and passed its gate unchanged: Parakeet
and six Whisper small.en variants at both speeds, speaker `af`. The two that are
in the 114-card audit (`table-for-two-phrase`, `refill-noun`) have their new
evidence in `review/word-audio-selection.json`.

## Left alone, with reasons

- **Overrides not rendered again.** About 320 other clips have a `[[phoneme]]`
  block. In the old clips the word before the block can carry extra stress
  ("I *HAVE* a…", "*CAN* you…"), "an" and "my" can be in their strong forms, and
  a sentence that ends on the block lost its final full stop or question mark
  before synthesis. These are valid readings, so they were left; the new
  renderer will fix them whenever such a clip is next rendered.
- **`a-art`, "A table for two."** The follow-up preserves the intended weak
  /ə/ and /fɚ/ forms in a contextual recipe and selects a complete pair with
  exact transcripts from both recognizers. Its two known-list entries are
  removed. Naturalness and the realized weak vowels still need human listening.
- **Marks copied from CMUdict that no dictionary writes as IPA**, harmless to a
  learner because the primary stress is right: a secondary stress right before
  the primary one (include /ˌɪn.ˈklud/, instead, investment, insurance,
  initial), on the last syllable (apology, vegetarian), and a schwa in un- and
  up- (unlimited /ən…/, update you /əp…/).
- **Two valid American readings where a card and other clips differ**: address
  (card /ˈæ.dɹɛs/, other sentences /əˈdɹɛs/), oversized, and the vowel in on
  (/ɑn/ on its card, /ɔn/ in *try on* and *on the side*), soft (/ɑ/ on its
  card, /ɔ/ in *soft drink*), hall (/ɔ/ in hallway, /ɑ/ in hallmark), deposit
  (/də/ and /dɪ/ on two cards), off (card /ɔf/, word clip /ɑf/).
- **J6's note** tells learners not to say cost as /kɔst/. That is a standard
  American reading too (the card lists it as a variant). The note was left
  because it only steers learners to the recorded one.
- **Syllable splits that are unusual but spell the word**: mor·ning, rea·dy,
  mis·sing, tou·ris·m.
- **Six unused files** in `assets/audio/` (jewellery-greeting, thanks…) are not
  referenced by the app and were not checked.
- Lines the device voice speaks (`runtimeTts`, `{{learner}}`) have no
  recording to check.

## For a human ear

**1. The sentence voice itself.** Two unrelated recognisers hear the same
wrong word in clip after clip. These are the words (in ten or more files) that
both misheard at least three times in four:

| Word | Files misheard by both | Heard as |
|---|---|---|
| shop | 130 of 136 | sharp, shark, shar |
| bag | 97 of 110 | bug, book, bed |
| water | 83 of 102 | war, more, wah |
| mei | 71 of 84 | may, make and, made |
| sauce | 44 of 56 | source, them since, source lay you |
| total | 34 of 40 | toll, tool, till |
| forecast | 31 of 34 | forks, rind forks, ring forks |
| data | 29 of 30 | day or, dare, dayer |
| band | 29 of 32 | bend, bin, ben |
| hot | 28 of 28 | heart, hard, back to heart |
| hong | 27 of 32 | harin khan, haring kine, harinkine |
| kong | 27 of 32 | harin khan, haring kine, harinkine |
| scanner | 26 of 26 | skin, skin the, skin and |
| there's | 24 of 26 | there is, where is, errors adding |
| top | 23 of 30 | tarp, tarpup, tarpop |
| bottle | 21 of 24 | barrel, borrow, bartle |
| polish | 21 of 28 | parlish, parlush, parlach |
| tag | 19 of 22 | tick, ted, tig |
| notice | 18 of 20 | nois, ring nois, know as |
| here's | 18 of 22 | here is, here is one, star owned here is |
| duty | 18 of 22 | dewey, dewy, duey |
| bad | 17 of 22 | bid, bent, narkbend will |
| stock | 16 of 16 | stark, stark barks, rings and stark |
| battery | 15 of 16 | bowery, brewery, bury |
| quarter | 15 of 16 | lust cora, lust quora, lustkora |
| shorter | 15 of 18 | sure, shora, shore a |
| item | 15 of 20 | i am, ection i am, iam |
| lab | 14 of 14 | love, lub, lump |

Three patterns explain most of it: the vowel of *hot, shop, stock, job, top,
bottle* is heard with an r ("heart", "sharp", "stark"); the vowel of *bag, band,
tax, tag, pack* is heard as "bug", "bend", "text"; and a weak last syllable is
lost (*water* "war", *total* "toll", *data* "day", *scanner* "skin", *written*
"ring"). A recogniser is not a learner, and a native listener may hear these as
fine. But they are consistent enough that someone should listen to a handful
(`words/hot-…`, any *shop* line in J1, `words/water-noun.mp3`,
`words/bag-noun.mp3`) before more lessons are recorded with this voice. Nothing
here was changed for it: it is a property of the voice, not of a clip.

**2. One sentence case still unresolved:** `lines/d4-l4.mp3` still spells
SIM as letters. New complete-sentence takes correctly request /sɪm/, but no
slow candidate met both recognizers' exact baseline transcripts. Recognizers
repeatedly transcribed “valid passport” as “volid/vollig/volley” and “pussport.” Both original
speeds remain in place. No partial replacement or new waiver was installed.

The other six originally blocked cases and the three partial-speed cases now
have accepted complete pairs: `prepaid-adj-ex3`, `j23-l7`,
`tax-refund-phrase-md1`, `doctors-note-phrase-ex3`, `live-adj`,
`not-feeling-well-phrase-ex2`, `engraving-noun-ex2`, `close-adj` and
`offer-noun-ex3`. The earlier “ex1/ex2” references used zero-based example
indexes; these are the actual one-based audio filenames.

**3. Word-only clips where Parakeet hears another word** while Whisper hears the
card: keep ("keep it"), by ("byte"), wrap ("rep"), shellfish ("selfish"),
payroll ("peril"), let slow ("what"), which slow ("witchy"), engraving slow
("engrazing"), read slow ("raid"), the ("bye"), the before a vowel slow ("B"),
plus the three dictionary recordings already documented.

**4. From `review/audio-ear-check.md`, still open:** ship/sheep length, Hong
Kong, tablet, Saturday, forty/eighty, and the weak forms in "a table for two".
Its SIM, sir, late checkout, permit, understated, tax refund and toothache rows
are dealt with here.

## Reproduce

```sh
python -m pip install sherpa-onnx==2.0.1 piper-tts==1.8.0 numpy cmudict
# models: see .github/workflows/audio-asr.yml
python scripts/check_audio_asr.py --models ~/asr-models \
  --voice ~/asr-models/vits-piper-en_US-ljspeech-medium/en_US-ljspeech-medium.onnx \
  --word-voice ~/asr-models/kokoro-en-v0_19 \
  --parakeet ~/asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 --slow --json all.json
```

To see what the voice is fed for a `say`, call
`render_audio.phonemes_in_context(voice, say)`. `voice.phonemize(say)` shows the
old fragment-by-fragment reading.
