# English Quest: content audit

| | |
|---|---|
| Repo / commit | `penny323mo/english-quest` `main` = `4440f2ec` (same commit as tag `v1.0`) |
| Date | 2026-11-03 |
| Mode | Review only. No content, code or audio was edited, committed or pushed. This file is the only output. |
| Learner | Cantonese speaker in Hong Kong / Macau. Glosses should be colloquial 廣東話 in Traditional characters. Audio is Piper `en_US-ljspeech-medium` (American English). |

## 1. Summary

### Overall verdict: **not ready**

The lesson dialogues from A1 to B1 are mostly usable. The Cantonese is colloquial and nearly free of Mandarin wording, and no learner name is hard-coded. But four problems a learner would notice run across the whole app:

1. **Wrong or offensive meaning**
   - 「叫雞」 is printed 11 times as the gloss for "order chicken". It is common HK/Macau slang for hiring a sex worker.
   - 「上鐘」 is used for winding a clock (wind-verb).
   - At least 20 quiz items are keyed wrong.
   - Several facts are wrong: pearl care, sales-tax refunds that don't exist in Hong Kong or Macau, a "double" room as 雙床, prawns as 貝殼類.
2. **Vocab cards contain machine-generated nonsense.** About 200 example or mini-dialogue sentences make no sense, for example "I misplaced my price after lunch.", "Please sparkle the form carefully.", "Note eggnoun: polish the egg lightly." They appear on the card under 例句 / 更多.
3. **Audio problems**, verified by transcribing all 4,222 clips:
   - **81 third-example clips play a different, older sentence** than the one on screen ("Please check the room beside the room tray.").
   - **11 clips say the wrong word.** This includes the main ▶ clip of two cards: "This ring is too *platinum*" (expensive) and "This *karat* is eighteen-karat gold" (setting). It also includes "My *bracelet* is still sore" (wrist).
   - **13 clips read IPA markup aloud** ("slash N slash").
   - **3 R3 roleplay clips** are longer than the text on screen.
   - **The `say` field is corrupted in 43 places**; any re-render would bake those errors in.
   - **Likely mispronunciations**, where two speech-recognition models agree: ship and sheep sound identical in F1, "Hong Kong", "tablet", "water", "SIM", "Saturday", and "forty/eighty dollars" heard as "four/eight".
4. **Six B2 lessons are incoherent**: T20, J23, R17, W14, W15 and J24. Their 28 vocab cards reuse the same broken lines.

Each fix is content-only, but the vocab nonsense and audio problems are too widespread to ship as-is.

### What I read

| Source | Items read in full |
|---|---|
| `content/lessons/*.json` (97 files) | 740 dialogue lines · 291 understand · 326 chunks · 194 build · 291 roleplay turns · 487 quiz items = **2,329** |
| `content/lines.json` | 778 audio lines; the 38 roleplay-only lines not in any lesson file were read separately |
| `content/lexicon.json` | **777 vocab cards**: 777 headwords + glosses, **4,011 example / mini-dialogue sentences** (2,589 distinct) with their 廣東話, 908 usage / pitfall notes, collocations, IPA, syllables, stress, ARPAbet, and every `say` phoneme override |
| `content/decks.json` | 5 decks, 566 card references, all resolve to cards |
| `content/sense-labels.json` | 12 part-of-speech labels + 774 sense labels (the eyebrow text on each card) |
| `content/path.json` | 6 unit titles and blurbs, 97 path entries |
| **Text total** | **≈ 8,070 lines read** |
| Audio | **4,222** distinct recorded clips (lesson lines, roleplay, word cards, examples, mini dialogues), plus 865 phoneme-override substitutions aligned word by word |

### What I flagged

| Area | Rows in the tables below |
|---|---|
| Lessons (grouped by lesson) | 295 rows; **196 of 740 dialogue lines (26%)** are flagged, plus quiz, chunk and roleplay items |
| Vocab cards (grouped by deck) | 302 rows, including about 200 nonsense example or mini-dialogue sentences and 81 stale audio clips |
| Pronunciation / audio | 28 rows (section 2) |

Lesson rows by category: scene logic 89 · unnatural 77 · quiz / answer key 46 · gloss 26 · grammar 19 · text ≠ what is tested/played 16 · glued clauses 12 · punctuation / spelling 8 · level 2

Vocab rows by category: nonsense sentence 152 · nonsense sentence + stale audio 46 · audio ≠ text (stale clip) 35 · gloss 25 · grammar 15 · unnatural 9 · scene logic 7 · punctuation / spelling 4 · vocab sense 3 · pronunciation 2 · duplicate 2 · word choice 1 · glued clauses 1

### Checks that passed (no issues found)

- **Learner name.** Every learner line uses `{{learner}}` or `{{learner-spell}}`. 「阿琳」 never appears in content. Named characters (Mei, Tom, Kim…) are only used for cast members.
- **Mandarin wording.** A scan of every Chinese string for 是 / 的 / 這 / 們 / 沒 / 什麼 / 給 / 看 / 說 / 在 / 嗎 / 您 / 很 / 現在 / 東西 found **no Mandarin grammar**. The only hits are compounds (目的地, 的士) and a few written-register phrases: 「維持不變」 (d3-l5, j23-l8, t16-l8), 「從不」 (F6 Q2, never-adv), 「為不便道歉」 (J9 U0, T6), 「在職」 (W6 Q2), 「商店」 (t2-l5).
- **Traditional characters.** No Simplified characters appear in any `glossYue`, `yue` or label field. Simplified appears only in the developer-only `glossZh` field.
- **IPA bookkeeping.** For all 777 cards, IPA = ARPAbet = syllable IPA, and stress index = the ˈ mark. The only differences are 3 deliberate fixes (here /hɪɹ/, contactless /ləs/).
- **Heteronyms.** read / read, live / live, wind / wind, close / close, bow / bow and bass / bass each get the right audio override.
- **Weak forms.** Can /kən/, of course /əv/, a table /ə/, for /fɚ/ and to /tə/ are taught and rendered as weak forms (2.2 notes one case reduced too far).

### Spelling standard

The app is **mostly British spelling with -ize endings**: jewellery 51, flavour 32, labour 44, millilitre 24, grey 43, licence 38, lustre 41, anaesthetic 39, cancelled 33, apologize 35. The exceptions are **color (47)** and **harbor (17)**, against colour 17 and harbour 25. Lessons J19 and T7, and the card calling-verb, mix both spellings internally. Note also that a British-spelled app teaches American pronunciation; that is acceptable, but should be stated once in the UI.

### Fix first

1. **Remove 「叫雞」 (11 places) and 「上鐘」 (wind-verb).** Use 「我要個雞」/「我想點雞肉」 and 「上鍊」.
2. **Re-key the wrong quiz answers** listed in the lesson tables under "quiz / answer key". Examples: T3 Q3 double = 雙人床; R2 Q2; R3 Q2; J9 Q3; J20 Q2; R13 U1/U2; the rotating 「關於/講緊/唔係」 understand items.
3. **Restore the 43 corrupted `say` strings.** Then re-render the 11 wrong-word clips, the 81 stale third-example clips, the 13 clips that read IPA aloud and the 3 R3 roleplay clips. Add tests that each `[[…]]` override replaces only its own headword and that each clip transcribes back to its text.
4. **Delete or replace the ~200 nonsense vocab sentences.** They are the third example on most cards, plus about a dozen template mini-dialogues ("Did security ask you to wash?").
5. **Rewrite the six B2 lessons and their 28 vocab cards.**
6. **Fix the fact errors**: pearl care, HK/Macau tax refunds, souvenir-shop stamping, double vs twin, prawns as 貝殼類, high chair = 高腳櫈, carousel before immigration.

---

## 2. Pronunciation and audio (分析發音／語音)

### 2.1 Method

| Check | How | Coverage |
|---|---|---|
| IPA consistency | Converted every ARPAbet string to IPA and compared it with `ipa`, `syllableIpa`, `syllables` and `stress` | 777 / 777 cards |
| Stress and heteronyms | Reviewed every noun/verb stress-shift word and heteronym against standard American pronunciation | 36 risky words |
| Phoneme overrides | Aligned each `say` string with its displayed `en` text word by word, then checked that every `[[…]]` override spells the word it replaces | 865 substitutions in 282 distinct overrides |
| What the audio actually says | Transcribed every recorded clip with Whisper `base.en` (offline) and compared the transcript with the on-screen sentence; any clip that differed was re-transcribed with Whisper `small.en`, and only problems both models agree on are reported | 4,222 first pass (base.en) · 567 rechecked (small.en) clips |
| Truncation and padding | Measured each clip's duration and its syllables per second (median 3.8) and checked the outliers | 4,222 clips |

### 2.2 Findings

- **Stale clips (81 on 79 cards).** The third example (例句 3, sometimes 例句 2 or a mini-dialogue line) plays a different sentence from the one on screen. These are older template sentences, which a learner hears with no matching text.
- **Wrong word spoken (11 clips, confirmed by ASR).** A copy-paste error in the `say` overrides voices another card's word. The worst cases are on the card's own ▶ button: expensive ("This ring is too platinum") and setting ("This karat is eighteen-karat gold").
- **Corrupted `say` data (43 strings on 15 cards).** pearl, gold, white gold, expensive, setting, try on, fit, loose, wrist, comfortable, almost, refund form, on the side, service charge and return your call all have `say` text with another card's word or dropped words. Most of their mp3s predate the corruption and still sound right, but re-rendering would break them.
- **IPA read aloud (13 clips).** Sentences such as "Night uses /n/." are voiced as "Night uses slash N slash".
- **Audio ≠ on-screen text**: the R3 roleplay (3 clips) and the four /w/–/v/ cards, where only the single word is voiced.
- **Likely mispronunciations** where both models agree and should be checked by ear:
  - ship and sheep sound identical in F1, the lesson about that contrast;
  - "Hong Kong";
  - "tablet" → "to look";
  - "water" → "war";
  - "SIM";
  - "Saturday";
  - "forty / eighty dollars" heard as "four / eight".
- **Wrong stress taught.** The card IPA is wrong for permit (noun), understated, tax refund (noun), toothache, initial and resolve. Understated's audio is also wrong, because the override forces the bad stress.
- **Weak forms.** Most are handled well. The exceptions are "a cup *of* tea", which the of-prep card forces to a stressed /ʌv/, and "a table for two", which may be reduced too far for beginners.


### 2.3 Pronunciation / audio table

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| expensive-adj (main ▶ clip, E/e1) + e3 | This ring is too expensive. / This watch is too expensive for my budget. | 呢隻戒指太貴。… | audio: wrong word | ASR: "This ring is too platinum" / "This watch is too platinum for my budget"; the card's own play button says "platinum" | re-render with "expensive" | — |
| setting-noun (main ▶ clip, E/e1) | This setting is eighteen-karat gold. | 呢個鑲托係十八開金。 | audio: wrong word | ASR: "This carrot [karat] is 18-karat gold"; the headword is replaced on the card's own play button | re-render | — |
| pearl-noun e3 | We keep every pearl in the safe overnight. | 每件珍珠夜晚都鎖喺夾萬。 | audio: wrong word | ASR: "We keep every natural in the safe overnight" | re-render (and fix the sentence) | — |
| gold-noun e3 | We keep every gold in the safe overnight. | 每件金夜晚都鎖喺夾萬。 | audio: wrong word | ASR: "We keep every authentic in the safe overnight" | re-render | — |
| white-gold-phrase e3 | Could you show me a white gold near the window? | 可唔可以喺窗邊畀我睇吓白K金？ | audio: wrong word | ASR: "Could you show me a platinum…"; on the card that warns white gold ≠ platinum | re-render | — |
| fit-verb e3 / loose-adj e3 / wrist-noun e3 / comfortable-adj e3 | Can you fit it again for me? / Guests said the room was loose. / My wrist is still sore after the fall. / This chair is comfortable for long waits. | … | audio: wrong word | ASR: "Can you bracelet it again", "the room was bracelet", "My bracelet is still sore", "This chair is bracelet for long waits" | re-render | — |
| on-the-side-phrase e3 | Please tell us if the dish has on the side. | 如果菜式有另上，請同我哋講。 | audio: words dropped | ASR: "…if the dish has on"; "the side" is not spoken | re-render (and fix the sentence) | — |
| say-field corruption (43 strings on 15 cards) | e.g. white-gold e2 say = "[[plˈætənəm]] is not platinum."; refund-form e1 say = "Please sign the [[ɹˈifˌʌnd]]." | — | data bug | the `say` text that drives audio rendering has another card's word, or drops words, in 43 places. Most existing mp3s were rendered before the corruption and are still fine, but the next `npm run audio` will bake in every error (the list is in 2.2). | restore each `say` from its `en` text; add a test that each [[…]] replaces only its own headword | — |
| 81 third-example clips (list in section 4: "audio ≠ text (stale clip)") | e.g. room-noun e3 "I timed how long the room lasts." | — | audio ≠ text | the clip plays an older template sentence that is no longer on screen ("Please check the room beside the room tray.", "Glenn asked about the budget behind the green plant before noon."). Both the old and new sentences are nonsense. | replace the sentences, then re-render | — |
| 13 mini-dialogue / example clips with IPA in slashes | Night uses /n/. Light uses /l/. / Lift has /ɪ/, and left has /ɛ/. / Do not turn the /v/ into /w/. | — | audio: symbols read aloud | TTS reads the markup: ASR heard "Night uses slash N slash", "Lift has slash small capital I slash…" | keep IPA in the gloss/notes only; voice the sentence without symbols | — |
| wine-noun / vine-noun / west-noun / vest-noun E | Wine starts with /w/. (etc.) | Wine 開頭係圓唇 /w/。 | audio ≠ text | the clip says only the single word; for vine, both models heard "fine", so check by ear whether the /v/ is audible | voice the word in a carrier sentence; listen-check /v/ | — |
| R3 roleplay partner turns | What would you like to order? / Does this dish contain peanuts? / The sauce is spicy. | — | audio ≠ text | both models confirm the audio adds "…and do you have any food notes?", "…or is it made without them?", "…and it has a little heat in it." | show the full sentence or re-render | — |
| F1: f1-l2, F1 roleplay model "Ship. Sheep." | Listen. Ship is short. Sheep is long. | 聽住。Ship 係短音。Sheep 係長音。 | audio: contrast lost (likely) | both models hear ship and sheep as the same word ("chic … chic", "shé shé"); sheep-noun "Sheep is long" → "Sheik is lying". The lesson's whole point is this contrast. | native listen-check; if confirmed, force /ʃɪp/ vs /ʃiːp/ with clearer duration | — |
| f5-l2 / T1 roleplay / hong-kong-noun e1 | I'm from Hong Kong… / I'm flying to Hong Kong. | — | audio: mispronounced (likely) | both models: "Haring Kind", "Harenkong", "hard-caught"; the learner's own city | override [[ˈhɑŋ ˈkɑŋ]] and listen-check | — |
| d6-l5 / tablet-noun | The dosage is one tablet twice a day. | 劑量係每次一粒，一日兩次。 | audio: mispronounced (likely) | both models: "one to look twice a day" | listen-check "tablet" /ˈtæblət/ | — |
| water (d3-l3, too-adv m1, still-adj, avoid-verb e1, water-resistant) | …and water is included. / I want water too. | — | audio: mispronounced (likely) | both models repeatedly hear "war" ("the war is included", "I want war too", "Still war"); the flapped /t/ in /ˈwɔɾɚ/ seems to be lost | listen-check; override [[ˈwɔɾɚ]] if confirmed | — |
| Saturday (j15-l4/l5, j22-l1/l4, r14-l5, saturday-noun) | …on Saturday. | — | audio: mispronounced (likely) | both models: "so the day", "set a date", "civil day" | listen-check; the [[ˈsætɚdi]] override is fine on paper | — |
| forty / eighty dollars (r17-l2, j13-l5, j20-l4, d7-l5, j18-l2, roughly-adv e1, labour-noun) | The cancellation fee is forty dollars. / It's eighty dollars in total. | — | audio: number unclear (likely) | both models heard "$4.00" / "eight dollars"; a learner may hear 4 vs 40 and 8 vs 80 | listen-check; slow clips should stress the "-ty" | — |
| SIM (d4-l4, d4-l7, d4-l8) | …the new SIM card… | — | audio: mispronounced (likely) | both models: "Assign M", "SINAM", "SR-M"; Piper may be spelling the letters | override [[ˈsɪm]] | — |
| shop / box / top (many lines) | …the shop… / …the box… | — | audio: vowel (watch) | both models often hear "sharp", "barks", "tarp"; the voice's long /ɑ/ is heard as British-style "ar"; within US range but worth a listen | native listen-check only | — |
| permit-noun (card IPA) | /pɚ.ˈmɪt/: Do you have an international permit? | 你有冇國際駕駛許可證？ | pronunciation: stress | the noun is stressed on the first syllable /ˈpɝ.mɪt/; the card teaches verb stress (CMU verb entry); stress cannot be checked by ASR | /ˈpɝmɪt/ (+ say-override) | — |
| understated-adj (card IPA + all clips) | /ˈʌn.dɚ.ˌsteɪ.tɪd/, override [[ˈʌndɚˌsteɪtɪd]] | 低調 | pronunciation: stress | primary stress belongs on "-stat-": /ˌʌn.dɚˈsteɪ.tɪd/; the override forces the wrong stress into every clip | [[ˌʌndɚˈsteɪtɪd]] | — |
| tax-refund-phrase / toothache-noun / initial-noun / resolve-verb (card IPA) | /ˈtæks ɹɪ.ˈfʌnd/ · /ˈtu.ˈθeɪk/ · /ˌɪ.ˈnɪ.ʃəl/ · /ɹi.ˈzɑlv/ | — | pronunciation: IPA | noun "refund" /ˈɹi.fʌnd/; compound /ˈtuθ.ˌeɪk/; /ɪˈnɪʃəl/; /ɹɪˈzɑlv/ | — | — |
| of-prep E | I would like a cup of tea. (say "a cup [[ˈʌv]] tea") | 我想要一杯茶。 | pronunciation: weak form | stressed /ʌv/ inside a phrase; native speech is /əv/ | use /əv/ in the sentence | — |
| a-art / two-num / table-for-two-phrase / r1-l2 | A table for two, please. | 兩位，唔該。 | audio: weak forms over-reduced (likely) | both models: "but table foot to please"; the [[ə ˈteɪbəl fɚ ˈtu]] override may reduce "for two" too far for beginners | listen-check; consider /fɔɹ/ in the slow clip | — |
| invoice-noun / salesperson-noun / watch-noun main clips | I need an invoice. / I work here as a salesperson. / A watch and a ring. | — | audio: unclear (likely) | first model: "I'm Nian In-Boys", "I wore pairies of sails since", "A large amount of rain"; second model (watch): "A March in a Ring" | listen-check and re-render | — |
| jewellery / jewelry cards | /ˈdʒul.ɹi/ forced in every clip | 珠寶 | pronunciation: note | two-syllable /ˈdʒul.ɹi/ is a real casual US form, but learners will meet /ˈdʒu.əl.ɹi/ in dictionaries; it is only mentioned in a note | show /ˈdʒu.əl.ɹi/ as the main form | — |
| f5-l4.mp3 (stale file) | My number is five five one two, and here is my email. | — | audio file stale | the line is marked runtimeTts (the device voice speaks it), but the shipped f5-l4.mp3 says something else (ASR: "…and my email is linga…sharp"); it is precached but never played | delete the file or re-render it | — |

