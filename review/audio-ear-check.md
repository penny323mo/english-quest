# Audio: clips for a human ear check

These are **suspected** pronunciation problems. They were not auto-fixed. Both
Whisper models (base.en and small.en) mishear them. In most cases a fresh render
of the same text is misheard the same way too, so the cause is how the Piper
`en_US-ljspeech-medium` voice says the word, not a stale or wrong clip. Please
play each clip and tick the box only if a native listener hears the problem.
A confirmed problem gets a phoneme override in its `say` field, then a
re-render (`npm run audio`).

Play the clips from `assets/audio/` (each also has a `-slow.mp3` twin).

## 1. Sounds that may be wrong

| ✓ | Word | What the models heard | Clips to play | Likely fix if confirmed |
|---|---|---|---|---|
| ☐ | **ship / sheep** (F1 teaches this contrast) | ship and sheep as the same word ("sheep is short", "Sheik is lying") | `lines/f1-l2.mp3`, `lines/f1-m1.mp3`, `words/ship-noun.mp3`, `words/sheep-noun.mp3`, `words/short-adj.mp3`, `words/long-adj.mp3` | force `[[ʃˈɪp]]` vs `[[ʃˈiːp]]`, check the length difference is audible |
| ☐ | **Hong Kong** | "home car", "Har Kha", "Harenkong" | `lines/t1-m1.mp3`, `lines/t1-l2.mp3`, `lines/f5-l2.mp3`, `words/hong-kong-noun.mp3`, `words/from-prep.mp3`, `words/to-prep.mp3` | override `[[hˈɑŋ kˈɑŋ]]` |
| ☐ | **tablet** | "to look" | `words/tablet-noun.mp3`, `words/dosage-noun.mp3`, `words/twice-a-day-phrase.mp3`, `lines/d6-l5.mp3` | `/ˈtæblət/` |
| ☐ | **water** | "war", "wore" (flapped t lost) | `words/water-noun.mp3`, `words/still-adj-md1.mp3`, `words/too-adv-md0.mp3`, `words/can-verb.mp3`, `lines/d3-l3.mp3` | override `[[wˈɔɾɚ]]` |
| ☐ | **SIM** | "Assign M", "SINAM": the voice may spell the letters | `words/sim-noun.mp3`, `lines/d4-l4.mp3`, `lines/d4-l7.mp3`, `lines/d4-l8.mp3` | override `[[sˈɪm]]` |
| ☐ | **Saturday** | "so the day", "set a date" | `words/saturday-noun.mp3`, `words/cake-noun-ex2.mp3`, `lines/j15-l4.mp3`, `lines/j22-l1.mp3`, `lines/r14-l5.mp3` | the `[[ˈsætɚdi]]` override is right on paper; listen |
| ☐ | **forty / eighty dollars** | "four dollars", "eight dollars": 40/4 and 80/8 may be confused | `words/labour-noun.mp3`, `words/roughly-adv-ex2.mp3`, `words/rush-noun-ex2.mp3`, `words/how-much-phrase-md1.mp3`, `lines/j13-l5.mp3`, `lines/j20-l4.mp3`, `lines/d7-l5.mp3`, `lines/j18-l2.mp3` | stress the "-ty" in the slow clip |
| ☐ | **a table for two** (weak forms) | "or table food to please", "by table 32" | `words/table-for-two-phrase.mp3`, `words/table-noun.mp3`, `words/two-num.mp3`, `words/a-art.mp3`, `lines/r1-l2.mp3` | the `[[ə ˈteɪbəl fɚ ˈtu]]` override may reduce "for two" too far for beginners; consider /fɔɹ/ in the slow clip |
| ☐ | **sir** | "Yes, sit" (a fresh render without the override is heard as "sir") | `words/sir-noun.mp3` | check the `[[sˈɝ]]` override |
| ☐ | **late checkout** | "a lit itch account" (fine without the override) | `words/late-checkout-phrase.mp3` | check the `[[ˈleɪt ˈtʃɛkˌaʊt]]` override |
| ☐ | **for here or to go** | "Harrow to Bell", "her roar to go" | `lines/r13-l4.mp3` | check the `[[tə ˈɡoʊ]]` weak form |
| ☐ | **salesperson / invoice / watch** | "I wore pairs of sails", "I'm Nian Inbois", "A March in a Ring" | `words/salesperson-noun.mp3`, `words/invoice-noun.mp3`, `words/invoice-noun-md0.mp3`, `words/watch-noun.mp3` | re-render, or override |
| ☐ | **shop / box / top** | "sharp", "barks", "tarp": long American /ɑ/ heard as British "ar" | many clips, e.g. `words/job-noun.mp3`, `words/gift-box-phrase.mp3` | probably fine (normal US vowel); note only |
| ☐ | **vine** | "fine" (is the /v/ audible?) | `words/vine-noun.mp3`, `words/vine-noun-md1.mp3` | listen for the lip-teeth /v/ |

## 2. Stress and IPA taught on the card

Speech recognition cannot hear stress, so these come from the content audit. The
card's IPA (and for *understated*, the `say` override) teach the stress shown.
A teacher should confirm before anything changes.

| ✓ | Card | Card says | Expected | Note |
|---|---|---|---|---|
| ☐ | `permit-noun` | /pɚ.ˈmɪt/ | /ˈpɝ.mɪt/ | noun is stressed on the first syllable; the card uses the verb entry |
| ☐ | `understated-adj` | /ˈʌn.dɚ.ˌsteɪ.tɪd/, override `[[ˈʌndɚˌsteɪtɪd]]` | /ˌʌn.dɚˈsteɪ.tɪd/ | the override forces the wrong stress into every clip |
| ☐ | `tax-refund-phrase` | /ˈtæks ɹɪ.ˈfʌnd/ | /ˈtæks ˌɹi.fʌnd/ | noun *refund* is /ˈɹi.fʌnd/ |
| ☐ | `toothache-noun` | /ˈtu.ˈθeɪk/ | /ˈtuθ.ˌeɪk/ | compound stress |
| ☐ | `initial-noun` | /ˌɪ.ˈnɪ.ʃəl/ | /ɪˈnɪʃəl/ | no secondary stress on the first syllable |
| ☐ | `resolve-verb` | /ɹi.ˈzɑlv/ | /ɹɪˈzɑlv/ | first vowel is reduced |
| ☐ | `of-prep` | "a cup `[[ˈʌv]]` tea" | "a cup of /əv/ tea" | stressed /ʌv/ inside a phrase; native speech uses the weak form |

## How the check was run

`scripts/check_audio_asr.py` (also `npm run audio:check`) transcribed all 4,227
recorded clips with Whisper base.en. 2,355 matched their text outright. For the
other 1,872, the shown text was rendered again with the same voice, and the
clip was compared with that fresh render acoustically (MFCC + dynamic time
warping). Before this PR, 148 clips voiced a different sentence or had text
that changed; they were re-rendered. After it, only the three override clips
in `tests/fixtures/asr-known.json` (a table for two, sir, late checkout) stand
out, and they are listed above. The mishearings in the table are shared by the
clip and the fresh render, which points to the voice rather than to a stale
clip.

Lines with `{{learner}}` and `runtimeTts` lines are spoken by the device voice
at runtime, so their mp3s are not checked. f5-l4.mp3 was stale (the audit
heard "…my email is linked sharp") and was re-rendered anyway.
