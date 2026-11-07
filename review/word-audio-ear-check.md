# Missing word audio: review

From the original **114 missing cards**, **111 now have an accepted normal/slow pair**. The deck has **750/753** word-audio pairs; **3 remain unavailable** on the card front. Their checked example sentences still play.

Evidence: [selection report](word-audio-selection.json). Every restored pair has six Whisper perturbations per speed, mandatory Parakeet agreement, its speaker and final MP3 SHA-256. These are machine checks, not a claim that a person listened to every take.

## Still unresolved

The links below play the original, rejected files retained on disk; they are **not** enabled in the app. Their transcripts are from the baseline run. The selection report separately records the later candidate attempts; failed candidates never replace these files.

| Card | IPA | Original normal: Whisper / Parakeet | Original slow: Whisper / Parakeet | Listen |
|---|---|---|---|---|
| `a-art` — a | /ə/ | [BLANK_ / This | *squeak / But | [normal](../assets/audio/words/a-art-word.mp3) · [slow](../assets/audio/words/a-art-word-slow.mp3) |
| `fee-noun` — fee | /ˈfi/ | Feed / Feet. | Fade / Feat. | [normal](../assets/audio/words/fee-noun-word.mp3) · [slow](../assets/audio/words/fee-noun-word-slow.mp3) |
| `led-verb` — led | /ˈlɛd/ | Lead / Lead. | Lead / Lead | [normal](../assets/audio/words/led-verb-word.mp3) · [slow](../assets/audio/words/led-verb-word-slow.mp3) |

Do not simply delete a card from the skip list or add a broad ASR exception. Re-record a clear pair and re-run selection plus CI. Homographs such as `lead` do not prove that `led` was pronounced /lɛd/; weak-form `a` and `the` must retain the IPA shown on their cards. A human listening decision should name the exact file/hash and pronunciation before any rule changes.

## Restored cards

| Card | Speaker | Normal method | Slow method |
|---|---|---|---|
| aisle-noun | 0 | existing | accepted normal atempo=1/1.35 |
| alcohol-noun | 0 | existing | existing |
| allergic-adj | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| beat-verb | 0 | existing | accepted normal atempo=1/1.35 |
| breakfast-noun | 0 | existing | accepted normal atempo=1/1.35 |
| buffet-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| card-noun | 0 | existing | existing |
| check-noun | 0 | existing | accepted normal atempo=1/1.2 |
| check-verb | 0 | existing | accepted normal atempo=1/1.35, +300ms lead/+600ms tail |
| chef-noun | 0 | existing | accepted normal atempo=1/1.35 |
| chew-verb | 1 | Kokoro length_scale=1.0, ending=',', +300ms lead/+600ms tail | accepted normal atempo=1/1.35, +300ms lead/+600ms tail |
| clock-noun | 0 | existing | accepted normal atempo=1/1.35 |
| close-verb | 0 | existing | accepted normal atempo=1/1.35 |
| cold-adj | 0 | existing | existing |
| compensation-noun | 0 | existing | existing |
| complimentary-adj | 0 | existing | existing |
| cost-noun | 0 | existing | existing |
| cough-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| course-noun | 0 | existing | accepted normal atempo=1/1.35 |
| cup-noun | 0 | existing | existing |
| discreet-adj | 0 | existing | existing |
| egg-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| else-adv | 1 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35, +300ms lead/+600ms tail |
| email-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| excess-noun | 0 | accepted slow atempo=1.35, +300ms lead/+600ms tail | existing |
| few-det | 0 | existing | existing |
| fit-verb | 0 | accepted slow atempo=1.35 | existing |
| fitting-room-phrase | 0 | accepted slow atempo=1.35 | existing |
| four-num | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| freeze-verb | 0 | existing | accepted normal atempo=1/1.35 |
| gram-noun | 0 | existing | existing |
| guarantee-noun | 0 | existing | accepted normal atempo=1/1.35 |
| high-chair-phrase | 0 | existing | existing |
| if-conj | 0 | existing | accepted normal atempo=1/1.35 |
| is-verb | 0 | accepted slow atempo=1.35 | existing |
| it-pron | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| jade-noun | 0 | existing | existing |
| job-noun | 0 | existing | accepted normal atempo=1/1.35 |
| karat-noun | 0 | existing | existing |
| key-card-phrase | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| know-verb | 0 | Kokoro length_scale=1.0, ending='.' | existing |
| laptop-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| late-checkout-phrase | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| leak-noun | 0 | existing | accepted normal atempo=1/1.35 |
| lease-noun | 0 | existing | accepted normal atempo=1/1.35 |
| live-verb | 0 | existing | accepted normal atempo=1/1.35 |
| lustre-noun | 3 | Kokoro length_scale=1.0, ending='', +300ms lead/+600ms tail | accepted normal atempo=1/1.35 |
| madam-noun | 0 | Kokoro length_scale=1.0, ending='!', +300ms lead/+600ms tail | accepted normal atempo=1/1.35 |
| may-verb | 0 | existing, +300ms lead/+600ms tail | accepted normal atempo=1/1.35 |
| meet-verb | 0 | existing | accepted normal atempo=1/1.35 |
| millilitre-noun | 0 | existing | accepted normal atempo=1/1.35 |
| oclock-adv | 0 | existing | existing |
| of-prep | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| off-adv | 0 | Kokoro length_scale=1.0, ending=',' | accepted normal atempo=1/1.25, +300ms lead/+600ms tail |
| order-verb | 0 | existing | accepted normal atempo=1/1.35 |
| pair-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| percent-noun | 0 | accepted slow atempo=1.35 | existing |
| platinum-noun | 0 | existing | existing |
| postage-stamp-noun | 0 | existing | accepted normal atempo=1/1.35 |
| prepaid-adj | 0 | existing | accepted normal atempo=1/1.35 |
| priority-noun | 0 | Kokoro length_scale=1.0, ending=',' | existing |
| quote-noun | 0 | existing | existing |
| reach-verb | 0 | existing | accepted normal atempo=1/1.35 |
| read-verb-present | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| refill-noun | 0 | accepted slow atempo=1.35, +300ms lead/+600ms tail | existing |
| refund-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| return-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| right-this-way-phrase | 0 | existing | existing |
| rose-gold-phrase | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| sauce-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| savings-account-phrase | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| scratch-noun | 0 | existing | accepted normal atempo=1/1.35 |
| see-verb | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| set-noun | 0 | existing | accepted normal atempo=1/1.35 |
| sheep-noun | 0 | existing | accepted normal atempo=1/1.35 |
| shellfish-noun | 0 | existing | accepted normal atempo=1/1.35, +300ms lead/+600ms tail |
| shift-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| ship-noun | 0 | existing | accepted normal atempo=1/1.35 |
| shoe-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| sick-adj | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| sim-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| sir-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| sit-verb | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| six-num | 0 | existing | accepted normal atempo=1/1.35 |
| sketch-noun | 0 | existing | accepted normal atempo=1/1.35 |
| sorry-adj | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| sparkling-adj | 0 | existing | accepted normal atempo=1/1.35 |
| spell-verb | 0 | existing | accepted normal atempo=1/1.35 |
| split-verb | 0 | existing | accepted normal atempo=1/1.35 |
| stamp-verb | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| stock-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| street-noun | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| table-for-phrase | 0 | existing | existing |
| table-for-two-phrase | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| take-verb | 0 | Kokoro length_scale=1.0, ending='!' | accepted normal atempo=1/1.35 |
| tap-noun | 0 | existing, +300ms lead/+600ms tail | existing |
| the-art | 0 | Kokoro length_scale=0.95, ending='.' | accepted normal atempo=1/1.2 |
| the-art-vowel | 4 | Kokoro length_scale=1.05, ending='.' | accepted normal atempo=1/1.35 |
| think-verb | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| too-adv | 0 | existing | accepted normal atempo=1/1.35 |
| top-up-noun | 0 | existing | accepted normal atempo=1/1.35 |
| treated-adj | 0 | Kokoro length_scale=1.0, ending='.' | accepted normal atempo=1/1.35 |
| two-num | 0 | existing | accepted normal atempo=1/1.35 |
| week-noun | 0 | existing | accepted normal atempo=1/1.35 |
| weekend-noun | 0 | Kokoro length_scale=1.05, ending='.' | accepted normal atempo=1/1.35 |
| weight-noun | 0 | Kokoro length_scale=1.0, ending='!' | accepted normal atempo=1/1.35 |
| wine-noun | 0 | existing | existing |
| with-prep | 1 | Kokoro length_scale=1.0, ending='' | accepted normal atempo=1/1.35 |
| worth-adj | 0 | existing | accepted normal atempo=1/1.35 |
| wrap-verb | 0 | accepted slow atempo=1.35 | existing |
| your-det | 0 | Kokoro length_scale=1.0, ending='.' | existing |