---

## 3. Lessons: issues grouped by lesson

The columns are the ones requested. "—" means not applicable; quiz rows have no gloss. Rows marked "All lessons" describe a defect that repeats across many lessons, with examples.

### All lessons (cross-cutting)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| GLOBAL 叫雞 (r3-l1 gloss + 10 quiz/build/understand items in R2, R3, R8, T2, T3, J5, J7) | I'd like the chicken glossed/distractor as 「我想叫雞」 | 我想叫雞 | gloss | gloss/register: 「叫雞」 is common HK/Macau slang for hiring a sex worker; a learner app must not print it | — | 「我想要雞肉」/「我想點雞」/「我要個雞」 |
| GLOBAL 客人講「…」 (27 lessons) | Quiz meaning prompts all say 客人講「…」 | — | quiz / answer key | speaker error: many quoted lines are said by staff (e.g. T2 Q2/Q3 security officer, J3 Q3 Mei); also the keyed answer is a single noun for a whole sentence (J3 Q2 手鏈, T2 Q2 膠盤) | use 「佢講…」 or name the speaker; ask about the word, not the sentence | — |
| GLOBAL English quiz prompts (R10, D7, …) | Listen once and pick…, "What does X mean?" | — | level | level/UI: A1–A2 quiz prompts in English while every other lesson uses Cantonese | translate prompts to 廣東話 | — |
| GLOBAL spelling | jewellery/colour/harbour/labour/grey (UK) vs color/harbor/center/elevator (US) | — | punctuation / spelling | mixed spelling standard: the app is mostly British with -ize endings, but color (47) and harbor (17) slip in; J19 and T7 mix both inside one lesson | standardise on British spelling (jewellery, colour, harbour), keep -ize | — |
| GLOBAL B0 「你想用呢課嘅講法。你點講？」 (T17,R13,J18,J20,T15,…) | — | — | quiz / answer key | key: prompt gives no situation, every choice is a lesson line, so the key is arbitrary | write a situation per item | — |
| GLOBAL C patterns (D6,J15,T12,T13,…) | shown pattern ≠ revealed example sentence | — | text ≠ what is tested/played | mismatch: learner fills a blank in one sentence, then sees a different sentence | regenerate example from pattern | — |
| GLOBAL junk distractors (T20,J23,R17,W14,W15,J24,T21,J22,T19,J13) | choices "shirt / meter", "Friday / receipt", "窗 / 鐘 / 鞋", "手鏈 / 登機證", "towel / oyster", "read / live" | — | quiz / answer key | quiz quality: filler distractors from unrelated lessons make every item trivially guessable | draw distractors from the same lesson | — |
| path.json unit A2B1 / B1 / B2 blurbs | …召的士。同訂枱請客同換錶電同錶帶。 / …珍珠保養。同轉機同回覆投訴電郵同銀行開戶。 / 貴客諮詢、面試自我介紹、航班延誤同公司訂禮品都開咗。 | — | gloss | glued topic lists chained with 「同…同…同」 and sentences starting with 「同」 (items appended after the full stop); B2 blurb lists 4 of its 11 lessons | rewrite each blurb as one short sentence | e.g. B1：售後、投訴、酒店、銀行、租樓同開會。 |
| path.json titles T20/J23/R17/W14/W15/J24/T21 | path titles differ from lesson titleYue (e.g. T20 path 轉機安檢同搵路 vs lesson 安檢同超大件) | — | text ≠ what is tested/played | stale titles left in path.json (hidden today because the app shows titleYue, but they will surface if a lesson is marked soon) | sync path.json with lesson titles | — |

### F2 · Greetings and names ｜ 打招呼同名字 (A1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| f2-l5 + F2 RP3 | Hi. Please say it again for me. (RP expects "Thank you.") | 哈囉。請你再同我講一次。 | scene logic | scene-logic: "Hi" at the end of a finished greeting; RP turn asks learner to repeat but the expected reply is "Thank you." (non-sequitur) | Great. Can you say your name once more? | 好。你可唔可以再講多次你個名？ |

### F3 · Numbers, money, and time ｜ 數字、錢同時間 (A1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| F3 RP2 | What time is it, please? -> EXPECT "Yes, it's three o'clock." | — | grammar | grammar: "Yes," answers a wh-question | It's three o'clock. | 而家三點。 |
| f3-l2 | This is ten dollars. | 呢個係十蚊。 | unnatural | naturalness: price answer is "It's ten dollars." | It's ten dollars. | 十蚊。 |

### F4 · Polite phrases ｜ 禮貌用語 (A1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| f4-l1 | Excuse me, can you help me here please? | 唔該，可唔可以喺呢度幫我？ | punctuation / spelling | punctuation: missing comma before "please"; "here" padding | Excuse me, can you help me, please? | 唔該，可唔可以幫一幫我？ |
| f4-l4 | Thank you for saying that to me. | 多謝你咁講。 | unnatural | naturalness: not what a native says after "please don't worry" | Thanks for understanding. | 多謝你體諒。 |
| f4-l5 | You're welcome. Good night, and sleep well. | 唔使客氣。晚安，好好瞓。 | scene logic | scene-logic: shop/door scene ends with "sleep well" | You're welcome. Have a good night. | 唔使客氣。晚安。 |

### F5 · Personal details ｜ 個人資料 (A1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| f5-l4 | My number is five five one two, and here is my email. | 我號碼係五五一二，電郵喺呢度。 | glued clauses | glued clauses with "and"; 4-digit phone number is unrealistic for HK/Macau (8 digits) | My number is 6123 4567. And here's my email. | 我電話係 6123 4567。呢個係我電郵。 |
| F5 C2 | My phone number is ready. | 我嘅電話⋯⋯準備好。 | unnatural | unnatural English; gloss is broken Cantonese | Here's my phone number. | 呢個係我電話號碼。 |
| F5 Q5 | 邊句係講自己住邊？ key = "Where are you from?" | — | quiz / answer key | wrong key: the keyed answer is a question, not a sentence about where you live; explain mentions "live" which is absent | key -> "I'm from Hong Kong, and I live here now." | — |

### J1 · Greeting a customer ｜ 迎接客人 (A1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j1-l1 / J1 SH | Welcome to our jewellery store. (shadow hint: "...jewellery shop...") | 歡迎嚟我哋珠寶店。 | text ≠ what is tested/played | shadow hint text ≠ line text/audio (store vs shop); karaoke & keyword check use the hint | Make the hint match: "Welcome to our jewellery store. How can I help you today?" | — |
| J1 U1/C1/B1 | How may I help you (today)? | 今日有咩可以幫到你？ | text ≠ what is tested/played | quiz/chunk/order use "may" but the taught line and audio say "can" | Use "How can I help you today?" everywhere, or change j1-l1 to "may" | — |

### R1 · Entering and seating ｜ 入座 (A1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r1-l3/r1-l4 | Right this way. Would you like a table by the window? → "Thank you. This is great." | 請跟我嚟。想唔想坐靠窗？ / 多謝。好好。 | scene logic | scene-logic: yes/no question never answered | r1-l4: Yes, please. The window is great. | 好呀，唔該。靠窗好好。 |
| R1 U2 explain | right 呢度係「就係咁邊」 | — | gloss | gloss: 「就係咁邊」 is not idiomatic Cantonese | right this way ＝「呢邊請」 | — |

### F6 · Daily routines ｜ 每日作息 (A1/A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| f6-l4 | I sometimes take a short break, but I never stay long. | 我有時休息一陣，但唔會留好耐。 | unnatural | naturalness: "stay long" doesn't fit a break | I sometimes take a short break, but never for long. | 我有時會小休一陣，但唔會休息好耐。 |
| f6-l5 | We open before lunch and close after lunch. | 我哋午餐之前開舖，午餐之後關門。 | scene logic | scene-logic: a shop closing right after lunch; reads as "closes for the day at 2pm" | We open at ten and close at eight. | 我哋十點開舖，八點關門。 |
| F6 B0 | Mei 問你朝早點。你點答？ key = "What time do you usually start here?" | — | quiz / answer key | wrong key: keyed answer is Mei's question; explain is about "usually wake up" | key -> "I usually wake up early, then I start my shift." | — |

### J2 · What are you looking for? ｜ 你想搵咩 (A1/A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j2-l3 / J2 B0, RP1, U1 | We have a nice ring. (B0/RP key: "We have a very nice ring.") | 我哋有一隻好靚嘅戒指。 | text ≠ what is tested/played | mismatch: the /v/ lesson's dialogue never says "very"; U1/B0/RP test "very" that the learner never heard | j2-l3: We have a very nice silver ring. Would you like to see it? | 我哋有一隻好靚嘅銀戒指。想唔想睇吓？ |

### R10 · Ordering at a café ｜ 咖啡店落單 (A1/A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r10-l1 | Good morning, I would like a latte, please. | 早晨，我想要一杯拿鐵。 | punctuation / spelling | punctuation: comma splice; gloss drops "please" | Good morning. I'd like a latte, please. | 早晨。我想要杯拿鐵，唔該。 |
| r10-l2 | Hot or iced for that latte? | 呢杯拿鐵你想要熱定凍？ | unnatural | naturalness: a barista says "Hot or iced?" | Hot or iced? | 要熱定凍？ |
| r10-l5 | Yes, oat milk, please. The name is Cleo. | 好，燕麥奶唔該。個名係 Cleo。 | scene logic | scene-logic: name given before barista asks for it | (add barista line) Can I get a name for the cup? → It's Cleo. | 杯面寫咩名？→ Cleo。 |
| r10-l7 | To go, please. Keep the small size for me, thanks. | 拎走，唔該。幫我保持細杯，多謝。 | unnatural | naturalness + gloss: "keep the small size" is not said; 「保持細杯」 is a literal calque | To go, please. Thanks. | 拎走，唔該。 |
| R10 C1 | Would you like oat milk in the iced latte? | 冰拿鐵要唔要燕麥奶？ | gloss | gloss inconsistent: 冰拿鐵 here, 凍拿鐵 elsewhere; 凍 is the colloquial HK form | — | 凍拿鐵要唔要燕麥奶？ |
| R10 B1 | ORDER tokens Iced / please / small / size | — | grammar | ungrammatical target sentence "Iced please small size" | tokens: A / small / iced / latte / please → "A small iced latte, please" | — |
| R10 B0 | 你要凍拿鐵，用燕麥奶 key "Yes, please use oat milk, and put the name Cleo on the cup." | — | quiz / answer key | key: answer isn't a taught line; distractor "Iced, please…" also fits the prompt | — | — |
| R10 Q2 | What does oat milk mean? key 燕麥 | — | quiz / answer key | key: oat milk = 燕麥奶, not 燕麥 | key -> 燕麥奶 | — |

### D4 · Phone and data plans ｜ 電話卡同上網 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d4-l2 | The prepaid plan is much cheaper, and the coverage is enough. | 預繳計劃平好多，覆蓋都夠。 | unnatural | naturalness: "coverage is enough" | The prepaid plan is much cheaper, and the coverage is good. | 預繳計劃平好多，網絡覆蓋都夠用。 |
| d4-l4 | Please activate the new SIM card with your valid passport. | 請用你本有效護照開通呢張新電話卡。 | unnatural | naturalness: staff do the activation; English is stilted | I'll need your passport to activate the SIM card. | 開通張卡要睇吓你本護照。 |
| d4-l5 | Is the unlimited plan locked on a long mobile contract? | 無限計劃係咪綁一份長手機合約？ | grammar | grammar ("locked into") + scene order: asked after the customer already chose prepaid | Before I decide: does the unlimited plan need a long contract? | 決定之前想問：無限計劃係咪要簽長約？ |
| d4-l6 | A small top-up is enough if that plan stays cheap. | 如果嗰個計劃平，小小增值就夠。 | scene logic | scene-logic: does not answer the contract question; meaning unclear | Yes, it's a 12-month contract. With prepaid, you just top up. | 係，要簽十二個月。預繳就增值就得。 |
| d4-l7 | I'll pay for this prepaid SIM card here. | 我喺呢度畀錢買呢張預繳電話卡。 | scene logic | scene order: paying comes after activation (l4) | move before l4 | — |
| D4 B0 | Mina 問你要邊個計劃 key "Please activate the new SIM card with your valid passport." | — | quiz / answer key | wrong key: keyed answer is Mina's line; explain says "I'll take…" | key -> "I'll take the prepaid one. I don't need unlimited data." | — |
| D4 RP2 | Mina: activate with passport → EXPECT "Is the unlimited plan locked on a long mobile contract?" | — | scene logic | scene: non-sequitur reply | EXPECT: Sure. Here's my passport. | — |

### D5 · Post office and parcels ｜ 郵局寄包裹 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d5-l4 | It'll take five days, and we need your signature here. | 要五日，我哋需要你喺呢度簽名。 | glued clauses | glued unrelated clauses with "and" | It'll take about five days. Please sign here. | 大約五日到。唔該喺度簽名。 |
| d5-l6 | Please mark the full weight on the form before we send it. | 寄出之前請喺表格寫明全部重量。 | scene logic | scene-logic: the clerk weighs the parcel; the customer doesn't mark weight | Please write what's inside on the form. | 請喺表格寫低入面有咩。 |
| d5-l7 | May I keep this receipt until the parcel reaches my home? | 包裹送到我屋企之前，我可唔可以留住收據？ | scene logic | scene-logic: the parcel is going away to a destination, not to the sender's home | Should I keep this receipt until it arrives? | 我係咪要留住收據，等到寄到為止？ |
| d5-l8 | Your tracking number is on the receipt. Please add one postage stamp. | 追蹤號碼喺收據上面。請貼一張郵票。 | scene logic | scene-logic: stamp after payment/receipt for an airmail parcel | Your tracking number is on the receipt. | 追蹤號碼喺收據上面。 |
| d5-l3 | How long will this small parcel take to reach the destination? | 呢個細包裹要幾耐先到目的地？ | unnatural | naturalness: stilted | How long will it take to get there? | 要幾耐先寄到？ |
| D5 RP1 / B0 | Cole: fill in form → EXPECT "I would like to send this small parcel by airmail."; B0 "問你要寄去邊" key doesn't say where | — | scene logic | scene order reversed in RP; B0 key doesn't answer "where" | — | — |

### D7 · At the hair salon ｜ 剪頭髮 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d7-l1 | I would like a simple trim, and keep a light fringe. | 我想簡單修剪，留一個薄瀏海。 | grammar | grammar: broken parallelism ("I would like … and keep …") | I'd like a simple trim, and please keep my fringe light. | 我想簡單修一修，瀏海留薄啲。 |
| d7-l3 | Yes, please make both sides shorter for this trim. | 好，兩邊剪短，呢次係剪髮。 | gloss | gloss: 「呢次係剪髮」 is meaningless filler; English "for this trim" padding | Yes, please make both sides shorter. | 好，兩邊剪短啲，唔該。 |
| d7-l6 | Is it cheaper if I book my next short visit? | 如果預約下次短剪，會唔會平啲？ | unnatural | naturalness: "short visit" | Is it cheaper if I book my next visit now? | 而家預約下次會唔會平啲？ |
| d7-l8 | Please book that next short trim for me after the wash. | 洗完之後，請幫我預約下次剪髮。 | unnatural | naturalness/ambiguity: "after the wash" | Please book my next trim for Friday. | 唔該幫我約下個星期五剪。 |
| D7 C0/C1 | chunk glosses 我想修短少少。/ 價錢包吹乾。 | — | gloss | gloss drops a clause of the two-clause example | full gloss | 我想簡單修一修，留薄瀏海。/ 總共八十蚊，包埋吹乾。 |
| D7 B0 | 你問價錢包唔包吹乾 key "How much is it if you wash my hair here?" | — | quiz / answer key | key does not ask about blow dry | prompt -> 你想問喺度洗頭幾多錢 | — |

### J3 · Names of the pieces ｜ 件件嘅名 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j3-l2 | I like this bracelet, and the clasp is easy to open. | 我鍾意呢隻手鈪，個扣都易開。 | gloss | gloss: 手鈪 (bangle) vs the lesson's 手鏈 (U0 explain, Q2 key) | — | 我鍾意呢條手鏈，個扣都好易開。 |
| j3-l5 | Of course. This pair is beautiful. I'll show it to you. | 當然。呢對好靚。我畀你睇。 | grammar | grammar: pair of earrings → "show them" | Of course. This pair is beautiful. Let me show you. | 當然。呢對好靚。我攞畀你睇。 |
| J3 Q2/Q3 | 客人講「Of course. This pair is beautiful…」 key 一對耳環 | — | quiz / answer key | speaker is Mei (staff); sentence never says earrings; whole sentence keyed to a noun | — | — |
| J3 C0 | This necklace is beautiful when you wear it out this evening. | 呢條⋯⋯好靚。 | unnatural | naturalness + gloss drops clause | This necklace will look beautiful tonight. | 今晚戴呢條頸鏈一定好靚。 |

### T2 · Security and directions ｜ 安檢同方向 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t2-l5 | Straight ahead. Your gate is on the left, just after the shops. | 直行。閘口就喺商店後面左邊。 | gloss | gloss meaning: "just after" ≠ 「後面」 (behind); 商店 is Mandarin-leaning (舖頭) | — | 直行。過咗啲舖頭，閘口就喺左手邊。 |
| T2 C1 | Here is my laptop, and I will take it out of the bag. | 我部⋯⋯喺度。 | scene logic | scene-logic: "here is" before taking it out; gloss drops clause | I'll take my laptop out of the bag. | 我而家將部電腦拎出嚟。 |

### T17 · Airport security check ｜ 過機場安檢 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t17-l3 | Shouldn't the laptop and power bank come out of it? | 部手提電腦同行動電源係咪應該攞出嚟？ | grammar | grammar: "of it" has no antecedent (last noun is the clear liquids bag) | Should I take my laptop and power bank out of my bag? | 我係咪要將手提電腦同尿袋攞出袋？ |
| t17-l4 | Yes. Take the laptop out and leave the charger. | 係。部電腦攞出嚟，充電器留低。 | scene logic | scene/fact: ignores the power bank the canDo says must come out; "charger" swaps in a different item | Yes. Take out your laptop and your power bank. | 係。手提電腦同尿袋都要攞出嚟。 |
| t17-l7 | Thanks. Which way is gate thirty-five by the shuttle? | 多謝。閘口三十五搭接駁車點去？ | unnatural | naturalness: not idiomatic | Thanks. How do I get to gate thirty-five? Is there a shuttle? | 多謝。三十五號閘口點去？有冇接駁車？ |
| t17-l8 | Take the blue shuttle. It stops beside that far gate. | 搭藍色接駁車。佢停喺遠處嗰個閘口。 | unnatural | naturalness: "that far gate" | Take the blue shuttle. It stops right by gate thirty-five. | 搭藍色接駁車，佢喺三十五號閘口旁邊停。 |
| T17 B0 | 你想用呢課嘅講法。你點講？ | — | quiz / answer key | key: prompt has no situation; all three choices are lesson lines, so any is "correct" | give a situation: 你想問電腦使唔使攞出嚟 | — |
| T17 U0–U2 / Q2–Q3 | answers 關於液體 / 關於電腦 / 關於閘口 | — | level | level: topic-only items test nothing beyond one keyword | ask the meaning of the sentence | — |

### T11 · MTR and Octopus top-up ｜ 搭港鐵同增值 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t11-l2 | Please stay on the Island line, and it stops at Central. | 請留喺港島線，呢條線會停中環。 | glued clauses | glued + natural: "stay on" (already aboard) doesn't answer "which line from this station"; proper noun is "Island Line" | Take the Island Line. It stops at Central. | 搭港島綫，會停中環。 |
| t11-l4 | Use exit A, and it's a short walk out to the street. | 用 A 出口，行少少就到街。 | glued clauses | glued with "and" | Use Exit A. It's a short walk from there. | 行 A 出口，出去行兩步就到。 |
| t11-l7 | How much is a single journey ticket to Central station? | 去中環站一張單程票幾多錢？ | scene logic | scene-logic: speaker just topped up her Octopus card (l5–l6) and then asks to buy a single-journey ticket | move before l5, or drop | — |
| T11 Q4 | Which word has /ɪ/? key exit (choices line / exit / ticket) | — | quiz / answer key | wrong key: "ticket" /ˈtɪkɪt/ also has /ɪ/ → two correct answers | choices: line / exit / train | — |

### R2 · Ordering ｜ 落單 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r2-l1 | What would you like to order from the menu, please? | 你想喺餐牌點咩？ | unnatural | naturalness: padded; servers say "Are you ready to order?" | Are you ready to order? | 可以落單未呀？ |
| r2-l2 | I'd like the chicken, please, and a small salad with it too. | 我要雞，再加一份小沙律。 | unnatural | naturalness: "with it too" redundant | I'd like the chicken and a small salad, please. | 我要個雞同一份細沙律，唔該。 |
| r2-l4 | Can I have some water, please, and no ice in the glass? | 可唔可以畀我杯水，唔該，唔好加冰。 | unnatural | naturalness: awkward split; gloss ends a question with 「。」 | Can I have a glass of water, no ice, please? | 唔該畀杯水我，走冰。 |
| r2-l5 | Anything else besides the water, or is that everything for you? | 除咗水之外仲要咩，定係就咁多？ | unnatural | naturalness: padded; "besides the water" ignores the food order | Anything else, or is that everything? | 仲要唔要其他嘢？定係就咁多？ |
| R2 Q2 | 客人講「Can I have some water, please, and no ice…」 key 推薦 | — | quiz / answer key | WRONG KEY: sentence asks for water; 推薦 (recommend) is not its meaning; none of 登機證/推薦/訂位 fits | choices: 要杯水，走冰 / 推薦 / 訂位 → key 要杯水，走冰 | — |
| R2 C1 | Can I have some water, please, when you have a free moment? | 可唔可以畀我⋯⋯？ | unnatural | naturalness | Can I have some water, please? | 唔該畀啲水我。 |

### J4 · Gold, silver, diamond, jade ｜ 金、銀、鑽石、玉 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j4-l1 | This gold is authentic, and the stamp is clear on the inside. | 呢件金係正貨，內圈個印好清楚。 | unnatural | naturalness: trade term is "hallmark" | This gold is genuine. You can see the hallmark inside. | 呢件係真金，入面有清楚嘅金印。 |
| J4 RP3 | Tom: I like this jade. → EXPECT "This setting is eighteen-karat gold." | — | scene logic | scene: non-sequitur reply about gold to a remark about jade | EXPECT: The colour is very even. | — |
| J4 Q3 | 客人講「The diamond is shinier than the jade.」 key 玉 | — | quiz / answer key | key: sentence is about the diamond; only one plausible noun offered | — | — |

### J5 · Sizing and try-on ｜ 尺寸同試戴 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j5-l3 | This size is a little tight. It pinches when you close your hand. | 呢個碼有啲緊。你握拳嗰陣會夾。 | scene logic | scene-logic: staff can't feel the pinch; the customer should say it | (Tom) This size is a little tight. It pinches when I close my hand. | 呢個碼有啲緊，握拳嗰陣會夾。 |
| j5-l7 | How does it feel? | 感覺點？ | scene logic | scene order: asked after the customer has already said how it feels twice | move to before l6 | — |
| J5 RP3 | Tom: It feels a little loose. → EXPECT "Look in the mirror." | — | scene logic | scene: reply ignores the problem | EXPECT: I can adjust it. | — |

### T3 · Hotel check-in ｜ 酒店入住 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t3-l1 | Do you have a reservation under a name I can find? | 你有冇訂房，我可以搵個名？ | unnatural | naturalness + broken gloss | Do you have a reservation? What name is it under? | 你有冇訂房？用咩名訂㗎？ |
| t3-m3 | Late checkout is fine. You can leave your bags by the elevator. | 遲退房冇問題。你可以將袋放喺升降機旁邊。 | scene logic | scene-logic: hotels store bags at the desk, not by the lift | Late checkout is fine. You can leave your bags at the front desk. | 遲退房冇問題，行李可以寄存喺前台。 |
| T3 Q3 | 客人講「Your room is a double and faces the harbor.」 key 雙床 | — | quiz / answer key | WRONG KEY: double = one double bed (雙人床); 雙床 = twin; contradicts U1 explain | key -> 雙人床 | — |
| T3 Q0/Q4 | listen "floor" / 邊個有 /l/ key floor | — | text ≠ what is tested/played | mismatch: "floor" never appears in the T3 dialogue | add "Your room is on the tenth floor." or change the lemma | — |
| T3 C3 | Here is your key card… | 呢張係你把⋯⋯。 | gloss | gloss: wrong classifier 把 for a card (張) | — | 呢張係你嘅⋯⋯。 |

### R3 · Allergies and special requests ｜ 過敏同特別要求 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r3-l7 | The sauce is spicy, and this dish is made without any peanuts. | 醬汁係辣嘅，呢碟冇花生。 | glued clauses | glued clauses with "and" | The sauce is a little spicy, but it has no peanuts. | 個醬有少少辣，不過冇花生。 |
| r3-l8 | Then I'll take the chicken, please. | 咁我要雞肉，唔該。 | scene logic | scene-logic: chicken was already ordered in l1 | Great. The chicken, then, with the sauce on the side. | 好，咁就要個雞，醬另上。 |
| R3 Q2 | 客人講「We'll check the ingredients…」 key 麩質 | — | quiz / answer key | WRONG KEY: sentence never mentions gluten; none of 辣/貝類/麩質 fits; speaker is staff | key -> 睇吓有咩材料 | — |
| R3 Q0 | listen shellfish | — | text ≠ what is tested/played | mismatch: "shellfish" not in the dialogue | — | — |
| R3 RP0–RP2 (audio r3-a1, r3-m1, r3-a2) | shown: "What would you like to order?" / "Does this dish contain peanuts?" / "The sauce is spicy." | — | text ≠ what is tested/played | roleplay partner text on screen is shorter than the audio it plays ("…, and do you have any food notes?" / "…, or is it made without them?" / "…, and it has a little heat in it.") | show the full audio sentence, or re-render audio to match | — |
| r3-a2 (audio line) | The sauce is spicy, and it has a little heat in it. | 個醬好辣，有少少熱。 | gloss | redundant ("spicy… a little heat"); gloss contradicts itself (好辣 vs 少少熱) | The sauce is a little spicy. | 個醬有少少辣。 |

### T4 · Taxi and asking the way ｜ 的士同問路 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t4-l1 | [Ray] The taxi is here. I can give the driver your address. | 的士到咗。我可以同司機講你個地址。 | scene logic | scene-logic: Ray is the doorman here but the driver in l3–l7 | split speakers (doorman / driver) | — |
| t4-l2 | Could you take me to the landmark opposite the hotel? | 可唔可以載我去酒店街角對面嗰個地標？ | scene logic | scene + gloss: a taxi to a place opposite the hotel; gloss adds 街角 | Could you take me to the Clock Tower, please? | 唔該去鐘樓。 |
| t4-l3 | The meter is on, and traffic is slow. | 咪錶開咗，交通好慢。 | glued clauses | glued unrelated clauses | The traffic is slow today. | 今日好塞車。 |
| t4-l4 | How long will this take if we go straight and turn left? | 如果直行再轉左，大概要幾耐？ | unnatural | naturalness: passengers don't specify a route when asking duration | Roughly how long will it take? | 大概要幾耐？ |
| t4-l8 | Thank you. I'll walk straight from this corner to the door. | 多謝。我會由呢個街角直行去門口。 | unnatural | naturalness | Thanks. I'll walk from here. | 多謝，我行過去得喇。 |
| T4 Q0 | 揀你聽到嘅字：租嚟嗰架車 (taxi) | — | gloss | gloss: 租嚟嗰架車 = rental car, not taxi | 的士 | — |
| T4 Q3 | 客人講「How long will this take…」 key 大概 | — | quiz / answer key | key: sentence doesn't contain "roughly" | — | — |

### R4 · During the meal ｜ 用餐期間 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r4-l1 | Are you enjoying the meal? I can bring a refill. | 你食得開唔開心？我可以幫你添一杯。 | gloss | gloss: 「食得開唔開心」 is not how a waiter asks in Cantonese | — | 食成點呀？要唔要幫你添杯水？ |
| r4-l2 | Could we get still water and one napkin for this fork? | 可唔可以嚟杯冇氣水，同埋一張餐巾畀呢支叉？ | unnatural | naturalness: "a napkin for this fork" is nonsense | Could we get some still water and another napkin, please? | 唔該畀杯冇氣水，同多張餐巾。 |
| r4-l6/r4-l8 | No dessert for me. Could we get the bill later? … Could I have a coffee later? | 我唔要甜品。可唔可以遲啲先要單？ | scene logic | scene-logic: asks for bill "later", then orders coffee "later" after "anything else before you head off" | r4-l6: No dessert for me, thanks. Could we have the bill, please? | 我唔要甜品喇，唔該。可以埋單未？ |
| R4 RP2 | keywords ['sparkling','enjoy'] for "The sparkling water is coming." | — | quiz / answer key | keyword bug: "enjoy" is not in the expected line, so learner can never hit 2/2 | keywords ['sparkling','coming'] | — |
| R4 C2 | Could we get one more clean napkin for this fork please? | 可唔可以多要一張乾淨⋯⋯畀呢支叉？ | punctuation / spelling | punctuation (comma before please) + nonsense "for this fork" | Could we get one more clean napkin, please? | — |

### D6 · At the pharmacy ｜ 藥房買藥 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d6-l2 | [Mei] What should I tell the pharmacist before we choose a box? | 揀盒之前，我應該話藥劑師知咩？ | scene logic | scene-logic: Mei asks what to tell the pharmacist, then acts as the pharmacist (l5, l7) | [Mei, pharmacist] Do you have any allergies? | 你有冇對咩藥敏感？ |
| d6-l3 | The only extra symptom is a drug allergy. | 另外就係藥物過敏。 | unnatural | naturalness/fact: an allergy is not a symptom; no drug named | I'm allergic to penicillin. | 我對盤尼西林敏感。 |
| d6-l6 | Can I take that tablet after meals if it's safer? | 如果安全啲，我可唔可以飯後食嗰粒藥片？ | unnatural | naturalness | Should I take it after meals? | 係咪飯後食？ |
| d6-l8 | I'll call this pharmacy if that cough comes back. | 如果咳嗽再返嚟，我會打畀呢間藥房。 | unnatural | naturalness | I'll come back if the cough doesn't get better. | 如果咳嗽冇好轉，我再嚟。 |
| D6 C1/C2 | pattern "one small tablet ___ a day for five days" vs example "one tablet twice a day" | 劑量係一日兩次。 | text ≠ what is tested/played | mismatch: the shown pattern and the revealed example are different sentences | make pattern = example | — |
| D6 RP1 | keywords ['allergy','cough'] for "The only extra symptom is a drug allergy." | — | quiz / answer key | keyword bug: "cough" not in expected line | — | — |

### R9 · Paying the bill ｜ 埋單同夾錢 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r9-l3 | Could we split the bill and get a separate receipt? | 可唔可以分開埋單，再要一張分開嘅收據？ | grammar | grammar: two people → "separate receipts" | Could we split the bill and get separate receipts? | 可唔可以分開俾，每人一張收據？ |
| r9-l4 | Yes, we can split it and show both amounts. | 可以分開，我會顯示兩個數。 | unnatural | naturalness | Sure. That's two hundred each. | 冇問題，每人兩百。 |
| r9-l5 | I'll pay my separate amount with an Octopus card. | 我用八達通畀我自己嗰份。 | unnatural | naturalness: "my share" | I'll pay my share with Octopus. | 我用八達通俾我嗰份。 |
| r9-l7 | There's a mistake on the bill. We didn't order the soup. | 張單有個錯。我哋冇叫嗰碗湯。 | scene logic | scene order: mistake raised after paying and printing the receipt (l5–l6) | move before l3 | — |

### R13 · Changing a café order ｜ 咖啡店改要求 (A2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r13-l5 | Can I get this to go? | 可唔可以拎走？ | unnatural | naturalness: reply to "For here or to go?" is "To go, please." | To go, please. | 拎走，唔該。 |
| r13-l7 | It's Cleo. Sorry, I think this has regular milk, not oat milk. | Cleo。唔好意思，我覺得呢杯係普通奶，唔係燕麥奶。 | scene logic | scene-logic/glued: complains about the finished drink in the same breath as giving the name, before the drink is made | split: "It's Cleo." / (later) "Sorry, I think this has regular milk, not oat milk." | — |
| R13 U1 | For here or to go? key 講緊燕麥奶 | — | quiz / answer key | WRONG KEY: the question is about takeaway; explain says 燕麥奶 | key -> 問堂食定拎走 | — |
| R13 U2 | I'll make you a new one with oat milk right away. key 講緊少糖 | — | quiz / answer key | WRONG KEY: line is about remaking with oat milk | key -> 即刻用燕麥奶整過 | — |
| R13 B1 | ORDER tokens sure / what | — | grammar | ungrammatical, meaningless target "sure what" | tokens: For / here / or / to / go | — |
| R13 B0 / Q4 | 你想用呢課嘅講法 / explain 「拿鐵。」 | — | quiz / answer key | key: no situation, all choices valid; explain unrelated to answer "less sugar" | — | — |

### J6 · Prices and discounts ｜ 價錢同折扣 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j6-l1 / J6 + J7 tax | How much does this piece cost, and is the tax already in that price? / This purchase is tax-free… claim the tax / tax-free form / refund form | — | scene logic | scene-fact: Hong Kong and Macau have no sales tax/VAT and no tourist tax-refund forms; a HK/Macau counter would never say this | replace with: "Is that the final price?" / "We can give you a receipt and a certificate." | 呢個係咪實價？ |
| j6-l2 | This piece is on sale today. | 呢件今日減價。 | scene logic | scene-logic: does not answer "How much does this cost?" | It's three thousand dollars. It's on sale today. | 三千蚊，今日減緊價。 |
| j6-l6 | This piece is more expensive because the center stone is larger. | 呢件貴啲，因為中間粒石大啲。 | scene logic | scene order: comes after the customer has already said "I'll take it" | move before l5 | — |
| j6-m1 | The total is a good deal, so many guests take both. | 總數好抵，所以好多客人兩件一齊要。 | unnatural | naturalness: retail says "customers", not "guests" | It's a good deal, so a lot of customers take both. | 幾抵，所以好多客都兩件一齊買。 |

### J7 · Payment and tax-free ｜ 付款同退稅 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j7-l6 | Could I pay with notes if the till machine is busy now? | 收銀機而家忙嘅話，我可唔可以用紙幣畀錢？ | scene logic | scene + natural: customer already chose card (l2); "till machine is busy" isn't said | drop | — |
| J7 lesson | l2 card → l6 notes → m1 phone/coins → l9 phone | — | scene logic | scene-logic: payment method is renegotiated four times in one transaction | keep one payment exchange | — |
| j7-m1 | Would you like to settle by phone, or would coins be easier today? | 你想用電話結數，定係硬幣方便啲？ | unnatural | naturalness | Would you like to pay by card or by phone? | 你想用卡定手機付款？ |
| j7-m2 | Here is your receipt, which you should keep with the slip. | 呢張收據你要留低，同一張單。 | gloss | gloss broken (「同一張單」); English stilted | Here's your receipt. Please keep it with the certificate. | 呢張係收據，記得同證書一齊收好。 |
| J7 RP1 / B0 | Tom: Could I pay with cash? → EXPECT "Would you like to pay by card?" | — | scene logic | scene: staff ignores the customer's stated wish | EXPECT: Of course. Cash is fine. | — |

### J15 · Resize a ring and collect it ｜ 改戒指尺寸同維修 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j15-l5 | How long does the warranty work take, and may I collect it on Saturday? | 保養工作要幾耐，星期六可唔可以取？ | scene logic | scene + fact: Saturday pickup was already confirmed in l4; a resize is not "warranty work" | Is the resizing covered by the warranty? | 改碼包唔包喺保養入面？ |
| j15-l6 | The warranty work is ready on Saturday, and the charge is nothing at all. | 保養工作星期六做好，完全唔使錢。 | unnatural | naturalness | Yes, it's covered, so there's no charge. | 包嘅，所以唔使錢。 |
| j15-l7 | I will bring the receipt on Saturday and pay nothing for this warranty work. | 我星期六會帶收據，呢次保養工作唔使畀錢。 | unnatural | naturalness | Great. I'll bring the receipt on Saturday. | 好，我星期六帶收據嚟。 |
| J15 C1 | pattern "Yes we can make the ring half a size larger under the full ___." vs a different example | 保養可以改大半碼。 | text ≠ what is tested/played | mismatch + punctuation (no comma after "Yes") | make pattern = example | — |

### J18 · Watch battery and strap ｜ 換錶電同錶帶 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| J18 U1/U2 | U1 "Yes, we reseal it… metal band?" key 講緊電池; U2 "…one-year warranty." key 講緊防水 | — | quiz / answer key | WRONG KEYS: U2 is about pickup time and battery warranty, not water resistance; U1 is about resealing and the band | — | — |
| J18 / T15 / R13 B1 | ORDER "sure takes" / "sure late" / "sure what" | — | grammar | ungrammatical two-token targets (generator bug) | use a real lesson chunk | — |

### J20 · Selling gold by weight ｜ 金價按重量計 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j20-l3 | The clasp is broken. How much is the labour charge? | 個扣壞咗。手工費係幾多？ | scene logic | scene-logic: customer is buying a new 999 bangle; a broken clasp (repair) is unrelated, and 999 bangles usually have no clasp | How much is the labour charge on this bangle? | 呢隻手鐲手工費幾多？ |
| j20-l5 | Can I trade in this old chain against the new bangle? | 可唔可以用呢條舊鏈換購新手鐲？ | grammar | grammar: "trade in … towards", not "against" | Can I trade in this old chain towards the new bangle? | 可唔可以用呢條舊鏈抵新手鐲嘅錢？ |
| J20 Q2 | The labour charge is forty dollars on top of the gold. key 金價 | — | quiz / answer key | WRONG KEY: the meaning is the labour charge (手工費), which isn't offered | choices 手工費 / 手鐲 / 純度 → key 手工費 | — |

### T5 · Lost and emergencies ｜ 行失咗點求人 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t5-l5 | The embassy number is on this card, and I will help you file the report. | 大使館電話喺呢張卡上面，我會幫你報失。 | glued clauses | glued clauses with "and" | Here's the consulate's number. I'll help you file the report. | 呢個係領事館電話。我幫你報案。 |
| t5-l7 | I feel faint after the shock. Is this an emergency? | 我受驚之後覺得暈。呢個係咪緊急？ | unnatural | naturalness: patients don't ask if they are an emergency | I feel faint. I think I need a doctor. | 我覺得好暈，可能要睇醫生。 |
| t5-l8 | If you feel faint, I can call an ambulance while we file the report. | 如果你覺得暈，我可以叫救護車，同時我哋報失。 | scene logic | scene-logic: filing a police report while waiting for an ambulance | Sit down. I'll call an ambulance now. | 你坐低先，我即刻叫救護車。 |
| T5 titleYue | Lost and emergencies | 行失咗點求人 | gloss | 「行失咗」 is not idiomatic Cantonese (it reads as "walked-lost") | — | 唔見咗嘢點求助 |

### T12 · A hotel check-in problem ｜ 酒店入住出問題 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t12-l3 | Could we please have a non-smoking room, and may the luggage stay here? | 可唔可以要非吸煙房，行李留喺度得唔得？ | scene logic | scene + natural: staff just said luggage can stay; "may the luggage stay" is stilted | Could we have a non-smoking room, please? | 可唔可以要間非吸煙房？ |
| t12-l4 | It's free of charge, and the room is ready after four. | 非吸煙房唔使加錢，四點之後房間就準備好。 | glued clauses | glued with "and" | Sure, no extra charge. The room will be ready after four. | 冇問題，唔使加錢。房四點之後就得。 |
| t12-l5 | What wifi password can I use while I wait for the room? | 我入到房間可以用嘅無線網絡密碼係咩？ | gloss | gloss mismatch: EN "while I wait" vs gloss 「入到房間」 | What's the Wi-Fi password while I wait? | 等緊間房嗰陣，wifi 密碼係咩？ |
| t12-l8 | Please come back after four, and the desk will call your name. | 請四點之後返嚟取房間，櫃檯會叫你個名。 | unnatural | naturalness/scene | See you after four. | 四點之後見。 |
| T12 Q0 | listen "early check in" | — | text ≠ what is tested/played | mismatch: phrase never in dialogue | — | — |

### T15 · Hotel check-out and luggage storage ｜ 退房同寄存行李 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t15-l1 | Hi, I'm checking out of room twelve-oh-eight. Could I get a late checkout? | 你好，我要退十二零八房。可唔可以延遲退房？ | scene logic | scene-logic: "I'm checking out" now + asks for late checkout | Hi, I'm in room twelve-oh-eight. Could I get a late checkout? | 你好，我係 1208 房。可唔可以延遲退房？ |
| T15 U2 | Sure, it's on its way. Have a safe flight! key 講緊的士 | — | quiz / answer key | WRONG KEY: "it's on its way" is the emailed receipt | key -> 講緊收據 | — |
| T15 RP2/RP3 | keywords ['thanks','book'] / ['great','email'] | — | quiz / answer key | keyword bug: "thanks"/"great" absent from expected lines | — | — |

### T13 · At the pharmacy abroad ｜ 外地藥房買藥 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t13-l4 | Three times a day, after meals. Don't take more than six tablets each single day. | 一日三次，食完飯先食。一日唔好多過六粒。 | unnatural | naturalness: "each single day" | … Don't take more than six tablets a day. | 一日唔好食多過六粒。 |
| t13-l7 | Do I need a prescription before I take this tablet? | 食呢種之前使唔使醫生處方？ | unnatural | naturalness | Do I need a prescription for this? | 呢隻使唔使醫生紙？ |
| t13-l1 | I have a bad headache and a high fever. What can I take? | 我頭痛得好緊，仲有高燒。我可以食咩？ | gloss | gloss: 「頭痛得好緊」 is unidiomatic | — | 我頭好痛，仲發高燒。可以食咩藥？ |
| T13 B0 | key "Hi. I have bad headache and high fever. What medicine can I take?" | — | grammar | grammar: KEYED answer drops articles ("a bad headache", "a high fever"); distractor "times day" | Hi. I have a bad headache and a high fever. What can I take? | — |

### R12 · Booking a table for a group ｜ 訂枱請客 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r12-l4 | Yes, I'll put a high chair at the table for you. Do you need a deposit receipt? | 有，我會擺張兒童椅喺你張枱。你需唔需要訂金收據？ | scene logic | scene order: deposit receipt offered before any deposit is mentioned (l5–l6) | Yes, I'll put a high chair at your table. There's a deposit for the private room. | 有，我會擺張兒童椅。包房要俾訂金。 |
| R12 Q0 | listen "party of" | — | text ≠ what is tested/played | mismatch: phrase not in dialogue | — | — |

### R14 · Ordering a birthday cake ｜ 訂生日蛋糕 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r14-l1 | Hi. I'd like a cake in a size for ten people, please. | 你好。我想要一個夠十個人食嘅蛋糕。 | unnatural | naturalness | Hi. I'd like to order a cake for ten people, please. | 你好，我想訂個夠十個人食嘅蛋糕。 |
| r14-l3 | Mango, please. Can you write Happy birthday Mei on it? | 芒果，唔該。上面可唔可以寫 Happy birthday Mei？ | punctuation / spelling | punctuation: written message needs quotes/capitals/comma | Can you write "Happy Birthday, Mei" on it? | — |

### R15 · Buffet and dietary limits ｜ 自助餐同戒口 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r15-l1/r15-l2 | Is this buffet all you can eat? Can I take food away? → Yes. This buffet is for here only. | 係。呢個自助餐只可以堂食。 | scene logic | scene-logic: "Yes" answers the take-away question it then contradicts | Yes, it's all you can eat. But no takeaway. It's for here only. | 係任食，不過唔可以拎走，只可以堂食。 |
| r15-l4 | Yes. Those soft drinks are included for every adult at the table. | 係。每位成人喺檯上都包汽水。 | grammar | grammar: "Yes" to an either/or question | They're included for every adult. | 每位大人都包汽水。 |
| r15-l6 | The prawn soup has shellfish. Here's a clean plate. | 蝦湯有貝殼類。呢個係乾淨碟。 | gloss | gloss: prawn is 甲殼類/海鮮, not 貝殼類 (clams) | — | 蝦湯有海鮮（甲殼類）。呢隻係乾淨碟。 |
| R15 B1 | ORDER "The prawn soup has shellfish, so here is a clean plate." | — | glued clauses | glued false "so" (clean plate is not caused by the soup) | The prawn soup has shellfish. | — |

### R16 · Asking for a chef's recommendation ｜ 問廚師推介 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r16-l6 | Yes. The kitchen will skip peanuts on both of those two plates. | 可以。廚房兩碟都唔會落花生。 | unnatural | naturalness: "both of those two" | Yes. The kitchen will leave peanuts out of both. | 可以，兩碟都唔落花生。 |
| R16 Q2/Q4 | distractors 讀（而家／習慣）/ 讀過（過去） / read / live | — | quiz / answer key | distractors copied from an unrelated grammar lesson | use food words | — |

### R5 · Bill and tip ｜ 埋單同貼士 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r5-l4 | The card machine is here, and the receipt includes the service charge. | 卡機喺度，收據會包括服務費。 | glued clauses | glued with "and" | Here's the card machine. The bill already includes a service charge. | 卡機喺度。張單已經包咗服務費。 |
| r5-l5 | The service was kind, so I will add a tip and you can keep the change. | 服務真係好好，我會加貼士，零錢留低當貼士。 | scene logic | scene + natural: paying by card, so there is no change; "service was kind" | The service was great. I'll add a small tip. | 服務好好，我加少少貼士。 |
| r5-l6 | Thank you. The service charge comes before that extra tip. | 多謝。服務費計喺額外貼士之前。 | unnatural | meaning unclear; not a thing a server says | Thank you very much. | 多謝晒。 |
| r5-l7 | Could we get the cake as a takeaway before we leave? | 走之前可唔可以將蛋糕打包外賣？ | scene logic | scene-logic: a cake never mentioned before; asked after paying | Could we take the rest of the cake home? | 剩低啲蛋糕可唔可以打包？ |
| R5 RP3 | keywords ['include','tip'] | — | quiz / answer key | keyword bug: "include" absent from expected line | — | — |

### R11 · Allergies and dietary needs ｜ 食物敏感同戒口 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| R11 / R12 B1 | ORDER "okay egg" / "sure like" | — | grammar | ungrammatical two-token targets | — | — |

### W1 · Phone calls ｜ 職場電話 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w1-l1 | Good morning. This is Nia calling from the harbor office. How may I help? | 早晨。我係海港辦事處嘅 Nia 打嚟。有咩可以幫你？ | scene logic | scene-logic: Nia is receiving the call (Tom: "I'm calling about…"), not calling | Good morning, Harbour Office. Nia speaking. How may I help? | 早晨，海港辦事處，我係 Nia。有咩可以幫到你？ |
| w1-l6 | Could you say the spelling slowly, and read the extension back? | 可唔可以慢慢講個串法，再將內線讀返畀我？ | scene logic | scene-logic: roles reversed; the receptionist takes the message and checks spellings | (Nia) Could you spell your name slowly, please? | 可唔可以慢慢串一次你個名？ |
| w1-l8 | Thank you for the message. This afternoon is a good time to call back. | 多謝你幫我留言。下晝覆電話就得。 | unnatural | naturalness: caller thanks for "the message" | Thanks for your help. She can call me back this afternoon. | 多謝你。佢今日下晝覆我就得。 |
| W1 RP1 | I speak to Mei regarding appointment, and may I ask if she is available? | — | grammar | grammar: partner line is ungrammatical (missing "I'd like to", "an") | I'd like to speak to Mei about an appointment. Is she available? | — |
| W1 B1 | ORDER "Please hold the other line" | — | grammar | ungrammatical/meaningless target | Please hold the line | — |
| W1 / D1 RP | keywords ['spelling','extension'], ['headache','allergy'], ['pharmacy','follow-up'] | — | quiz / answer key | keyword bug: second keyword absent from each expected line | — | — |

### D1 · At the doctor ｜ 睇醫生 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d1-l3/d1-l4 | Do you have a headache too? Are you allergic to any medicine we use? → I have had a headache since Monday. | — | scene logic | scene: allergy question never answered; "any medicine we use" is odd | Yes, since Monday. And I'm not allergic to anything. | 有，由星期一開始。我冇藥物敏感。 |
| d1-l5 | I have had a cough since Monday. I need to rest. | 我由星期一起咳。我需要休息。 | scene logic | scene: repeats the cough already reported in l2 | I feel very tired. Can I get a sick note? | 我好攰。可唔可以開張病假紙？ |
| d1-l2 | I have had a fever and cough since Monday. | 我由星期一起發燒同咳嗽。 | grammar | grammar: "a fever and a cough" | I've had a fever and a cough since Monday. | — |
| D1 Q1/Q2 | 「喉嚨嗰陣咳」; 「…，symptom 係咩意思？」 | — | quiz / answer key | gloss broken; quiz asks about "symptom", which is not in the quoted sentence | — | 喉嚨痕想咳 |

### D12 · Booking a clinic appointment by phone ｜ 打電話約睇醫生 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| D12 U2 / Q4 | Great. Nine thirty tomorrow with Dr Lam. key 講緊診金; Q4 explain 預約 for key consultation fee | — | quiz / answer key | WRONG KEY: the line confirms the appointment, not the fee | key -> 講緊預約 | — |

### D2 · At the bank ｜ 銀行 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d2-l4 | Could you help me block this card, and tell me the balance? | 可唔可以幫我凍結呢張卡，再話我知結餘？ | scene logic | scene-logic: the card is lost, so "this card" is impossible | Could you block my lost card and tell me my balance? | 可唔可以幫我凍結張唔見咗嘅卡，再話我知結餘？ |
| d2-l5 | The balance is very low. Here is the full replacement fee. | 結餘好低。全數補卡費喺度。 | unnatural | naturalness: staff can't hand over a fee | Your balance is low. A new card costs fifty dollars. | 你戶口結餘好少。補卡要五十蚊。 |
| d2-l7 | Please sign this form at the branch. | 請喺分行簽呢張表格。 | scene logic | scene-logic: they are already at the branch | Please sign this form here. | 唔該喺度簽呢張表。 |
| D2 lesson | canDo "open an account" — account opening is mentioned twice but never done | — | scene logic | scene: lesson goal not met in dialogue | — | — |

### D14 · Collecting a parcel at the post office ｜ 郵局攞包裹 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d14-l6 | Yes. I will note that damage because the box is split. | 可以。因為個箱裂開咗，我會記低損壞。 | glued clauses | naturalness: false "because" | Sure. I'll note that the box is damaged. | 好，我記低個箱爛咗。 |
| d14-l7 | Where do I sign my name for the box before I leave? | 我走之前喺邊度簽名收呢個箱？ | unnatural | naturalness | Where do I sign? | 喺邊度簽名？ |

### T7 · Shopping while travelling ｜ 旅行購物 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t7-l4 | This shirt size is too big. | 呢件衫碼太大。 | scene logic | scene order + natural: said after already asking for a smaller size | (move before l2) This one is too big. | 呢件太大。 |
| t7-l5 | The fit works. Can I get a tax refund form? | 呢個版好啱。可唔可以畀我退稅表？ | unnatural | naturalness: "The fit works" | This one fits. Can I get a tax refund form? | 呢件啱身。可唔可以畀張退稅表我？ |
| t7-l8 | Thank you. The souvenir shop can stamp this tax refund form before you leave town. | 多謝。紀念品店可以喺你離鎮之前蓋呢張退稅表。 | scene logic | fact/scene: refund forms are stamped by customs at departure, not by a souvenir shop | Show this form at customs at the airport before you fly. | 離境前喺機場海關出示呢張表。 |
| T7 U2 / B0 | Can I get a tax refund form for this shirt. / The reduced fit works well, so can I get a tax refund form for this shirt. | — | punctuation / spelling | punctuation: questions end with "."; B0 key is ungrammatical ("so can I …") | This one fits. Can I get a tax refund form? | — |
| T7 RP2 | May: we have a smaller size → EXPECT "This shirt size is too big." | — | scene logic | scene: non-sequitur; keyword 'color' absent | — | — |

### W4 · Small talk at work ｜ 職場閒聊 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w4-l2 | Not bad. The weekend was busy with my sister. | 幾好。個週末同家姐好忙。 | unnatural | naturalness; U1 key adds 「同家姐去咖啡店」 not in the English | Not bad. I spent the weekend with my sister. | 幾好，週末同家姐一齊。 |
| w4-l5 | I am ready. Shall we go into the room before the team sits? | 我準備好。我哋入房等團隊坐低？ | unnatural | naturalness | I'm ready. Shall we go in before everyone arrives? | 準備好喇。不如趁其他人未到先入去？ |
| w4-l7 | Then the team can start once everyone has a seat by the window. | 人人坐低近窗，團隊就可以開始。 | unnatural | naturalness/scene: "a seat by the window" is random | We can start once everyone is here. | 大家到齊就開始。 |
| w4-l4 | … are you ready for the 10 o'clock meeting with the sales team? | 十點同團隊嗰個會你準備好未？ | gloss | gloss drops "sales" (團隊 vs 銷售團隊) | — | 順便問吓，十點同銷售團隊開會你準備好未？ |

### R8 · Takeaway by phone ｜ 電話叫外賣 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r8-l1 | I would like to order one hot chicken takeaway for delivery to my office, please. | 我想叫一份熱雞外賣，送到我公司。 | unnatural | naturalness | I'd like to order the roast chicken for delivery to my office, please. | 我想叫個燒雞外賣，送去我公司，唔該。 |
| r8-l3 | It's eighteen Harbour Street. I spell Harbour H A R B O U R. | 地址係十八號 Harbour Street。… | unnatural | naturalness: "I spell Harbour…" | It's 18 Harbour Street. That's H-A-R-B-O-U-R. | 十八號 Harbour Street，串法係 H-A-R-B-O-U-R。 |
| r8-l4 | How long will the rider take to bring this hot delivery to my office? | 騎手要幾耐先將呢份熱外賣送到我公司？ | unnatural | naturalness | How long will it take? | 要幾耐先送到？ |
| R8 U1 | It's eighteen Harbour Street… key 請講街道地址，再串街名 | — | quiz / answer key | key: the sentence gives the address; the keyed answer is an instruction to give one | key -> 講地址同串街名 | — |

### W7 · Calling in sick ｜ 打電話請病假 (A2/B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w7-l6 | Will you be back on Monday, or stay home a bit longer? | 你星期一返，定係醫生要你喺屋企多留幾日？ | gloss | gloss adds 「醫生要你」 (not in English); EN missing "will you" in 2nd clause | Will you be back on Monday, or do you need a few more days? | 你星期一返唔返到？定係要多休息幾日？ |
| w7-l2 | I'm sorry. Could you bring a doctor's note when you come back? | 聽到你咁真係唔好意思。… | gloss | gloss: sympathy "I'm sorry" rendered as an apology 唔好意思 | — | 咁辛苦你喇。返嚟嗰陣可唔可以帶醫生紙？ |

### J8 · After-sales and warranty ｜ 售後同保養 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j8-l1 | Have you kept the receipt? Should I explain the warranty before you go? | 你有冇帶住張收據？走之前我可唔可以講下保養？ | gloss | gloss mismatch (kept ≠ 帶住) + scene: customer is back with a defect, not leaving after a sale | Do you have the receipt? Let me check the warranty for you. | 你有冇留住張收據？我幫你睇吓保養。 |
| j8-l3 | Please polish this bracelet with a soft cloth, and avoid harsh chemicals. | 請用軟布擦亮呢條手鏈，避開刺激化學劑。 | scene logic | scene-logic: answers a scratch complaint with care tips | (after the claim is accepted) To keep it shiny, use a soft cloth and avoid harsh chemicals. | 之後記得用軟布抹，唔好掂刺激嘅化學品。 |
| j8-l4 | Does the guarantee cover this scratch, or should I file a claim within the week? | 保用包唔包呢道刮痕，定係我應該呢個禮拜內申請？ | unnatural | naturalness: confusing either/or | Does the warranty cover this scratch? | 保養包唔包呢條花？ |
| j8-l8 | Thanks. I understand the policy, the guarantee, and the return window. | 多謝。我明白政策、保用同退換期。 | unnatural | naturalness: textbook recap no customer says | Thanks. That's clear. | 多謝，我明白喇。 |

### D9 · The machine kept my card ｜ 銀行：櫃員機食咗張卡 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d9-l5/d9-l6 | What ID do I need…, and when does the new card arrive? / … The new card arrives on Friday. | — | scene logic | scene: Friday was already stated in l4; repeated twice | d9-l5: What ID do I need? | 要帶咩身份證明？ |
| d9-l7 | Can I draw cash at this counter on the temporary limit while I wait? | 我等緊嘅時候，可唔可以用臨時限額喺櫃檯拎現金？ | unnatural | naturalness | Can I take out some cash here while I wait for the new card? | 等新卡期間，我可唔可以喺櫃檯攞現金？ |

### D11 · Opening a bank account ｜ 銀行開戶 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| D11 U0–U2 | U1 "For your salary, a savings account is best…" key 講緊地址; U2 "It'll arrive by post…" key 講緊戶口 | — | quiz / answer key | WRONG KEYS: rotated topic labels that don't match the sentence | — | — |

### D13 · At the dentist ｜ 睇牙醫 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| D13 Q0/Q1 | both listen items use lemma filling-noun | — | quiz / answer key | duplicate item; second should test another word | — | — |

### J9 · Handling complaints ｜ 投訴同退換 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j9-l1 | I'm sorry that there's a problem. Tell me what happened so I can help. | …話我知發生咩事，所以我可以幫手。 | gloss | gloss: 「所以我可以幫手」 calques "so" | — | 話我知發生咩事，等我幫你。 |
| j9-l4 | Could you replace the piece now, and tell me what you can do about it? | 而家可唔可以換過呢件，同我講你做到啲咩？ | unnatural | naturalness: redundant | Can you replace it, or what can you do? | 可唔可以換過件？定係你哋可以點處理？ |
| j9-l8 | I'll write up the complaint because the repair failed. | 我會寫低個投訴，因為修理失敗。 | scene logic | scene-logic: no repair has been attempted yet | I'll write up your complaint now. | 我而家幫你寫低個投訴。 |
| J9 Q3 | 客人講「The manager can review the receipt, and we will repair it if the policy allows.」 key 即刻 | — | quiz / answer key | WRONG KEY: sentence has no "immediately"; correct meaning (經理睇收據／照政策修理) not offered | — | — |
| J9 RP | keywords ['apologize','understand'], ['manager','immediately'] | — | quiz / answer key | keyword bug: neither "apologize" nor "understand" appears in the expected line | — | — |

### J10 · Upselling and add-ons ｜ 加購同禮盒 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j10-l4 | I like the pair, but I do not need the engraving if the price rises. | 我鍾意呢對，但如果價錢升，我就唔使刻字。 | scene logic | scene-logic: engraving was never offered | (Mei first) We can also engrave a name. It's optional. | 我哋都可以刻名，唔要都得。 |
| j10-l6 | Please recommend your most popular option. | 請推薦你哋最多人揀嘅選擇。 | unnatural | naturalness | What's the most popular set? | 邊套最多人買？ |
| j10-l7 | If you prefer this necklace, the chain matches. The box is ready. | 如果你鍾意呢條頸鏈，條鏈都襯。禮盒準備好。 | unnatural | meaning unclear / non-sequitur | This set is the most popular. I can put it in a gift box. | 呢套最多人買，我可以幫你放禮盒。 |
| J10 C1 | This popular set is optional, and the engraving spells the name Mei on the box. | 呢個多人揀嘅⋯⋯可以唔要。 | unnatural | nonsense sentence | The engraving is optional. | — |

### J19 · Explaining a diamond certificate ｜ 解釋鑽石證書 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j19-l7 | So the price is higher because the cut is cleaner? | 所以價錢高啲，係因為切工乾淨啲？ | scene logic | fact: "cleaner" describes clarity, not cut | So it costs more because the cut is better? | 即係切工好啲，所以貴啲？ |
| j19-l8 | Yes. The report is from a lab. It is not a brand name. | 係。報告嚟自一間實驗室。佢唔係品牌名。 | unnatural | naturalness/meaning unclear | Yes. And the report comes from an independent lab. | 係，份報告係獨立化驗所發嘅。 |
| J19 spelling | dialogue "colour" vs quiz/chunk choices "color" | — | punctuation / spelling | spelling inconsistent inside one lesson | — | — |

### J16 · Engraving a gift ｜ 首飾刻字 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| J16 U1/U2 | …fourteen characters, so it's two over the limit. key 講緊首字母; "…ready in three days." key 講緊日期 | — | quiz / answer key | WRONG KEYS: rotated topic labels | U1 -> 超咗字數上限; U2 -> 簽表，三日後取 | — |

### J22 · Custom engraving rush ｜ 趕急刻字 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j22-l3 | Will plain lettering finish in time if the wedding stays on Saturday? | 如果婚禮係星期六，普通刻字趕唔趕得切？ | unnatural | naturalness: "if the wedding stays on Saturday" | Will plain lettering be ready before the wedding on Saturday? | 普通刻字趕唔趕得切星期六婚禮？ |
| j22-l7 | What's the rush fee if that proof needs one small change? | 如果校對稿要改一次，急單收費幾多？ | scene logic | logic: conflates the rush fee with a change fee | What's the rush fee? And what if I need one small change? | 急單幾錢？如果要改少少又點？ |

### J21 · Insurance appraisal after damage ｜ 首飾損壞估價同保險 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j21-l5/j21-l6 | What excess does my insurance policy charge…? / The excess on that policy is two hundred dollars… | — | scene logic | scene-fact: a jeweller cannot know the customer's insurance excess | j21-l5: Can you write the repair cost on the appraisal for my insurer? | 可唔可以喺估價單寫埋維修費，等我交畀保險公司？ |

### J17 · Pearl care and pricing ｜ 珍珠保養同價錢 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| J17 canDo + C2 | canDo: "wipe the pearl and then put perfume on"; C2 "Wipe the pearl, then put ___ on." gloss 先抹乾珍珠，再搽香水 | — | scene logic | FACT ERROR + contradiction: correct care (and j17-l6) is perfume first, pearls last, wipe after wearing | Put perfume on first, then the pearls. Wipe them after wearing. | 先搽香水，再戴珍珠；戴完用布抹乾淨。 |

### T6 · Hotel problem ｜ 酒店問題 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t6-l1 | Good evening, this is Kim at the front desk. How may I help tonight? | 晚安，我係前台 Kim。… | gloss | gloss: 晚安 = good night (farewell); "Good evening" greeting is 你好／晚上好 | — | 你好，我係前台 Kim。今晚有咩可以幫到你？ |
| t6-l2 | The air conditioning is very noisy, and I barely slept in this room. | 部冷氣好嘈，我喺呢間房幾乎瞓唔到。 | scene logic | scene: evening call ("Good evening… tonight") but guest says he barely slept | The air conditioning is very noisy. I can't sleep. | 部冷氣好嘈，我瞓唔著。 |
| t6-l6 | The air conditioning is still weak, so please ask the engineer to check. | 部冷氣仍然好弱，唔該叫工程師檢查。 | scene logic | scene: problem was noise, not weakness; guest has already moved rooms | The new room is fine. Thanks. | 新房冇問題，多謝。 |
| t6-l8 | Thank you for the engineer, the towels, and the warm blanket. | 多謝你派工程師嚟、仲有毛巾同暖被。 | unnatural | naturalness: list-recap thanks | Thanks for your help. | 多謝你幫忙。 |
| T6 U0–U2, C0–C2, Q3 | There seems to be… / Would it be possible… / sorry for the inconvenience | — | text ≠ what is tested/played | mismatch: the taught phrases never occur in the dialogue | add them to the dialogue | — |

### T19 · Hotel complaint follow-up ｜ 酒店投訴跟進 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t19-l7 | What time will maintenance finish if I keep this suite? | 如果我留呢間套房，維修幾點做完？ | scene logic | scene-logic: why ask if he's moving away from the noise | What time will the work in the hallway finish? | 走廊啲工程幾點做完？ |
| T19 B1 | Maintenance will finish at noon, and the harbor room stays held. | — | unnatural | naturalness: "stays held" | Maintenance will finish at noon. | — |

### R6 · A reservation by phone ｜ 電話訂位 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r6-l1 | Good evening. A table for Mei, please. Is a window seat free tonight? | 晚安。訂 Mei 個名，唔該。今晚仲有冇靠窗位？ | unnatural | naturalness (phone booking needs time/party size) + gloss 晚安 | Good evening. I'd like to book a table for four tonight, under Mei. | 你好，我想訂今晚四位，用 Mei 個名。 |
| r6-l3 | Could we change the time and keep the reservation if we arrive later? | 可唔可以改時間，如果我哋遲啲到，訂位仲留住？ | scene logic | scene: no time has been set yet | Could we make it eight o'clock instead? | 可唔可以改做八點？ |
| r6-l5/r6-l6 | If it rains, please cancel the outdoor seat and keep us indoors. / Those patio seats are booked, but I can add you to the waitlist. | — | scene logic | scene-logic: party booked an indoor window seat; outdoor seat & waitlist come from nowhere | drop or rewrite as one indoor/outdoor choice | — |
| r6-l7 | Please confirm the booking. What time should we come? | 請確認訂位。我哋應該幾點嚟？ | scene logic | scene: time already fixed at eight | Great. Could you confirm that by text? | 好，可唔可以發短訊確認？ |

### J12 · A jewellery phone enquiry ｜ 電話查詢 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j12-l2/l3 | Do you still have a similar gold bracelet…? / I'll describe the similar gold bracelet we have. | — | scene logic | scene: "similar" has no referent; promised description never comes | Do you have this gold bracelet in stock? I saw it online. | 你哋仲有冇呢款金手鏈？我喺網上見到。 |
| j12-l4/l5 | Text me when it's ready… / I'm calling to ask about stock… | — | scene logic | scene order: the call's opening purpose comes 5th, after "text me when it's ready" | move l5 to the top | — |
| j12-l8 | I'll leave a short message, and you can collect the piece this Friday. | 我會留低短訊，你星期五可以嚟攞嗰件。 | scene logic | scene: contradicts "collect tomorrow" (l5, canDo) | I'll text you. You can collect it tomorrow. | 我會發短訊畀你，你聽日可以嚟攞。 |
| J12 U0 / Q2 | Have you kept a similar gold bracelet in stock? / stock 係咩意思 (sentence has no "stock") | — | grammar | grammar ("Do you have … in stock?") + quiz asks about a word not in the quote | — | — |

### R7 · A problem at the table ｜ 餐檯投訴 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r7-l5/r7-l6 | Could you bring a dessert for us after you fix that plate? / I'll send that dessert right away… | — | scene logic | scene-logic: dessert is sent "right away" though asked for "after"; customer demanding dessert mid-complaint is odd | (Suki) I'm so sorry. Dessert is on us tonight. | 真係唔好意思，今晚甜品我哋請。 |
| r7-l7 | Please don't serve the soup cold again when we come back. | 我哋下次返嚟，唔好再出凍湯。 | unnatural | naturalness/register: rude, not a model line | Thanks for sorting it out. | 多謝你哋幫手處理。 |
| R7 C0 | pattern "Excuse me please, Ana. I ___ the soup…" vs example "Excuse me, Suki…" | — | text ≠ what is tested/played | mismatch: different names in pattern and example | — | — |

### T8 · At immigration ｜ 入境對話 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t8-l4 | I'm not here on holiday. | 我唔係嚟度假。 | scene logic | CONTRADICTION: speaker just said "I'm here for tourism" (l2); question was about business | No, I'm not here on business. Yes, I have a return ticket. | 唔係，我唔係嚟公幹。我有回程機票。 |
| t8-l5 | I declare these goods at the desk. | 我喺櫃檯申報呢啲貨物。 | scene logic | naturalness + scene: immigration and customs are separate steps; not idiomatic | (customs) I'd like to declare this gift. | 我想申報呢份禮物。 |
| T8 RP2 | Pat: business? return ticket? → EXPECT "I'm not here on holiday." | — | scene logic | contradiction carried into roleplay; keywords business/ticket absent | — | — |

### T18 · Declaring goods at customs ｜ 海關申報 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t18-l6 | You should pay forty dollars in cash because that alcohol is well over. | 因為酒過咗限額，你應該畀四十蚊現金。 | unnatural | naturalness: "well over" | The duty on that is forty dollars, in cash. | 呢枝要交四十蚊稅，要俾現金。 |
| t18-l8 | Yes. The duty is paid at this counter now, so keep the slip. | 可以。關稅而家喺呢個櫃檯交，留低張單。 | unnatural | naturalness | Yes, you can pay here. Please keep the receipt. | 可以，喺度交就得。記得留住收據。 |
| T18 U1 | 關於酒精 (alcohol) | — | gloss | gloss: 酒精 = ethanol; a bottle of alcohol is 酒 | 關於酒 | — |

### W2 · Email phrases spoken ｜ 電郵口語 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w2-l3 | I have attached the file as discussed, and I would like to clarify the deadline with you. | 我已經按討論附上份文件，想同你講清楚個期限。 | scene logic | scene: Tom has just thanked her for attaching it | I'd like to clarify the deadline with you. | 我想同你講清楚個期限。 |
| w2-l6 | Yes. I'm free on Friday, so that deadline works. | 好。我星期五有空，所以個期限得。 | scene logic | logic: being free on the deadline day doesn't make the deadline work | Yes, Friday works for me. | 好，星期五冇問題。 |
| W2 RP / Q3 | keywords ['propose','confirm'], ['grateful','deadline']; Q3 asks "grateful" (not in quoted line) | — | quiz / answer key | keyword bug + quiz word absent from quote | — | — |

### W3 · Meetings ｜ 開會 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w3-l3 | Could you expand on the deadline and unmute so we can hear you? | 可唔可以再講個期限，同埋開返咪等我哋聽到？ | scene logic | scene-logic: Tom was just heard speaking, so he isn't muted | Could you say more about the deadline? | 可唔可以講多啲個期限？ |
| w3-l5/w3-l6 | Let's agree on Friday… / I agree on Friday, but I suggest we mute and follow the agenda. | — | scene logic | scene: ignores the concern that Mei can't make Friday; mute suggestion is a non-sequitur | l5: Can someone help Mei so we can keep Friday? | 有冇人可以幫 Mei，等我哋保持星期五？ |
| W3 canDo | EN "name an action item" vs YUE 「講出擔心」 | — | gloss | canDo EN and YUE describe different goals | — | — |
| W3 C1 / Q1 / B1 | gloss 「負責人趕唔切」 for "Mei can't meet"; mute = 「收細個咪」; ORDER ends with "but" | — | gloss | gloss subject mismatch (Mei → 負責人); 收細 = turn down, not mute; fragment target | — | 熄咪／靜音 |

### W8 · A team meeting update ｜ 開會報告進度 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| W8 Q3 / C2 | task 係咩意思 key 行動; gloss 「呢項行動我負責」 | — | quiz / answer key | gloss/key: task = 工作／任務, not 行動 (action) | key -> 工作 | 呢項工作我負責 |
| W8 RP | keywords ['behind','schedule'], ['Friday','note'], ['action','Friday'] | — | quiz / answer key | keyword bug: absent from expected lines | — | — |

### W11 · Asking HR about a payslip ｜ 問HR糧單問題 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| W11 U1/U2 / Q4 | Sure, I'll email you this afternoon. key 講緊計糧; Q4 explain 糧單 for key payroll | — | quiz / answer key | WRONG KEYS: rotated topic labels | U2 -> 下晝發電郵確認 | — |

### W12 · Performance review chat ｜ 績效面談 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w12-l4 | Yes. The shop window display slipped last quarter, and the rest held. | 係。舖面櫥窗上季遲咗，其他都做到。 | unnatural | naturalness: "the rest held" | Yes. The window display was late last quarter, but everything else was on time. | 係，上季櫥窗陳列遲咗，其他都準時。 |
| W12 lesson | review is booked (l2) and then held in the same breath (l3–l8) | — | scene logic | scene: booking call turns into the review itself | split into two scenes | — |

### D3 · Renting a flat ｜ 租樓 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d3-l2 | How much is the rent here, please, and are the utilities included? | 呢度月租幾多，唔該，水電包唔包？ | punctuation / spelling | punctuation/natural: "please" wedged mid-question | How much is the rent? Are utilities included? | 月租幾多？包唔包水電？ |
| d3-l8 | I will read the written notice carefully before I pay the deposit. | 我交按金之前會小心睇份書面通知。 | scene logic | scene: "written notice" undefined; after already agreeing to sign | I'll read the lease carefully before I pay the deposit. | 交按金之前我會睇清楚份租約。 |
| D3 C1/C3 | C1 pattern "…and the ___ is one month" (ans deposit) vs example about rent; C3 ans "contract" vs example about keys | — | text ≠ what is tested/played | mismatch: the revealed example does not contain the answer word | — | — |
| D3 B0 | 代理講咗月租同按金。你點先答？ key "The deposit is one month, and the rent stays fixed." | — | quiz / answer key | wrong key: keyed answer is the agent's own line | key -> If I decide today, is the deposit one month's rent? | — |
| D3 RP2/RP3 | partner Lea says Tom's line ("I will sign the lease…"); learner is expected to say Lea's lines | — | scene logic | roleplay roles are swapped mid-scene | — | — |

### D8 · Reporting a repair ｜ 搵管理處報維修 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| d8-l7 | Yes, the front guard can give you access, and the flat key stays at the front desk. | 可以，前門保安可以畀你入單位，鎖匙放喺前台。 | unnatural | naturalness: "front guard" | Yes. I'll leave the key with the security guard downstairs. | 可以，我會將鎖匙交畀樓下保安。 |

### T10 · Lost luggage ｜ 行李唔見咗 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| T10 U2 | What tag number is on your baggage receipt…? key 行李牌號碼印喺行李收據上面 | — | quiz / answer key | key: the line is a question asking for the number; key is a statement | key -> 問行李牌號碼 | — |

### T14 · A missed connection ｜ 轉機趕唔切 (B1)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| T14 U1/U2 / Q4 | Yes, I've rebooked you… key 講緊轉機; "Gate twenty-two…" key 講緊改簽; Q4 explain 延誤 for key rebook | — | quiz / answer key | WRONG KEYS: rotated topic labels | U1 -> 已經改簽，行李同班機 | — |

### W5 · A complaint call ｜ 投訴電話 (B1/B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w5-l1/w5-l7 | The reference number is on the box. (said twice) | 參考編號喺盒上面。 | unnatural | naturalness + repeat: caller should read the number, not say where it is | My order number is A one two three four. | 我張單編號係 A1234。 |
| w5-l2 | I'm sorry about the delay. Let me look into the broken clasp. | 唔好意思，遲咗。我睇吓個爛扣。 | scene logic | scene: agent knows about the delay and clasp before the caller mentions them | What seems to be the problem? | 請問有咩問題？ |
| W5 Q2 / Q1 | quoted line "…by phone" not in dialogue; listen "apology" not in dialogue | — | text ≠ what is tested/played | mismatch | — | — |

### W10 · Replying to a complaint by email ｜ 回覆客人投訴電郵 (B1/B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| W10 U1/U2 / B1 | No, offer a partial refund… key 講緊誠懇; "Say we'll call her tomorrow…" key 講緊延誤; ORDER "start sincere" | — | quiz / answer key | WRONG KEYS (rotated labels) + ungrammatical order target | U1 -> 畀兩成退款或者購物金; U2 -> 聽日打電話跟進，多謝佢耐心 | — |

### J14 · A custom jewellery design ｜ 訂造首飾 (B1/B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j14-l1 | We have a clear budget for a custom ring this month. | 我哋今個月有個清楚預算訂造戒指。 | unnatural | naturalness | We'd like a custom ring. Our budget is about twenty thousand dollars. | 我哋想訂造一隻戒指，預算大約兩萬蚊。 |
| j14-l7 | I can pay half the deposit this week. | 我呢個星期可以畀一半訂金。 | scene logic | logic: the deposit already is half the budget; "half the deposit" = a quarter | I can pay the deposit this week. | 我呢個星期可以俾訂金。 |
| j14-l8 | I will hold the ring once the deposit arrives, and you can pick it up in four weeks. | 訂金到咗我就留住隻戒指，… | unnatural | wrong verb: the ring doesn't exist yet; "start the ring" | We'll start once the deposit arrives. It'll be ready in four weeks. | 收到訂金就開工，四個星期後可以攞。 |

### J11 · A private jewellery consult ｜ 貴客諮詢 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| J11 RP / Q2 | keywords ['occasion','preference'], ['contemporary','discreet']; Q2 asks "preference" (not in quote) | — | quiz / answer key | keyword bug + quiz word absent | — | — |

### W6 · A one-minute self-intro ｜ 面試自我介紹 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| w6-l5 | That sounds reliable. How did teamwork help you…? | 呢個聽落好可靠。… | unnatural | naturalness: an event doesn't "sound reliable" | That's impressive. How did your team help that morning? | 好叻。嗰朝同事點樣幫到你？ |
| W6 B1 | ORDER "My strength is calm" | — | grammar | grammar: should be "My strength is staying calm" | My strength is staying calm | — |

### T9 · A delayed flight ｜ 航班延誤 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t9-l2/t9-l3 | …your connection is still safe. / Can we rebook for this evening…? | — | scene logic | scene-logic: rebooking is asked right after being told the connection is fine; C0 example then says the connection "was missed" | The flight is delayed by three hours, so you'll miss your connection. | 航班延誤三個鐘，你會趕唔切轉機。 |
| t9-l6 | Is a full refund an alternative if the new flight does not leave until tomorrow morning from here? | … | unnatural | naturalness: stilted | If the next flight is tomorrow, can I get a full refund instead? | 如果下一班要聽朝先飛，可唔可以全數退款？ |
| t9-l8 | Your new itinerary is confirmed, and the desk will print it when the queue moves. | …隊伍一動櫃檯就會印畀你。 | unnatural | naturalness | You're confirmed on the next flight. Here's your new boarding pass. | 已經幫你確認咗下一班，呢張係新登機證。 |
| T9 RP3 | EXPECT repeats RP1's line ("Can we rebook for this evening…") | — | scene logic | duplicate roleplay turn | — | — |

### J13 · A corporate gift order ｜ 公司訂禮品 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| j13-l2 | We need thirty pieces for the office, and we want the logo engraved on it. | 我哋要三十件畀公司，要喺上面刻標誌。 | grammar | grammar: thirty pieces → "on them" | We need thirty pieces, with our logo engraved on each one. | 我哋要三十件，每件都要刻公司標誌。 |
| j13-l5 | The better price is forty dollars each if you confirm the thirty-piece order this week. | 今個星期確認訂單，三十件每件四十蚊。 | unnatural | naturalness | If you confirm this week, we can do forty dollars each. | 今個星期確認嘅話，每件可以算你四十蚊。 |

### T20 · Screening an oversized case ｜ 安檢同超大件 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| T20 (whole lesson) | e.g. t20-l3 "I missed the inner checkpoint by that belt."; t20-l6 "No. That grey case must use the scanner desk…" | 唔得。… | scene logic | scene/grammar: lesson is keyword-stuffed; "No" contradicts the answer; t20-l8 "…thirty minutes early, because security opens at noon" false because | rewrite lesson: "Does this big case go through the normal scanner?" / "No, oversized bags go to the desk on the left." | — |

### J23 · A valuation and the deductible ｜ 估值同免賠額 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| J23 (whole lesson) | e.g. j23-l4 "The new deductible is noted after that first file."; j23-l8 "The deductible stays the same." | — | scene logic | scene/meaning: insurance jargon chained without meaning; l8 contradicts l3–l4 (deductible changed); speaker refers to himself as "the claimant" | rewrite lesson | — |

### R17 · A banquet, cancellation, and gratuity ｜ 宴會、取消訂位同小費 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| r17-l1 / R17 lesson | Could we book the banquet from six if the cancellation fee stays under fifty dollars? | … | unnatural | naturalness + fact: conditional is unnatural; a $40 banquet cancellation fee / $80 surcharge is unrealistic in HK | I'd like to book a banquet for 80 people at six. What's your cancellation policy? | 我想訂六點、八十位嘅宴會。取消有咩規定？ |
| r17-l5/r17-l7 | Is the service gratuity included … when the surcharge covers three full hours? / What time does the cancellation rule start if we drop the whole party after four? | — | unnatural | meaning: nonsensical conditionals | Is the service charge included? / What's the latest time we can cancel? | 包唔包服務費？最遲幾點可以取消？ |

### W14 · A forecast, an overrun, and circulating it ｜ 預測、超支同傳閱 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| W14 (whole lesson) | w14-l3 "Will you circulate the written forecast if each stakeholder has not read the email yet?" / w14-l4 "…once the team has read the full email." | — | scene logic | scene/meaning: l4 contradicts l3's condition; stacked conditionals throughout | rewrite lesson | — |

### W15 · Reimbursement, variance, and the ledger ｜ 報銷同帳簿 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| W15 (whole lesson) | w15-l3 "Will you approve the full variance if procurement keeps it inside the written March ledger?"; w15-l5 "Could you put me down as the lead, and not read every line out in the meeting?" | — | glued clauses | meaning + glued: jargon chains, unrelated requests glued with "and" | rewrite lesson | — |

### J24 · A hallmark, a prong, and filigree ｜ 印記、爪托同金絲 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| J24 (whole lesson) | j24-l5 "Is the filigree quote lower if I take that rhodium pair home this Friday night?"; j24-l8 "I will hold that hallmark note until noon, and the gold prong can wait here." | — | scene logic | meaning + fact: lesson is incoherent; hallmarks are stamped on the band/shank, not on a prong | rewrite lesson | — |

### T21 · Check-in, immigration, and the carousel ｜ 申報表同入境處 (B2)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| t21-l3/t21-l4 | If the flight leaves at two, how early should I reach immigration with one bag? / Please reach immigration by one o'clock, because your layover flight leaves at two. | — | scene logic | scene: at check-in the passenger's own flight is mislabelled "layover flight"; "with one bag" padding | How early should I go through immigration? → Please go through by one. Boarding starts at one thirty. | 要幾早過關？→ 一點前過關，一點半開始登機。 |

---

## 4. Vocab cards: issues grouped by deck

Each row ID is `card-id slot`: `E` is the card example, `e1–e3` are the 例句 rows, `m1–m2` are the mini-dialogue rows. Rows tagged "nonsense sentence" are generator slot-fills. The fix for those is to replace the sentence with a real usage or delete it.


### Cross-cutting

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| shellfish / allergic m1 gloss | I am allergic to shellfish, including prawns and crab. | 我對貝殼類過敏，蝦同蟹都唔食得。 | gloss | prawns and crab are crustaceans (甲殼類), not 貝殼類; HK menus say 海鮮／貝殼類海鮮 | — | 我對海鮮（蝦蟹貝類）敏感… |
| B2 scene cards c (oversized, underwriter, overrun, immigration, circulate, rhodium, …) | collocations "a oversized", "a underwriter", "a overrun", "a immigration", "the circulate", "a circulate" | — | grammar | generated collocations use "a" before vowels and put articles on adjectives/verbs | an oversized case · an underwriter · a cost overrun · circulate the note | — |
| B2 scene cards (screening…layover, #749–#776) | examples reuse the incoherent T20/J23/R17/W14/W15/J24 lesson lines | — | unnatural | same issues as those lessons (stacked conditionals, keyword stuffing) | rewrite with the lessons | — |
| sense-labels: bill-noun (noun:restaurant-bill) | eyebrow label 餐單 | — | gloss | 餐單 means "menu"; the bill is 張單／帳單 (same error as check-noun gloss) | — | 帳單 |
| sense-labels: allergic-adj (adj:food-reaction) | eyebrow label 對食物 | — | gloss | label reads "towards food", not "allergic" | — | 過敏 |
| sense-labels: without-prep (prep:lacking) | eyebrow label 冇包含 | — | gloss | stiff; card gloss is 冇／唔要 | — | 唔要；冇 |
| sense-labels: alcohol-noun (noun:drink-spirit) | eyebrow label 酒精 | — | gloss | 酒精 = ethanol; drinks are 酒 | — | 酒 |
| sense-labels: utilities-noun (noun:home-bills) | eyebrow label 公用開支 | — | gloss | inconsistent with card gloss 水電煤 (the natural HK term) | — | 水電煤 |

### Deck: jewellery ｜ 珠寶櫃檯

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| silver-noun e3 / ring-noun e3 | Soft cloth only on this silver. / Soft cloth only on this ring. | 呢件銀淨係可以用軟布。 | grammar | verbless template fragment | Only use a soft cloth on this silver. | 呢件銀器淨係可以用軟布抹。 |
| watch-noun e3 | I fastened the watch with both hands. | 我用雙手扣好手錶。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Iris asked about the watch on the glass counter before noon."; small.en heard: "Iris asked about the watch on the gliss count of the Fort noon" | re-render the clip from the current text (after fixing the sentence) | — |
| bracelet-noun e3 / earring-noun e3 | Please certify this bracelet in writing. | 請書面證明呢件手鏈。 | unnatural | template nonsense: shops don't "certify a bracelet in writing" | Could you give me a certificate for this bracelet? | 可唔可以畀張證書我？ |
| bracelet-noun e1=e2 | I like this silver bracelet. (twice) | 我鍾意呢條銀手鏈。 | duplicate | same example listed twice | replace e2: This bracelet is a little loose on my wrist. | 呢條手鏈戴落有啲鬆。 |
| just-looking-phrase e3 / percent-noun e3 | Please isolate the damaged just looking. | 請將壞咗嘅睇吓先隔離。 | nonsense sentence | template slot-fill | I'm just looking, thanks. | 我睇吓先，唔該。 |
| just-looking-phrase e3 | Please isolate the damaged just looking. | 請將壞咗嘅睇吓先隔離。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Liam asked about the just looking near the front door before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| price-noun e3 / discount-noun e3 | I misplaced my price after lunch. / I misplaced my discount after lunch. | 食完晏我唔見咗價錢。 | nonsense sentence | template slot-fill | Is this the final price? | 呢個係咪實價？ |
| gold-noun e3 | We keep every gold in the safe overnight. | 每件金夜晚都鎖喺夾萬。 | grammar | gold is uncountable | We keep all the gold pieces in the safe overnight. | 所有金飾夜晚都鎖喺夾萬。 |
| white-gold-phrase e3 | Could you show me a white gold near the window? | 可唔可以喺窗邊畀我睇吓白K金？ | grammar | "a white gold" needs a noun; audio says "platinum" (section 2) | Could you show me a white gold ring near the window? | 可唔可以畀我睇吓窗邊嗰隻白K金戒指？ |
| rose-gold-phrase e3 | Could you show me a rose gold near the window? | … | grammar | a rose gold (needs a noun) | Could you show me a rose gold ring? | 可唔可以畀我睇吓玫瑰金戒指？ |
| diamond-noun e3 | Please quote the diamond in writing. | 請書面報鑽石嘅價。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Ned asked about the diamond by the side when due before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| gemstone-noun e3 / location-noun e3 | We donated the unused gemstone kit. | 冇用過嘅寶石套裝我哋捐咗。 | nonsense sentence | template slot-fill | — | — |
| gemstone-noun e3 | We donated the unused gemstone kit. | 冇用過嘅寶石套裝我哋捐咗。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Tess asked about the gemstone by the side window before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| karat-noun e3 | We replaced a broken karat for free. | 壞咗嘅開我哋免費換過。 | nonsense sentence | a karat is a purity unit and can't break | — | — |
| karat-noun e3 | We replaced a broken karat for free. | 壞咗嘅開我哋免費換過。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Paul asked about the parrot by the side window before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| pure-adj e3 / authentic-adj e3 | This seat feels more pure. / This seat feels more authentic. | 呢個位感覺更純。/ 呢個位感覺更正貨。 | nonsense sentence | template slot-fill; gloss 「更正貨」 is broken | Is this 24-karat gold pure? / Is this jade authentic? | — |
| certified-adj e3 / natural-adj e3 | I need something less certified than this. / I need something less natural than this. | 我要冇咁有證書嘅。 | nonsense sentence | template slot-fill | — | — |
| treated-adj e3 / tight-adj e3 | Is it still treated enough? / Is it still tight enough? | 仲夠唔夠處理過？ | nonsense sentence | template slot-fill | — | — |
| sparkle-verb e3 / enjoy-verb e3 | Please sparkle the form carefully. | 請小心閃光呢份表格。 | nonsense sentence | template slot-fill | — | — |
| setting-noun e3 | We audited every borrowed setting. | 借出嘅鑲托我哋全部清點過。 | nonsense sentence | template slot-fill (audio for this slot is also a different, stale sentence; see section 2) | The setting holds the stone securely. | 個鑲托托得粒石好穩。 |
| setting-noun e3 | We audited every borrowed setting. | 借出嘅鑲托我哋全部清點過。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Pull us about the setting under the red limb before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| try-on-phrase e3 | May I try a different try on? | 可唔可以試第二款試戴？ | nonsense sentence | template slot-fill (audio is a stale different sentence) | May I try on a different one? | 可唔可以試另一隻？ |
| try-on-phrase e3 | May I try a different try on? | 可唔可以試第二款試戴？ | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "You nurse to about the trial and inside the small barks before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| fit-verb e3 | Can you fit it again for me? | 可唔可以再啱戴一次畀我？ | nonsense sentence | template slot-fill; audio also says "bracelet" (section 2) | Does it fit better now? | 而家啱戴啲未？ |
| loose-adj e3 | Guests said the room was loose. | 客話間房好鬆。 | nonsense sentence | template slot-fill; audio also says "bracelet" (section 2) | The clasp feels a little loose. | 個扣有少少鬆。 |
| finger-noun e3 | May I try a different finger? | 可唔可以試第二款手指？ | nonsense sentence | template slot-fill | Try it on your middle finger. | 試吓戴喺中指。 |
| finger-noun e3 | May I try a different finger? | 可唔可以試第二款手指？ | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Iris iced about the finger inside the small barks before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| mirror-noun e3 | We rotate the display mirror weekly. | 展示用嘅鏡我哋每星期換。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Friend asked about the mirror beside the blue chair before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| perfect-adj e3 | Guests said the room was perfect. | 客話間房好啱到極。 | gloss | off-topic; gloss 「好啱到極」 broken | — | 客話間房好完美。 |
| cost-noun e3 / password-noun e3 | Please write "cost" on line three. | 請喺第三行寫「費用」。 | nonsense sentence | meta template | — | — |
| cost-noun e3 | Please write "cost" on line three. | 請喺第三行寫「費用」。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "What is the total cost for this ring?" | re-render the clip from the current text (after fixing the sentence) | — |
| percent-noun e3 | Please isolate the damaged percent. | 請將壞咗嘅百分比隔離。 | nonsense sentence | template slot-fill | — | — |
| percent-noun e3 | Please isolate the damaged percent. | 請將壞咗嘅百分比隔離。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Vira has stood out the percent behind the green plant before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| offer-noun e2/e3 (+m2) / total-noun e2/e3 (+m2) | In today's drill, circle the word offer. / The offer vendor changed prices again. / I timed how long the total lasts. | 今日練習圈出「優惠」呢個字。… | nonsense sentence | classroom-drill meta and slot-fill sentences; the drill line is also used as a mini-dialogue turn | This offer ends on Sunday. / The total comes to two thousand dollars. | 呢個優惠星期日完。/ 總共兩千蚊。 |
| offer-noun e2 | In today's drill, circle the word offer. | 今日練習圈出「優惠」呢個字。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Meener likes this Friday often." | re-render the clip from the current text (after fixing the sentence) | — |
| offer-noun e3 | The offer vendor changed prices again. | 供應優惠嘅舖又改價。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Hugh asked about the waffle behind the green plant before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| include-verb e3 / adjust-verb e3 | I will include it after lunch. | 食完晏我會包括。 | nonsense sentence | template slot-fill | — | — |
| total-noun e2 | In today's drill, circle the word total. | 今日練習圈出「總數」呢個字。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Tex is already inside the towel." | re-render the clip from the current text (after fixing the sentence) | — |
| total-noun e3 | I timed how long the total lasts. | 我計過總數可以用幾耐。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Iris asked about the toll behind the green plant before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| budget-noun e3 / refill-noun e3 | I cushioned the budget with bubble wrap. | 我用氣泡紙墊好預算。 | nonsense sentence | template slot-fill | — | — |
| budget-noun e3 | I cushioned the budget with bubble wrap. | 我用氣泡紙墊好預算。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Glenn is about the budget behind the green plinth before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| deal-noun e3 / change-noun e3 | We discounted the scratched deal. | 刮花咗嘅抵買我哋減咗價。 | nonsense sentence | template slot-fill | — | — |
| deal-noun e3 | We discounted the scratched deal. | 刮花咗嘅抵買我哋減咗價。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Liam asked about the deal on the wooden shelf before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| sale-noun e3 | I circled the sale on the catalogue. | 我喺目錄圈咗特價。 | nonsense sentence | template slot-fill | — | — |
| sale-noun e3 | I circled the sale on the catalogue. | 我喺目錄圈咗特價。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Ruth asked about the sale on the wooden shelf before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| pay-verb e3 / wrap-verb e3 | Do not pay without the receipt. | 冇收據唔好付款。 | scene logic | you get the receipt after paying | Keep the receipt after you pay. | 畀完錢記得留收據。 |
| card-noun e3 / landmark-noun e3 | I swapped my card for a quieter one. | 我換咗靜啲嘅卡。 | nonsense sentence | template slot-fill | — | — |
| card-noun e3 | I swapped my card for a quieter one. | 我換咗靜啲嘅卡。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Me at a stabout the cart, when the wooden shelf before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| cash-noun e3 | How much is this cash on the tray? | 托盤上面呢件現金幾錢？ | nonsense sentence | template slot-fill | — | — |
| tax-free-phrase e3 | I saved the tax-free on the shared drive. | 我將免稅存咗喺共用雲端。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| refund-form-phrase e3 | A spare refund form sits in the drawer. | 備用退款表格放喺櫃桶。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Hope asked about the refund form across the quiet hall before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| bag-noun e3 | Please quote the bag in writing. | 請書面報袋嘅價。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| gift-box-phrase e3 | Please archive the old gift box form. | 請將舊嘅禮盒表格歸檔。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Yal asked about the gift box near the open drawer before noon."). | replace with a real usage sentence (or delete) | — |
| signature-noun e3 | I will collect the signature after work. | 放工之後我會過嚟攞簽名。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Cora asked about the signature near the open drawer before noon."). | replace with a real usage sentence (or delete) | — |
| complaint-noun e3 | The inspector weighed every complaint. | 檢查員秤過每個投訴。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| replace-verb m1 | Did you replace already? | 你換過咗未？ | grammar | replace needs an object | Have you replaced it yet? | 你換咗未？ |
| refund-noun e3 | I enjoy quiet music after the refund. | 退款之後我鍾意聽安靜音樂。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the roof and beside the roof and tray."). | replace with a real usage sentence (or delete) | — |
| manager-noun e3 | Do you still sell that manager? | 你哋仲賣唔賣嗰款經理？ | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the immunerjib beside the miniature tray."). | replace with a real usage sentence (or delete) | — |
| appreciate-verb e3 | The clerk reset my appreciate settings. | 職員重設咗我嘅感激設定。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| broken-adj e3 | That answer sounds broken. | 嗰個答案聽落好壞咗。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| issue-noun e3 | The issue warranty excludes water damage. | 呢個問題保養唔包浸水。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the issue beside the issue tray."). | replace with a real usage sentence (or delete) | — |
| return-noun e3 | That return sold out before noon. | 嗰款退貨中午前就賣晒。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| exchange-noun e3 | The courier delivered the wrong exchange. | 速遞送錯咗換貨。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| scratch-noun e3 | Please shade the scratch from direct sun. | 請遮住刮痕唔好畀猛日光晒到。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| polish-noun e3 | Please wipe the ring with this polish. | 請用呢支擦亮劑抹戒指。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Quain asked about the parlour's nerdy open draw on Friday." | re-render the clip from the current text (after fixing the sentence) | — |
| policy-noun e3 | We rejected the counterfeit policy. | 假嘅政策我哋拒收。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Paul asked about the policy near the open drawer on Friday."). | replace with a real usage sentence (or delete) | — |
| within-prep e3 | Leave shoes within the mat. | 鞋放喺地毯之內。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| clean-verb e3 | Please clean slowly so I can follow. | 請慢慢抹乾淨，等我跟到。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| also-adv e3 | She answered also and clearly. | 佢答得好都又清楚。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| engraving-noun e3 | We rejected the counterfeit engraving. | 假嘅刻字我哋拒收。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| optional-adj e3 | Keep the instructions optional. | 指示請保持可以唔要。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| follow-up-noun e3 | The follow-up vendor changed prices again. | 供應跟進嘅舖又改價。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Tess asked about the fall love near the front door one Monday."). | replace with a real usage sentence (or delete) | — |
| smaller-adj e3 | The queue looked smaller after lunch. | 晏晝之後條隊睇落好細碼。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| reserve-verb m1 | Did security ask you to reserve? | 保安有冇叫你預留？ | nonsense sentence | template mini-dialogue | Could you reserve this bracelet for me? | 可唔可以幫我留住呢條手鏈？ |
| reserve-verb e3 | I need to reserve before security. | 過安檢前我要預留。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| collect-verb e3 | We collect together to save time. | 為咗慳時間我哋一齊取貨。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| opening-hours-phrase e3 | I cross-checked the opening hours against stock. | 我對過開門時間同庫存。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| location-noun e3 | We donated the unused location kit. | 冇用過嘅位置套裝我哋捐咗。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| describe-verb e3 | We cannot describe without ID. | 冇證件唔可以描述。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| notify-verb e3 | Please notify only once per visit. | 每次嚟淨係可以通知一次。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| tomorrow-adv e3 | She answered tomorrow and clearly. | 佢答得好聽日又清楚。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| custom-adj e3 | I prefer the custom one on the left. | 我鍾意左邊較訂做嗰個。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| custom-deposit-noun e3 | May I leave a deposit for the deposit? | 可唔可以留訂金訂呢個訂金？ | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| perfume-noun e3 | Please avoid perfume on the perfume. | 請唔好將香水噴落香水。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Dana asked about the perfume near the open drawer at 10."). | replace with a real usage sentence (or delete) | — |
| certificate-noun e2/m1 | The certificate lists the price. | 證書寫咗價錢。 | scene logic | gem certificates list stone details, not the price | The certificate lists the stone and its size. | 證書寫咗粒石同尺寸。 |
| wipe-verb m1/m2 / understand-verb m1 | Should we wipe tomorrow morning? / Yes. Before the gate opens. | 聽朝要唔要抹？ | nonsense sentence | template mini-dialogue | Should I wipe the pearls after wearing them? / Yes, with a soft cloth. | 戴完要唔要抹珍珠？/ 要，用軟布。 |
| wipe-verb e3 | She wants to wipe a quieter table. | 佢想抹靜啲嘅枱。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| battery-noun m2 | The watch needs a new battery. → "Of course. Take your time." | 當然得，慢慢試。 | scene logic | template reply doesn't follow | Sure, it takes about ten minutes. | 冇問題，大約十分鐘。 |
| battery-noun e3 | This remote needs a fresh battery. | 呢個遙控要換新電池。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Ruth asked about the bellery by the round table at 10." | re-render the clip from the current text (after fixing the sentence) | — |
| appraisal-noun e3 | This phone needs a new appraisal. | 呢部電話要換新估價。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| wedding-noun e1/e2 | The wedding can stay on Saturday. / Our wedding stays on Saturday morning. | 婚禮可以照星期六。 | unnatural | stay on Saturday is not idiomatic | The wedding is still on Saturday. | 婚禮照舊喺星期六。 |

### Deck: restaurant ｜ 餐廳

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| enjoy-verb e1/e3 | Enjoy the store. / Please enjoy the form carefully. | 慢慢睇。/ 請小心慢慢享受呢份表格。 | nonsense sentence | e1 not said by staff; e3 is nonsense | Take your time. / Enjoy your meal. | 慢慢睇。/ 慢慢食。 |
| water-noun e3 / sale-noun e3 | I circled the water on the catalogue. | 我喺目錄圈咗水。 | nonsense sentence | template slot-fill | I'd like a glass of tap water, please. | 唔該畀杯清水我。 |
| water-noun e3 | I circled the water on the catalogue. | 我喺目錄圈咗水。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Hugh asked about the war and knew the front door before noon."; small.en heard: "Heu asked about the war and near the front door before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| allergy-noun e3 | The allergy kit includes spare screws. | 呢套過敏包埋備用螺絲。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Glenn asked about the ology near the open drawer before noon."). | replace with a real usage sentence (or delete) | — |
| allergic-adj e3 | She wants a more allergic option. | 佢想要更過敏嘅選擇。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| peanut-noun e3 | Please tell us if the dish has peanut. | 如果菜式有花生，請同我哋講。 | grammar | countable plural needed | Please tell us if the dish has peanuts. | — |
| shellfish-noun e3 | I will collect the shellfish after work. | 放工之後我會過嚟攞貝類。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("You asked about the shellfish but a round table before noon."). | replace with a real usage sentence (or delete) | — |
| dairy-noun e3 | We rotate the display dairy weekly. | 展示用嘅奶製品我哋每星期換。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Liam asked about the dairy by the round table before noon."). | replace with a real usage sentence (or delete) | — |
| gluten-noun e3 | The inspector weighed every gluten. | 檢查員秤過每個麩質。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Ruth asked about the glue and butt around table before noon."). | replace with a real usage sentence (or delete) | — |
| sauce-noun e3 | We double-checked the sauce weight. | 我哋覆核咗醬重量。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Could you check the basis again?"). | replace with a real usage sentence (or delete) | — |
| on-the-side-phrase e3 | Please tell us if the dish has on the side. | 如果菜式有另上，請同我哋講。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| without-prep e3 | We kept without spare key downstairs. | 樓下留咗冇後備鎖匙。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please look without the list."). | replace with a real usage sentence (or delete) | — |
| instead-adv e3 | They arrived instead after the rain. | 落完雨佢哋改為到。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| contain-verb e3 | She can contain the booking online. | 佢可以上網含有預約。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| ingredients-noun e3 | The ingredients listing expires on Sunday. | 呢個成分嘅刊登星期日到期。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| carefully-adv e3 | They arrived carefully after the rain. | 落完雨佢哋小心到。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| thank-you-for-telling-phrase e3 | Please dust the thank you for telling me before photos. | 影相前請抹走多謝你話我知灰塵。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the if and Q for attelling beside the finf tray."). | replace with a real usage sentence (or delete) | — |
| refill-noun e3 | I cushioned the refill with bubble wrap. | 我用氣泡紙墊好添杯。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| delicious-adj e3 | Make the next draft more delicious. | 下一稿請寫得更好味。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| more-det e3 | Please choose more option on the list. | 請喺名單揀多啲選項。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| still-adj e3 | A still tone works better here. | 呢度用冇氣啲嘅語氣更好。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| sparkling-adj e3 | Is the table too sparkling for four? | 張枱對四個人會唔會太有氣？ | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| fork-noun e3 | Please archive the old fork form. | 請將舊嘅叉表格歸檔。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| knife-noun e3 | The loaner knife must return by six. | 借用嘅刀六點前要還。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| bill-later-phrase e3 | I enjoy quiet music after the bill later. | 遲啲先埋單之後我鍾意聽安靜音樂。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| anything-else-phrase e3 | I sorted the anything else by size and colour. | 我按大細同顏色執好仲有冇其他。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the anything else beside the anything tray."). | replace with a real usage sentence (or delete) | — |
| bill-noun e3 | I labelled both ends of the bill. | 我喺單兩頭都貼咗標。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| check-noun gloss | gloss 餐單（埋單） | — | gloss | 餐單 means "menu"; a restaurant check is 張單／帳單 | — | （埋單嗰張）單 |
| check-noun e3 | Guests often skip the check topping. | 好多客會唔要餐單配料。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| separate-adj e3 | Make the next draft more separate. | 下一稿請寫得更分開。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| service-charge-phrase e3 | I traced the service charge to aisle four. | 我喺第四巷搵到服務費。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the service beside the service tray."). | replace with a real usage sentence (or delete) | — |
| tip-noun e3 | I sorted the tip by size and colour. | 我按大細同顏色執好貼士。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Core up, estimate the tip beside the blue chair on Friday."). | replace with a real usage sentence (or delete) | — |
| card-machine-phrase e3 | We refused a cracked card machine return. | 裂咗嘅卡機我哋唔收退貨。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| change-noun e3 | We discounted the scratched change. | 刮花咗嘅零錢我哋減咗價。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| keep-the-change-phrase e3 | Is the keep the change handmade or machine-made? | 呢個唔使找係人手定機器造？ | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the kick the exchange beside the keep tray."). | replace with a real usage sentence (or delete) | — |
| cold-adj m2 | Could you heat this soup? It arrived cold. → "Sure. I will adjust it." | 得，我調一調。 | scene logic | template reply ("adjust it") reused on unrelated cards | Sure, I'll heat it up right away. | 好，我即刻幫你翻熱。 |
| understand-verb m1 | Should we understand tomorrow morning? | 聽朝要唔要明白？ | nonsense sentence | template mini-dialogue | — | — |
| understand-verb e3 | You should understand before Friday. | 你最好星期五前明白。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| egg-noun e2 + m2 | Note eggnoun: polish the egg lightly. | 輕輕擦吓隻蛋就得。 | nonsense sentence | generator artifact (internal id "eggnoun" leaked into learner text); also used as a mini-dialogue turn | Could I have the fried rice without egg? | 炒飯可唔可以走蛋？ |
| high-chair-phrase gloss | gloss 高腳櫈 | — | gloss | 高腳櫈 is a bar stool; a baby's high chair is 兒童椅／BB櫈 (R12 dialogue already uses 兒童椅) | — | 兒童椅（BB櫈） |
| tall-cup-phrase e2 (+m2) | Is the tall cup the larger one? | 中杯其實係細啲嗰杯。 | gloss | gloss answers the question instead of translating it | — | 中杯係咪大啲嗰杯？ |

### Deck: travel ｜ 旅行

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| key-card-phrase E | Please check the key card beside the key tray. | （key）可唔可以再檢查吓呢個鑰匙卡？ | gloss | stray 「（key）」 in gloss; gloss is a question, English is an instruction; "key tray" is odd | Here is your key card. | 呢張係你嘅房卡。 |
| key-card-phrase e3 | Reception can reprint your key card. | 接待處可以重印你嘅鑰匙卡。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Joel asked about the key card under the tall clerk before noon." | re-render the clip from the current text (after fixing the sentence) | — |
| room-noun e3 | I timed how long the room lasts. | 我計過房間可以用幾耐。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the room beside the room tray."). | replace with a real usage sentence (or delete) | — |
| twin-noun e3 | We double-checked the twin weight. | 我哋覆核咗雙床重量。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Quinn asked about the twin inside the blue tray before noon."). | replace with a real usage sentence (or delete) | — |
| double-adj e3 | She wants a more double option. | 佢想要更雙人嘅選擇。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| view-noun e3 | Can the view ship overseas? | 呢個景觀可唔可以寄去外國？ | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Hugh asked about the view inside the blue tray before noon."). | replace with a real usage sentence (or delete) | — |
| password-noun e3 | Please write "password" on line three. | 請喺第三行寫「密碼」。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the password beside the password tray."). | replace with a real usage sentence (or delete) | — |
| floor-noun e3 | The lease lists the monthly floor. | 租約寫咗每月樓層。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| elevator-noun e3 | A tourist asked about our rare elevator. | 有遊客問我哋稀有嘅升降機。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| late-checkout-phrase e3 | Reception can reprint your late checkout. | 接待處可以重印你嘅延遲退房。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| taxi-noun e3 | The lease lists the monthly taxi. | 租約寫咗每月的士。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| destination-noun e3 | The destination kit includes spare screws. | 呢套目的地包埋備用螺絲。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the destination beside the destination tray."). | replace with a real usage sentence (or delete) | — |
| address-noun e3 | She packed the address before leaving. | 佢出門前收好咗地址。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check that address beside the address tray."). | replace with a real usage sentence (or delete) | — |
| corner-noun e3 | The loaner corner must return by six. | 借用嘅街角六點前要還。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Dana is about the corner and the glist counter on Friday."). | replace with a real usage sentence (or delete) | — |
| traffic-noun e3 / report-noun e3 | … fragile traffic / I saved the report on the shared drive. | 易碎嘅交通；塞車… / 我將報告；報失存咗… | gloss | the card's raw gloss 「交通；塞車」/「報告；報失」 was pasted into the sentence gloss | — | — |
| traffic-noun e3 | We foam-packed the fragile traffic. | 易碎嘅交通；塞車我哋用泡棉包好。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Eunice about the traffic on the Gliss Counter on Friday."). | replace with a real usage sentence (or delete) | — |
| meter-noun e3 | We audited every borrowed meter. | 借出嘅咪錶我哋全部清點過。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| roughly-adv e3 | I finished the form roughly. | 我大概填完表格。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| landmark-noun e3 | I swapped my landmark for a quieter one. | 我換咗靜啲嘅地標。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| lost-adj e3 | The staff stayed lost throughout. | 職員全程都好唔見咗。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| missing-adj e3 | The staff stayed missing throughout. | 職員全程都好搵唔到。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| embassy-noun e3 | We foam-packed the fragile embassy. | 易碎嘅大使館我哋用泡棉包好。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| emergency-noun e3 | I cross-checked the emergency against stock. | 我對過緊急情況同庫存。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check that emergency beside the emergency tray."). | replace with a real usage sentence (or delete) | — |
| ambulance-noun e3 | I labelled both ends of the ambulance. | 我喺救護車兩頭都貼咗標。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Tess asked about the ambulance near the front door on Friday."). | replace with a real usage sentence (or delete) | — |
| stolen-adj e3 | That answer sounds stolen. | 嗰個答案聽落好畀人偷咗。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| noisy-adj e3 | The path feels noisy after rain. | 落完雨條路感覺好嘈。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| quiet-adj e1 | A quiet room is ready tonight. | 樓上有間靜啲嘅房。 | gloss | gloss adds 「樓上」 and drops "tonight" | — | 今晚有間靜啲嘅房準備好。 |
| quiet-adj e3 | The path feels quiet after rain. | 落完雨條路感覺好靜。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| engineer-noun e3 | Please warm the engineer before fitting. | 安裝前請先暖一暖工程師。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| inconvenience-noun e3 | Please dust the inconvenience before photos. | 影相前請抹走不便灰塵。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| color-noun e3 | The demo color cannot leave the shop. | 示範用嘅顏色唔可以帶出舖。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| fitting-room-phrase e3 | Please compare this fitting room with the sample photo. | 請將呢個試身室同樣本相比較。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| souvenir-noun e2 (+m2) | The souvenir shop can stamp this tax refund form. | 紀念品店可以蓋呢張退稅表。 | scene logic | refund forms are stamped by customs at departure, not by a shop | Customs will stamp this form at the airport. | 機場海關會喺呢張表蓋章。 |
| souvenir-noun e3 | We postponed the souvenir shipment. | 我哋延遲咗紀念品出貨。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| postcard-noun e3 | Please compare this postcard with the sample photo. | 請將呢個明信片同樣本相比較。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| tax-refund-phrase e3 | Send the tax refund before tomorrow's meeting. | 聽日開會前請將退稅傳過嚟。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| tourism-noun e3 | She packed the tourism before leaving. | 佢出門前收好咗觀光。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Dana asked about the tourism on the wooden shelf on Monday."). | replace with a real usage sentence (or delete) | — |
| hotel-noun e3 | Housekeeping found a spare hotel. | 清潔搵到一個多餘嘅酒店。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| officer-noun e2 | I need an officer at the desk. | 我要搵個職員到櫃檯。 | gloss | card gloss is 關員 but this gloss says 職員 | — | 我要搵個關員嚟櫃檯。 |
| cancelled-verb e1 | The flight has been cancelled at noon. | 航班中午取消咗。 | grammar | present perfect can't take a finished time ("at noon") | The flight was cancelled at noon. | 班機中午取消咗。 |
| missed-verb e3 | Please help me missed this bag. | 請幫我趕唔到呢個袋。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| rebook-verb e3 | Please rebook our party for Saturday lunch. | 請將我哋成團改訂星期六晏晝。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Can we rev up the table for Friday evening?" | re-render the clip from the current text (after fixing the sentence) | — |
| hotel-voucher-phrase e3 | Housekeeping found a spare hotel voucher. | 清潔搵到一個多餘嘅酒店券。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please check the hotel about should decide the hotel tray." | re-render the clip from the current text (after fixing the sentence) | — |
| gate-change-phrase e3 | Keep your gate change next to your passport. | 將閘口改動同護照放埋一齊。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| baggage-claim-phrase e3 | Keep your baggage claim next to your passport. | 將行李轉盤同護照放埋一齊。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Call us about the baggage claim on the Glass Counter at 10."). | replace with a real usage sentence (or delete) | — |
| tag-number-phrase e3 | I taped my name onto the tag number. | 我將名貼喺行李牌號碼上面。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| early-check-in-phrase | early check in (noun) | — | punctuation / spelling | noun is hyphenated: "early check-in" | early check-in | — |
| early-check-in-phrase e3 | Is the early check in ready before check-in? | 入住前提早入住準備好未？ | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| transfer-verb-bag e3 | I will transfer first, then call you. | 我會先轉運，再打畀你。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| return-verb m1 | Shall I return on the tablet? | 要唔要喺平板還車？ | nonsense sentence | template mini-dialogue (copied from check-verb) | What time should I return the car? | 我幾點要還車？ |
| return-verb e3 | I will return first, then call you. | 我會先還車，再打畀你。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| duty-noun e3 | The agenda lists a short duty update. | 議程有一小段關稅更新。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| alcohol-noun gloss | gloss 酒精 | — | gloss | 酒精 is ethanol; a bottle of alcohol at customs is 酒／酒類 | — | 酒（酒類） |
| noise-noun e2/m2 | The hallway noise kept me up. | 走廊嘈音搞到我。 | gloss | gloss truncated ("kept me up" missing) | — | 走廊好嘈，搞到我瞓唔著。 |
| immigration-noun e1/e2 / declaration-noun e1/e2 | If the layover leaves at two, how early should I reach immigration with one bag? / …check my declaration before the layover and tell me which belt? | … | nonsense sentence | a layover leaves, "layover belt": copies of the pre-fix T21 lines that were never updated | How early should I go through immigration? | 我要幾早過關？ |
| carousel-noun e1/e2 (+m) | Where should I take this heavy bag if immigration sits past the carousel doors? / Please take that heavy bag over to the carousel, and immigration sits past those doors. | …入境處就喺嗰度門後面。 | scene logic | puts immigration AFTER the baggage carousel; real arrival order (and the fixed T21) is immigration → carousel → customs | After immigration, collect your bag at carousel three, then go through customs. | 過咗入境，去三號轉盤攞行李，跟住過海關。 |

### Deck: work ｜ 職場

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| calling-verb e2 vs m1 | Kai is calling from the harbor office. / …from the harbour office? | — | punctuation / spelling | harbor/harbour mixed inside one card | pick one (app mostly uses UK: harbour) | — |
| speak-to-phrase e2=e3 | I need to speak to the manager. (twice) | 我要同經理講。 | duplicate | same example listed twice | Could I speak to the manager, please? | 唔該，我想搵經理。 |
| transfer-verb e3 | I forgot to transfer yesterday. | 我琴日唔記得轉駁。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| message-noun | gloss 蛋糕上嘅字; examples only about cake text; deck = work | — | vocab sense | card restricts "message" to cake writing, but the work deck and W1 use it for a phone message (留口訊) | add sense: Can I take a message? | 使唔使留口訊？ |
| message-noun e1 | The message on the cake says Happy birthday Mei. | … | punctuation / spelling | the written message needs quotes and capitals | The message on the cake says "Happy Birthday, Mei." | — |
| callback-noun e3 | Please detach the callback before washing. | 洗之前請拆低覆電。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Glenn asked about the cold behind the green plant on Friday."). | replace with a real usage sentence (or delete) | — |
| available-adj e3 | Is the table too available for four? | 張枱對四個人會唔會太有空？ | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| line-noun e3 | We keep every line in the back room. | 每件線路我哋都收喺後倉。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| extension-noun e3 | We vacuum-sealed the spare extension. | 備用內線我哋抽真空封好。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| spelling-noun e3 | A tourist asked about our rare spelling. | 有遊客問我哋稀有嘅串法。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| regarding-prep e3 | Stand regarding the yellow line. | 請企喺黃線關於。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| convenient-adj e3 | Keep the instructions convenient. | 指示請保持方便。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| reach-verb e3 | I forgot to reach yesterday. | 我琴日唔記得聯絡到。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| following-up-phrase e3 | I fastened the following up with both hands. | 我用雙手扣好跟進。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| attached-adj m2 | Did the email go out with the notes attached? → "Sure. I will adjust it." | 得，我調一調。 | scene logic | reply doesn't answer the question | Yes, the notes are attached. | 有，筆記已經附咗。 |
| attached-adj e3 | Please stay attached at the gate. | 喺閘口請保持附上。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| clarify-verb e3 | We cannot clarify without ID. | 冇證件唔可以講清楚。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please, Eclorify the Clorify form carefully."). | replace with a real usage sentence (or delete) | — |
| deadline-noun e3 | We refused a cracked deadline return. | 裂咗嘅期限我哋唔收退貨。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| propose-verb e3 | We propose together to save time. | 為咗慳時間我哋一齊提議。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| best-regards-phrase e3 | Please confirm the best regards serial number. | 請核對祝好序號。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| update-noun e3 | The update comes with a care card. | 呢個更新連護理卡一齊。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| mute-verb U | mute 係收細個咪 | — | gloss | mute = 靜音／熄咪, not 「收細」 (turn down) | — | mute 係將個咪靜音。 |
| mute-verb e3 | Please mute only once per visit. | 每次嚟淨係可以靜音一次。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| agree-verb m1 | Can I agree while you watch the bags? | 你睇住行李，我可唔可以去同意？ | nonsense sentence | template mini-dialogue | I agree with you. | 我同意。 |
| agree-verb e3 | They let guests agree after nine. | 九點之後都畀客同意。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please agree, the Agree form carefully."). | replace with a real usage sentence (or delete) | — |
| action-item-noun e3 | The action item comes with a care card. | 呢個行動項連護理卡一齊。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| weekend-noun e1 | The weekend was busy, and Saturday stayed bright. | 週末好忙，星期六仍然好晴。 | glued clauses | two unrelated clauses joined with "and" | My weekend was busy. Saturday was sunny, though. | 週末好忙，不過星期六好天。 |
| weather-noun e1/e2 | The weather was very bright on Saturday morning. | 星期六朝早天氣好晴。 | unnatural | weather is "sunny", not "bright" | The weather was sunny on Saturday morning. | 星期六朝早好好天。 |
| resolve-verb e3 | Do we resolve here or upstairs? | 我哋喺呢度定上樓解決？ | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please resolve the resolve form carefully."). | replace with a real usage sentence (or delete) | — |
| shift-noun e3 | The night shift logged a missing shift. | 夜更記低唔見咗一個更。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the shift beside the shift tray."). | replace with a real usage sentence (or delete) | — |
| currently-adv e3 | He drives currently in the rain. | 落雨佢會而家揸車。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| strength-noun e3 | In the interview, talk about your strength. | 面試嗰陣講吓你嘅強項。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please check the strength beside the strength tray." | re-render the clip from the current text (after fixing the sentence) | — |
| doctors-note-phrase e3 | Please rate the doctor's note from one to ten. | 請用一到十分講醫生紙幾嚴重。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please check the inductor in beside the darkest tray." | re-render the clip from the current text (after fixing the sentence) | — |
| follow-up-verb e3 | Please follow up and then wait outside. | 請跟進完出面等。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("They fall up a short note on the car."). | replace with a real usage sentence (or delete) | — |
| meeting-noun e3 | Send the meeting before tomorrow's meeting. | 聽日開會前請將會議傳過嚟。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| stakeholder-noun e2/m2 | Please keep this stakeholder with your documents. | 請將呢個持份者同文件一齊收好。 | nonsense sentence | template slot-fill (a stakeholder is a person) | Each stakeholder should read the note before Monday. | 每個持份者星期一前都要睇張便條。 |
| stakeholder-noun e2 | Please keep this stakeholder with your documents. | 請將呢個持份者同文件一齊收好。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |

### Deck: daily ｜ 日常生活

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| symptom-noun e3 | We postponed the symptom shipment. | 我哋延遲咗症狀出貨。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| fever-noun e3 | This fever started on Monday. | 呢個發燒星期一起。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please check that fever beside the fever tray." | re-render the clip from the current text (after fixing the sentence) | — |
| cough-noun e3 | May I leave a deposit for the cough? | 可唔可以留訂金訂呢個咳嗽？ | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the cuff beside the cuff tray."). | replace with a real usage sentence (or delete) | — |
| sore-throat-noun e3 | This sore throat started on Monday. | 呢個喉嚨痛星期一起。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please check the Nisser Afroop beside the sore tray." | re-render the clip from the current text (after fixing the sentence) | — |
| headache-noun e3 | Bright light makes my headache worse. | 猛光會令我頭痛嚴重啲。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please check the headache beside the headache tray." | re-render the clip from the current text (after fixing the sentence) | — |
| prescription-noun e3 | Describe your prescription to the nurse first. | 先同護士講你嘅藥單。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the prescription beside the prescription tray."). | replace with a real usage sentence (or delete) | — |
| pharmacy-noun e3 | Describe your pharmacy to the nurse first. | 先同護士講你嘅藥房。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the pharmacy beside the pharmacy tray."). | replace with a real usage sentence (or delete) | — |
| account-noun e3 | I checked the account in the banking app. | 我喺銀行 app 睇過戶口。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Paul asked about the account near the front door on Monday." | re-render the clip from the current text (after fixing the sentence) | — |
| balance-noun e3 | Please avoid perfume on the balance. | 請唔好將香水噴落餘額。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| deposit-verb m1 | Did you deposit already? | 你存入咗未？ | grammar | deposit needs an object; "already" placement | Have you deposited the cash yet? | 你存咗啲錢未？ |
| blocked-adj e3 | The queue looked blocked after lunch. | 晏晝之後條隊睇落好凍結咗。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| branch-noun e3 | I traced the branch to aisle four. | 我喺第四巷搵到分行。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| fee-noun e3 | Please avoid perfume on the fee. | 請唔好將香水噴落費用。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| form-noun e3 | Please shade the form from direct sun. | 請遮住表格唔好畀猛日光晒到。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| rent-noun e1 | How much is the monthly rent please? | 請問月租幾多？ | punctuation / spelling | missing comma before "please" | How much is the monthly rent, please? | — |
| rent-noun e3 | I am looking for a rent for a gift. | 我搵緊送禮用嘅租金。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| lease-noun e3 | The lease lists the monthly lease. | 租約寫咗每月租約。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("V-era asked about the lease under the red lump on Monday."). | replace with a real usage sentence (or delete) | — |
| utilities-noun e3 | We replaced the broken utilities for free. | 我哋免費換咗壞咗嘅水電。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| furnished-adj e3 | Please stay furnished at the gate. | 喺閘口請保持有傢俬。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| viewing-noun e3 | The viewing warranty excludes water damage. | 呢個睇樓保養唔包浸水。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| contract-noun e3 | The night shift logged a missing contract. | 夜更記低唔見咗一個合約。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| notice-noun e3 | The night shift logged a missing notice. | 夜更記低唔見咗一個通知期。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| agency-noun e3 | Please detach the agency before washing. | 洗之前請拆低代理。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| deposit-noun e3 | The demo deposit cannot leave the shop. | 示範用嘅按金唔可以帶出舖。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| from-prep m1 | Is this train from Airport? | 呢班車係咪機場開？ | grammar | missing article | Is this train from the airport? | — |
| from-prep e3 | I need from receipt for accounts. | 會計要來自收據。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("We met from the gate."). | replace with a real usage sentence (or delete) | — |
| job-noun e1 (+m1) | My job is salesperson at this shop. | 我嘅工作係呢間舖嘅售貨員。 | grammar | missing article | I'm a salesperson at this shop. | 我喺呢間舖做售貨員。 |
| phone-noun e1 / number-noun e1 (+m1) | My phone number is ready for you. | 我嘅電話號碼準備好畀你。 | unnatural | numbers aren't "ready" | Here's my phone number. | 呢個係我電話號碼。 |
| phone-noun e3 | This phone needs a new phone. | 呢部電話要換新電話。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| email-noun e3 | Please CC me on the email. | 請將電郵抄送畀我。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please check the email beside the email tray." | re-render the clip from the current text (after fixing the sentence) | — |
| tourist-noun e3 | A tourist asked about our rare tourist. | 有遊客問我哋稀有嘅遊客。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the tourists beside the tourist tray."). | replace with a real usage sentence (or delete) | — |
| macau-noun e2 | She is from Macau, not from the shop. | 佢來自澳門，唔係舖頭嗰邊。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| wake-up-verb e3 | Do we wake up here or upstairs? | 我哋喺呢度定上樓起身？ | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| finish-verb e3 | He will finish if the price drops. | 減咗價佢先會做完。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| lunch-noun e3 | Guests often skip the lunch topping. | 好多客會唔要午餐配料。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| open-verb e3 / always-adv e3 / traffic / report | We usually open at the front desk. / Please walk always near the glass. | 我哋一般喺前台打開；開門。/ 喺玻璃隔籬請每次；一定行。 | gloss | raw card gloss (「打開；開門」「每次；一定」) pasted into sentence glosses | — | — |
| open-verb e3 | We usually open at the front desk. | 我哋一般喺前台打開；開門。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| usually-adv e3 | Please walk usually near the glass. | 喺玻璃隔籬請通常行。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| always-adv e3 | Please walk always near the glass. | 喺玻璃隔籬請每次；一定行。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| after-prep e3 | I need after receipt for accounts. | 會計要之後收據。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please put the form after the barks."). | replace with a real usage sentence (or delete) | — |
| then-adv e3 | Please write then on the top line. | 請喺最上線然後寫。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| activate-verb e3 | Please activate the smaller option. | 請開通細啲嗰個選擇。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Please activate the activate form carefully." | re-render the clip from the current text (after fixing the sentence) | — |
| enough-adv e3 | Please write enough on the top line. | 請喺最上線夠寫。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| pharmacist-noun e3 | The doctor asked when the pharmacist began. | 醫生問藥劑師幾時開始。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Please check the Affirmices beside the Pharmacist tray."). | replace with a real usage sentence (or delete) | — |
| tablet-noun e3 | The doctor asked when the tablet began. | 醫生問藥片幾時開始。 | nonsense sentence + stale audio | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical Audio is also stale: the clip plays a different sentence ("Hugh asked about the tablet inside the blue tray after six."). | replace with a real usage sentence (or delete) | — |
| wash-verb m1/m2 / reserve-verb m1 | Did security ask you to wash? / Yes. They checked my bag too. | 保安有冇叫你洗？ | nonsense sentence | same template mini-dialogue reused across unrelated cards | Can you wash my hair first? / Sure, this way. | 可唔可以幫我洗頭先？ |
| freeze-verb e3 | She wants to freeze a quieter table. | 佢想凍結靜啲嘅枱。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |
| toothache-noun e3 | Please rate the toothache from one to ten. | 請用一到十分講牙痛幾嚴重。 | audio ≠ text (stale clip) | the clip plays an older, different template sentence. base.en heard: "Iris asked about the toothache inside the blue trait 10." | re-render the clip from the current text (after fixing the sentence) | — |
| sign-verb e3 | Please sign the smaller option. | 請簽名細啲嗰個選擇。 | nonsense sentence | auto-generated slot-fill: the headword is dropped into an unrelated template, so the sentence is meaningless or ungrammatical | replace with a real usage sentence (or delete) | — |

### Cards not in any deck (used by lessons / foundation)

| id | current English | current gloss | category | problem | suggested English | suggested 廣東話 |
|---|---|---|---|---|---|---|
| wind-verb E | Wind the clock tonight. | 今晚記得上鐘。 | gloss | 「上鐘」 is HK slang for a massage/sex-work session; "wind a clock" is 上鍊／上發條 | Wind the clock tonight. | 今晚記得幫個鐘上鍊。 |
| close-adj E | A close friend is here. | 有個好朋友喺度。 | unnatural | stiff textbook sentence | My best friend lives close to here. | 我好朋友住喺附近。 |
| long-adj m2 | I can. That long vowel glides out. | 得。嗰個長音會滑出去。 | pronunciation | /i/ in sheep is a long monophthong; it does not "glide out" | I can. That long vowel stays steady. | 得。長音要拉長，唔好變。 |
| ship-noun / sheep-noun c | collocations "a short ship", "a long sheep" | — | word choice | nonsense collocations (the sound length is not a property of the ship/sheep) | a big ship / a flock of sheep | — |
| smile-verb E | Smile a little. | 嘴角微微展開。 | gloss | gloss describes mouth position, not "smile" | Smile a little. | 笑一笑。 |
| name-noun E | My name is Mei. | 我叫 Mei，好高興認識你。 | gloss | gloss adds a clause ("nice to meet you") not in the English | — | 我叫 Mei。 |
| beat-verb | gloss 拍子；打拍 (verb card); E "Beat is long."; m "Can you beat the eggs for me?" | — | vocab sense | card gloss (rhythm), example (vowel length) and mini-dialogue (whisk eggs) are three different senses | pick one sense: Can you beat the eggs? | 可唔可以幫我打蛋？ |
| morning-noun m2 | This morning's van brought it. | 今朝貨車送到。 | grammar | fragment with no context; reply to "Good morning." | Good morning. How are you? | 早晨，你好嗎？ |
| evening-noun m | Good evening. Your booking is ready. | 夜晚好。… | gloss | 「夜晚好」 is not colloquial Cantonese (calque of 晚上好); "your booking is ready" is odd for a greeting | Good evening. Do you have a booking? | 你好，有冇訂位？ |
| on-prep m2 | Yes. You are on row three. | 有，你喺第三行。 | grammar | seating rows take "in" | Yes. You're in row three. | 有，你喺第三行。 |
| do-verb m2 | Do the form at desk two. | 去二號櫃位填表。 | unnatural | do the form isn't said | Fill in the form at desk two. | 去二號櫃位填表。 |
| what-det N | 「Wiktionary 美式亦列 /wɔt/、/wɑnt/ 一類元音」 | — | pronunciation | /wɑnt/ is "want"; the variant meant is /wɑt/ | … /wɔt/、/wɑt/ … | — |
| something-pron m1/m2 | Could you help me choose something for my wife? / This scarf is something she can wear daily. | …揀某樣嘢送畀太太？ / …係某樣實用嘅嘢。 | gloss | 「某樣嘢」 is a literal calque, not natural Cantonese; m2 gloss adds 「係某樣實用嘅嘢」 | — | 可唔可以幫我揀份嘢送畀太太？ / 呢條頸巾佢日日都戴得。 |
| course-noun | gloss 當然 for noun "course" | — | vocab sense | course alone does not mean 當然; only "of course" does | card = "of course" (phrase) | 當然 |
| check-verb m1 | Shall I check on the tablet? | 要唔要喺平板辦理？ | grammar | check on ≠ check in | Shall I check in on the tablet? | 使唔使喺平板辦登機？ |
| right-adv gloss | gloss 就係咁；右邊 | — | gloss | 「就係咁」 means "that's it"; "right (this way)" = 正正／就喺／呢邊 | — | 正正；右邊 |
| red-adj m2 | I found the red one. It is a color, not led. | …呢個係顏色，唔係 led。 | unnatural | meta nonsense; "color" (US) in a UK-spelling deck | I found the red one. | 我搵到紅色嗰張。 |
| left-adv m2 | Look for the green cross on the sign. | 我搵綠色十字個招牌。 | gloss | imperative rendered as "I look for"; subject wrong | — | 搵個有綠色十字嘅招牌。 |
| how-adv m1 | Did you lock the door how? | 你有冇點樣鎖門？ | grammar | ungrammatical question | How did you lock the door? | 你點樣鎖門㗎？ |
| fine-adj m1 | Are you fine after standing all morning? | 企咗成朝，你仲好唔好？ | unnatural | Are you fine isn't idiomatic | Are you OK after standing all morning? | 企咗成朝，你冇事嘛？ |
