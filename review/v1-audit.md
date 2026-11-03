# English Quest v1.0: milestone audit

| | |
|---|---|
| Repo / tag | `penny323mo/english-quest` @ `v1.0` = `4440f2ec` (main) |
| Live | https://penny323mo.github.io/english-quest/ (the live `index.html` carries the same `eq-source` hash, `5881e57d…`, and the same `assets/index-uTwk0hIv.js` as a local build of v1.0) |
| Audit date | 2026-11-03 |
| Scope | Build and tests · every dialogue line and every quiz-type item in all 97 shipped lessons · update and cache safety · 390 px UX · code health |
| Code changed | None. This file is the only output. |

## Verdict: **not ready**

Technically the app is in good shape. Build, typecheck and unit tests pass, CI (including WebKit e2e) is green on the tagged commit, the deployed bundle is exactly v1.0, and Chromium e2e reproduces the safe old-SW-to-new-SW migration with progress intact.

The product is the content, though, and the content does not meet a v1.0 bar:

- **Offensive gloss.** The 「叫雞」 rendering of "order chicken" is common HK/Macau slang for hiring a sex worker. It is printed 11 times, once in a dialogue gloss.
- **Wrong answer keys.** At least 20 quiz items are keyed wrong, so a correct learner is marked wrong (e.g. T3 says "double" = 雙床; R2 says "Can I have some water…" = 推薦).
- **Factual errors.** Examples: pearl care in the J17 can-do and chunk; HK/Macau sales-tax refunds in J6/J7; a souvenir shop stamping refund forms in T7.
- **Contradictions.** In T8 the traveller says "I'm here for tourism" and then "I'm not here on holiday".
- **Incoherent lessons.** The six B2 lessons T20, J23, R17, W14, W15 and J24 are keyword-stuffed and need rewriting rather than line fixes.
- **Generator defects that affect every lesson.**
  - 32 build-order targets that are not sentences ("sure what", "let check").
  - 52 roleplay keywords that can never be hit.
  - 90 chunk patterns whose revealed example is a different sentence.
  - 75 "topic-only" understand items, many keyed to a rotating, wrong label.

It is already live, so fix the P0 list (content-only, no code risk) and re-tag as v1.0.1. After that, the verdict becomes **ship with fixes**.

---

## 1. Build and tests

| Step | Command | Result |
|---|---|---|
| Install | `npm ci` | OK |
| Typecheck | `npm run typecheck` | **pass** (note: `web/src/sw.ts` is excluded by `tsconfig.json:20`, so the service worker is never type-checked) |
| Build | `npm run build` | **pass**, with a warning: `dist/assets/shell-Bg_B3emO.js 2,593.13 kB │ gzip: 614.99 kB`. SW `precache 8613 entries (181127.30 KiB)`, `dist/sw.js` = 842,939 bytes |
| Build provenance | `node scripts/verify-build.mjs` | `build matches current source and content` |
| Unit tests | `npm test` | `# tests 92 # pass 91 # fail 0 # skipped 1` (skipped: `piper phoneme check: Piper python is missing`) |
| Learner name | `node --test tests/learner-name.mjs` | `pass 1 fail 0` |
| Content correctness | `node --test tests/content-correctness.mjs` | `pass 3 fail 0` |
| e2e, as committed | `node e2e/*.mjs` | **could not run here**: the repo's Playwright 1.64.1 expects `chromium`/`webkit-2370` builds that this sandbox doesn't have (`Executable doesn't exist at /opt/pw-browsers/webkit-2370/pw_run.sh`), and installing browsers is disallowed in this environment |
| e2e, Chromium | scratch copies of the e2e scripts launched with the preinstalled Chromium (repo files untouched) | `full-lesson`: `audio {"play":36,"playOk":36}` → **ok** · `migrate chromium-light`: `migrate reloads 1` → **ok** · `migrate chromium-dark`: `reloads 1` → **ok** · `oldest chromium` → **ok** (one expected 404 logged) · `run` (390 px screenshots, old→new) → **ok** |
| e2e, WebKit | — | Not runnable locally. **CI run 41557536045 on `4440f2ec` = success**; it runs `run.mjs`, `migrate.mjs`, `fresh-safari.mjs`, `oldest.mjs` and `full-lesson.mjs` in WebKit and Chromium |

Harness bug found while running: `node e2e/migrate.mjs chromium` matches no job (the filter expects `chromium-light`), runs nothing and still prints `migrate ok` (`e2e/migrate.mjs:372-377`). See P2-12.

**What passing tests don't cover:** none of the suites check grammar, scene logic, gloss/English agreement, answer-key validity, roleplay keyword presence, or whether chunk patterns match their examples. Every content issue below passes CI.

---

## 2. Content quality

### 2.1 Method

I printed every lesson in path order (`SHIPPED` in `web/src/data.ts`) and read each one in full: dialogue (EN · gloss · `say`), understand, chunks, shadow, build, roleplay turns, and quiz, with keys marked. Each finding points to a specific line or item. I then ran mechanical scans across all lessons to count the defects that repeat everywhere (2.3).

### 2.2 Counts

| | Count |
|---|---|
| Lessons read | 97 / 97 |
| Dialogue lines read | 740 |
| Understand items | 291 |
| Chunk items | 326 |
| Build items (choice + order) | 194 |
| Roleplay turns | 291 |
| Quiz items | 487 |
| **Total items read** | **2,329** |
| Rows in the issue table (2.4) | 291 (several rows are "GLOBAL" or whole-lesson rows that cover many items) |
| Distinct dialogue line ids flagged | **195 of 740 (26%)** |

Issue-table rows by category:

| Category | Rows |
|---|---|
| Scene logic (wrong order, contradiction, wrong speaker, facts) | 90 |
| Unnatural English | 77 |
| Answer key / quiz construction | 46 (20 are confirmed **wrong keys**) |
| Gloss (meaning, clause count, subject, register) | 23 |
| Grammar | 19 |
| Mismatch (quiz/chunk/shadow tests text the lesson never teaches) | 14 |
| Unrelated clauses glued with and/so/because | 12 line rows (plus 151 lines that match `, and / , so / , because`; see 2.3) |
| Punctuation / spelling | 8 |
| Level | 2 |

### 2.3 Systemic defects (mechanical scan, all 97 lessons)

| Defect | Count | Example |
|---|---|---|
| Build-order target is a fragment (< 3 tokens or a lowercase start) | 32 | R13 "sure what", W11 "let check", D12 "i'd like", T21 "could you please check" (not in the lesson at all) |
| Roleplay keyword not present in the expected reply (so the learner can never score 2/2) | 52 | R4 `enjoy`, J9 `apologize` + `understand`, W2 `propose` + `confirm` |
| Chunk pattern with its answer filled in ≠ the revealed example | 90 | D6 C1 "one small tablet ___ a day for five days" → example "one tablet twice a day" |
| Understand items whose choices are only 「關於X / 講緊Y / 唔係Z」 topic labels | 75 | many keyed to a label that rotates regardless of the sentence (J18, R12, R11, D11, W10, W11, T14, T15, J16) |
| Build B0 prompt 「你想用呢課嘅講法。你點講？」 / 「你點講？」 with no situation, so any choice is valid | 27 | T17, R13, J18, J20, T15 … |
| Quiz prompts in English inside an A1–B1 Cantonese-UI lesson | 132 items | R10, D7, T11, T13, J15 … |
| Quiz prompt 「客人講「…」」 where the speaker is often staff | 54 items in 27 lessons | T2 Q2/Q3 (security officer), J3 Q3 (Mei) |
| Listen-quiz lemma that never appears in the dialogue | 22 | T3 `floor`, R3 `shellfish`, T12 `early check in`, R12 `party of` |
| Dialogue lines containing `, and` / `, so` / `, because` (indicator only; many are fine, the bad ones are in 2.4) | 151 | t11-l2, d5-l4, t4-l3 |
| Filler distractors copied from other lessons ("shirt / meter", "Friday / receipt", 「窗 / 鐘 / 鞋」, "towel / oyster", "read / live") | ~10 lessons | T20, J23, R17, W14, W15, J24, T21, J22, T19, R16 |
| Mandarin wording in glosses | **low**: no 是/的/這/們/沒 in colloquial glosses. Written-register phrases appear: 「維持不變」 (d3-l5, j23-l8, t16-l8), 「從不」 (F6 Q2), 「為不便道歉」 (J9 U0, T6), 「在職」 (W6 Q2), 「商店」 (t2-l5), 「冰拿鐵」 (R10 C1). | |
| Hard-coded learner name | **none**: no `阿琳` in content, and learner turns use `{{learner}}`. (When the profile name is Chinese, English TTS and `{{learner-spell}}` will read or spell Chinese characters; see P2-9.) | |
| British vs US spelling mixed | throughout | jewellery/colour/labour/harbour (r8) vs harbor (t3, w1, t19)/color (t7, J19 quiz)/center/elevator |

### 2.4 Content issue table

Rows are in path order; GLOBAL rows come first. "—" means not applicable (quiz-item rows have no gloss).

| # | line id | current English | current gloss | category | problem | suggested rewrite (EN / 廣東話) |
|---|---|---|---|---|---|---|
| 1 | GLOBAL 叫雞 (11 occurrences: r3-l1 gloss + 10 quiz/build/understand items in r2, r3, r8, t2, t3, j5, j7) | I'd like the chicken glossed/distractor as 「我想叫雞」 | 我想叫雞 | gloss | gloss/register: 「叫雞」 is common HK/Macau slang for hiring a sex worker; a learner app must not print it  | — / 「我想要雞肉」/「我想點雞」/「我要個雞」 |
| 2 | GLOBAL 客人講「…」 (54 items in 27 lessons) | Quiz meaning prompts all say 客人講「…」 | — | answer key / quiz | speaker error: many quoted lines are said by staff (e.g. T2 Q2/Q3 security officer, J3 Q3 Mei); also the keyed answer is a single noun for a whole sentence (J3 Q2 手鏈, T2 Q2 膠盤) | use 「佢講…」 or name the speaker; ask about the word, not the sentence |
| 3 | GLOBAL English quiz prompts (R10, D7, …) | Listen once and pick…, "What does X mean?" | — | level | level/UI: A1–A2 quiz prompts in English while every other lesson uses Cantonese | translate prompts to 廣東話 |
| 4 | GLOBAL spelling | jewellery/colour (UK) vs harbor/elevator/store (US) | — | punctuation/spelling | inconsistent spelling standard in an "American accent" app | pick one (US: jewelry, color) or document UK spelling |
| 5 | GLOBAL B0 「你想用呢課嘅講法。你點講？」 (T17,R13,J18,J20,T15,…) | — | — | answer key / quiz | key: prompt gives no situation, every choice is a lesson line, so the key is arbitrary | write a situation per item |
| 6 | GLOBAL C patterns (D6,J15,T12,T13,…) | shown pattern ≠ revealed example sentence | — | mismatch | mismatch: learner fills a blank in one sentence, then sees a different sentence | regenerate example from pattern |
| 7 | GLOBAL junk distractors (T20,J23,R17,W14,W15,J24,T21,J22,T19,J13) | choices "shirt / meter", "Friday / receipt", "窗 / 鐘 / 鞋", "手鏈 / 登機證", "towel / oyster", "read / live" | — | answer key / quiz | quiz quality: filler distractors from unrelated lessons make every item trivially guessable | draw distractors from the same lesson |
| 8 | f2-l5 + F2 RP3 | Hi. Please say it again for me. (RP expects "Thank you.") | 哈囉。請你再同我講一次。 | scene-logic | scene-logic: "Hi" at the end of a finished greeting; RP turn asks learner to repeat but the expected reply is "Thank you." (non-sequitur) | Great. Can you say your name once more? / 好。你可唔可以再講多次你個名？ |
| 9 | F3 RP2 | What time is it, please? -> EXPECT "Yes, it's three o'clock." | — | grammar | grammar: "Yes," answers a wh-question | It's three o'clock. / 而家三點。 |
| 10 | f3-l2 | This is ten dollars. | 呢個係十蚊。 | unnatural | naturalness: price answer is "It's ten dollars." | It's ten dollars. / 十蚊。 |
| 11 | f4-l1 | Excuse me, can you help me here please? | 唔該，可唔可以喺呢度幫我？ | punctuation/spelling | punctuation: missing comma before "please"; "here" padding | Excuse me, can you help me, please? / 唔該，可唔可以幫一幫我？ |
| 12 | f4-l4 | Thank you for saying that to me. | 多謝你咁講。 | unnatural | naturalness: not what a native says after "please don't worry" | Thanks for understanding. / 多謝你體諒。 |
| 13 | f4-l5 | You're welcome. Good night, and sleep well. | 唔使客氣。晚安，好好瞓。 | scene-logic | scene-logic: shop/door scene ends with "sleep well" | You're welcome. Have a good night. / 唔使客氣。晚安。 |
| 14 | f5-l4 | My number is five five one two, and here is my email. | 我號碼係五五一二，電郵喺呢度。 | glued clauses | glued clauses with "and"; 4-digit phone number is unrealistic for HK/Macau (8 digits) | My number is 6123 4567. And here's my email. / 我電話係 6123 4567。呢個係我電郵。 |
| 15 | F5 C2 | My phone number is ready. | 我嘅電話⋯⋯準備好。 | unnatural | unnatural English; gloss is broken Cantonese | Here's my phone number. / 呢個係我電話號碼。 |
| 16 | F5 Q5 | 邊句係講自己住邊？ key = "Where are you from?" | — | answer key / quiz | wrong key: the keyed answer is a question, not a sentence about where you live; explain mentions "live" which is absent | key -> "I'm from Hong Kong, and I live here now." |
| 17 | j1-l1 / J1 SH | Welcome to our jewellery store. (shadow hint: "...jewellery shop...") | 歡迎嚟我哋珠寶店。 | mismatch | shadow hint text ≠ line text/audio (store vs shop); karaoke & keyword check use the hint | Make the hint match: "Welcome to our jewellery store. How can I help you today?" |
| 18 | J1 U1/C1/B1 | How may I help you (today)? | 今日有咩可以幫到你？ | mismatch | quiz/chunk/order use "may" but the taught line and audio say "can" | Use "How can I help you today?" everywhere, or change j1-l1 to "may" |
| 19 | r1-l3/r1-l4 | Right this way. Would you like a table by the window? → "Thank you. This is great." | 請跟我嚟。想唔想坐靠窗？ / 多謝。好好。 | scene-logic | scene-logic: yes/no question never answered | r1-l4: Yes, please. The window is great. / 好呀，唔該。靠窗好好。 |
| 20 | R1 U2 explain | right 呢度係「就係咁邊」 | — | gloss | gloss: 「就係咁邊」 is not idiomatic Cantonese | right this way ＝「呢邊請」 |
| 21 | f6-l4 | I sometimes take a short break, but I never stay long. | 我有時休息一陣，但唔會留好耐。 | unnatural | naturalness: "stay long" doesn't fit a break | I sometimes take a short break, but never for long. / 我有時會小休一陣，但唔會休息好耐。 |
| 22 | f6-l5 | We open before lunch and close after lunch. | 我哋午餐之前開舖，午餐之後關門。 | scene-logic | scene-logic: a shop closing right after lunch; reads as "closes for the day at 2pm" | We open at ten and close at eight. / 我哋十點開舖，八點關門。 |
| 23 | F6 B0 | Mei 問你朝早點。你點答？ key = "What time do you usually start here?" | — | answer key / quiz | wrong key: keyed answer is Mei's question; explain is about "usually wake up" | key -> "I usually wake up early, then I start my shift." |
| 24 | j2-l3 / J2 B0, RP1, U1 | We have a nice ring. (B0/RP key: "We have a very nice ring.") | 我哋有一隻好靚嘅戒指。 | mismatch | mismatch: the /v/ lesson's dialogue never says "very"; U1/B0/RP test "very" that the learner never heard | j2-l3: We have a very nice silver ring. Would you like to see it? / 我哋有一隻好靚嘅銀戒指。想唔想睇吓？ |
| 25 | r10-l1 | Good morning, I would like a latte, please. | 早晨，我想要一杯拿鐵。 | punctuation/spelling | punctuation: comma splice; gloss drops "please" | Good morning. I'd like a latte, please. / 早晨。我想要杯拿鐵，唔該。 |
| 26 | r10-l2 | Hot or iced for that latte? | 呢杯拿鐵你想要熱定凍？ | unnatural | naturalness: a barista says "Hot or iced?" | Hot or iced? / 要熱定凍？ |
| 27 | r10-l5 | Yes, oat milk, please. The name is Cleo. | 好，燕麥奶唔該。個名係 Cleo。 | scene-logic | scene-logic: name given before barista asks for it | (add barista line) Can I get a name for the cup? → It's Cleo. / 杯面寫咩名？→ Cleo。 |
| 28 | r10-l7 | To go, please. Keep the small size for me, thanks. | 拎走，唔該。幫我保持細杯，多謝。 | unnatural | naturalness + gloss: "keep the small size" is not said; 「保持細杯」 is a literal calque | To go, please. Thanks. / 拎走，唔該。 |
| 29 | R10 C1 | Would you like oat milk in the iced latte? | 冰拿鐵要唔要燕麥奶？ | gloss | gloss inconsistent: 冰拿鐵 here, 凍拿鐵 elsewhere; 凍 is the colloquial HK form | — / 凍拿鐵要唔要燕麥奶？ |
| 30 | R10 B1 | ORDER tokens Iced / please / small / size | — | grammar | ungrammatical target sentence "Iced please small size" | tokens: A / small / iced / latte / please → "A small iced latte, please" |
| 31 | R10 B0 | 你要凍拿鐵，用燕麥奶 key "Yes, please use oat milk, and put the name Cleo on the cup." | — | answer key / quiz | key: answer isn't a taught line; distractor "Iced, please…" also fits the prompt | — |
| 32 | R10 Q2 | What does oat milk mean? key 燕麥 | — | answer key / quiz | key: oat milk = 燕麥奶, not 燕麥 | key -> 燕麥奶 |
| 33 | d4-l2 | The prepaid plan is much cheaper, and the coverage is enough. | 預繳計劃平好多，覆蓋都夠。 | unnatural | naturalness: "coverage is enough" | The prepaid plan is much cheaper, and the coverage is good. / 預繳計劃平好多，網絡覆蓋都夠用。 |
| 34 | d4-l4 | Please activate the new SIM card with your valid passport. | 請用你本有效護照開通呢張新電話卡。 | unnatural | naturalness: staff do the activation; English is stilted | I'll need your passport to activate the SIM card. / 開通張卡要睇吓你本護照。 |
| 35 | d4-l5 | Is the unlimited plan locked on a long mobile contract? | 無限計劃係咪綁一份長手機合約？ | grammar | grammar ("locked into") + scene order: asked after the customer already chose prepaid | Before I decide: does the unlimited plan need a long contract? / 決定之前想問：無限計劃係咪要簽長約？ |
| 36 | d4-l6 | A small top-up is enough if that plan stays cheap. | 如果嗰個計劃平，小小增值就夠。 | scene-logic | scene-logic: does not answer the contract question; meaning unclear | Yes, it's a 12-month contract. With prepaid, you just top up. / 係，要簽十二個月。預繳就增值就得。 |
| 37 | d4-l7 | I'll pay for this prepaid SIM card here. | 我喺呢度畀錢買呢張預繳電話卡。 | scene-logic | scene order: paying comes after activation (l4) | move before l4 |
| 38 | D4 B0 | Mina 問你要邊個計劃 key "Please activate the new SIM card with your valid passport." | — | answer key / quiz | wrong key: keyed answer is Mina's line; explain says "I'll take…" | key -> "I'll take the prepaid one. I don't need unlimited data." |
| 39 | D4 RP2 | Mina: activate with passport → EXPECT "Is the unlimited plan locked on a long mobile contract?" | — | scene-logic | scene: non-sequitur reply | EXPECT: Sure. Here's my passport. |
| 40 | d5-l4 | It'll take five days, and we need your signature here. | 要五日，我哋需要你喺呢度簽名。 | glued clauses | glued unrelated clauses with "and" | It'll take about five days. Please sign here. / 大約五日到。唔該喺度簽名。 |
| 41 | d5-l6 | Please mark the full weight on the form before we send it. | 寄出之前請喺表格寫明全部重量。 | scene-logic | scene-logic: the clerk weighs the parcel; the customer doesn't mark weight | Please write what's inside on the form. / 請喺表格寫低入面有咩。 |
| 42 | d5-l7 | May I keep this receipt until the parcel reaches my home? | 包裹送到我屋企之前，我可唔可以留住收據？ | scene-logic | scene-logic: the parcel is going away to a destination, not to the sender's home | Should I keep this receipt until it arrives? / 我係咪要留住收據，等到寄到為止？ |
| 43 | d5-l8 | Your tracking number is on the receipt. Please add one postage stamp. | 追蹤號碼喺收據上面。請貼一張郵票。 | scene-logic | scene-logic: stamp after payment/receipt for an airmail parcel | Your tracking number is on the receipt. / 追蹤號碼喺收據上面。 |
| 44 | d5-l3 | How long will this small parcel take to reach the destination? | 呢個細包裹要幾耐先到目的地？ | unnatural | naturalness: stilted | How long will it take to get there? / 要幾耐先寄到？ |
| 45 | D5 RP1 / B0 | Cole: fill in form → EXPECT "I would like to send this small parcel by airmail."; B0 "問你要寄去邊" key doesn't say where | — | scene-logic | scene order reversed in RP; B0 key doesn't answer "where" | — |
| 46 | d7-l1 | I would like a simple trim, and keep a light fringe. | 我想簡單修剪，留一個薄瀏海。 | grammar | grammar: broken parallelism ("I would like … and keep …") | I'd like a simple trim, and please keep my fringe light. / 我想簡單修一修，瀏海留薄啲。 |
| 47 | d7-l3 | Yes, please make both sides shorter for this trim. | 好，兩邊剪短，呢次係剪髮。 | gloss | gloss: 「呢次係剪髮」 is meaningless filler; English "for this trim" padding | Yes, please make both sides shorter. / 好，兩邊剪短啲，唔該。 |
| 48 | d7-l6 | Is it cheaper if I book my next short visit? | 如果預約下次短剪，會唔會平啲？ | unnatural | naturalness: "short visit" | Is it cheaper if I book my next visit now? / 而家預約下次會唔會平啲？ |
| 49 | d7-l8 | Please book that next short trim for me after the wash. | 洗完之後，請幫我預約下次剪髮。 | unnatural | naturalness/ambiguity: "after the wash" | Please book my next trim for Friday. / 唔該幫我約下個星期五剪。 |
| 50 | D7 C0/C1 | chunk glosses 我想修短少少。/ 價錢包吹乾。 | — | gloss | gloss drops a clause of the two-clause example | full gloss / 我想簡單修一修，留薄瀏海。/ 總共八十蚊，包埋吹乾。 |
| 51 | D7 B0 | 你問價錢包唔包吹乾 key "How much is it if you wash my hair here?" | — | answer key / quiz | key does not ask about blow dry | prompt -> 你想問喺度洗頭幾多錢 |
| 52 | j3-l2 | I like this bracelet, and the clasp is easy to open. | 我鍾意呢隻手鈪，個扣都易開。 | gloss | gloss: 手鈪 (bangle) vs the lesson's 手鏈 (U0 explain, Q2 key) | — / 我鍾意呢條手鏈，個扣都好易開。 |
| 53 | j3-l5 | Of course. This pair is beautiful. I'll show it to you. | 當然。呢對好靚。我畀你睇。 | grammar | grammar: pair of earrings → "show them" | Of course. This pair is beautiful. Let me show you. / 當然。呢對好靚。我攞畀你睇。 |
| 54 | J3 Q2/Q3 | 客人講「Of course. This pair is beautiful…」 key 一對耳環 | — | answer key / quiz | speaker is Mei (staff); sentence never says earrings; whole sentence keyed to a noun | — |
| 55 | J3 C0 | This necklace is beautiful when you wear it out this evening. | 呢條⋯⋯好靚。 | unnatural | naturalness + gloss drops clause | This necklace will look beautiful tonight. / 今晚戴呢條頸鏈一定好靚。 |
| 56 | t2-l5 | Straight ahead. Your gate is on the left, just after the shops. | 直行。閘口就喺商店後面左邊。 | gloss | gloss meaning: "just after" ≠ 「後面」 (behind); 商店 is Mandarin-leaning (舖頭) | — / 直行。過咗啲舖頭，閘口就喺左手邊。 |
| 57 | T2 C1 | Here is my laptop, and I will take it out of the bag. | 我部⋯⋯喺度。 | scene-logic | scene-logic: "here is" before taking it out; gloss drops clause | I'll take my laptop out of the bag. / 我而家將部電腦拎出嚟。 |
| 58 | t17-l3 | Shouldn't the laptop and power bank come out of it? | 部手提電腦同行動電源係咪應該攞出嚟？ | grammar | grammar: "of it" has no antecedent (last noun is the clear liquids bag) | Should I take my laptop and power bank out of my bag? / 我係咪要將手提電腦同尿袋攞出袋？ |
| 59 | t17-l4 | Yes. Take the laptop out and leave the charger. | 係。部電腦攞出嚟，充電器留低。 | scene-logic | scene/fact: ignores the power bank the canDo says must come out; "charger" swaps in a different item | Yes. Take out your laptop and your power bank. / 係。手提電腦同尿袋都要攞出嚟。 |
| 60 | t17-l7 | Thanks. Which way is gate thirty-five by the shuttle? | 多謝。閘口三十五搭接駁車點去？ | unnatural | naturalness: not idiomatic | Thanks. How do I get to gate thirty-five? Is there a shuttle? / 多謝。三十五號閘口點去？有冇接駁車？ |
| 61 | t17-l8 | Take the blue shuttle. It stops beside that far gate. | 搭藍色接駁車。佢停喺遠處嗰個閘口。 | unnatural | naturalness: "that far gate" | Take the blue shuttle. It stops right by gate thirty-five. / 搭藍色接駁車，佢喺三十五號閘口旁邊停。 |
| 62 | T17 B0 | 你想用呢課嘅講法。你點講？ | — | answer key / quiz | key: prompt has no situation; all three choices are lesson lines, so any is "correct" | give a situation: 你想問電腦使唔使攞出嚟 |
| 63 | T17 U0–U2 / Q2–Q3 | answers 關於液體 / 關於電腦 / 關於閘口 | — | level | level: topic-only items test nothing beyond one keyword | ask the meaning of the sentence |
| 64 | t11-l2 | Please stay on the Island line, and it stops at Central. | 請留喺港島線，呢條線會停中環。 | glued clauses | glued + natural: "stay on" (already aboard) doesn't answer "which line from this station"; proper noun is "Island Line" | Take the Island Line. It stops at Central. / 搭港島綫，會停中環。 |
| 65 | t11-l4 | Use exit A, and it's a short walk out to the street. | 用 A 出口，行少少就到街。 | glued clauses | glued with "and" | Use Exit A. It's a short walk from there. / 行 A 出口，出去行兩步就到。 |
| 66 | t11-l7 | How much is a single journey ticket to Central station? | 去中環站一張單程票幾多錢？ | scene-logic | scene-logic: speaker just topped up her Octopus card (l5–l6) and then asks to buy a single-journey ticket | move before l5, or drop |
| 67 | T11 Q4 | Which word has /ɪ/? key exit (choices line / exit / ticket) | — | answer key / quiz | wrong key: "ticket" /ˈtɪkɪt/ also has /ɪ/ → two correct answers | choices: line / exit / train |
| 68 | r2-l1 | What would you like to order from the menu, please? | 你想喺餐牌點咩？ | unnatural | naturalness: padded; servers say "Are you ready to order?" | Are you ready to order? / 可以落單未呀？ |
| 69 | r2-l2 | I'd like the chicken, please, and a small salad with it too. | 我要雞，再加一份小沙律。 | unnatural | naturalness: "with it too" redundant | I'd like the chicken and a small salad, please. / 我要個雞同一份細沙律，唔該。 |
| 70 | r2-l4 | Can I have some water, please, and no ice in the glass? | 可唔可以畀我杯水，唔該，唔好加冰。 | unnatural | naturalness: awkward split; gloss ends a question with 「。」 | Can I have a glass of water, no ice, please? / 唔該畀杯水我，走冰。 |
| 71 | r2-l5 | Anything else besides the water, or is that everything for you? | 除咗水之外仲要咩，定係就咁多？ | unnatural | naturalness: padded; "besides the water" ignores the food order | Anything else, or is that everything? / 仲要唔要其他嘢？定係就咁多？ |
| 72 | R2 Q2 | 客人講「Can I have some water, please, and no ice…」 key 推薦 | — | answer key / quiz | WRONG KEY: sentence asks for water; 推薦 (recommend) is not its meaning; none of 登機證/推薦/訂位 fits | choices: 要杯水，走冰 / 推薦 / 訂位 → key 要杯水，走冰 |
| 73 | R2 C1 | Can I have some water, please, when you have a free moment? | 可唔可以畀我⋯⋯？ | unnatural | naturalness | Can I have some water, please? / 唔該畀啲水我。 |
| 74 | j4-l1 | This gold is authentic, and the stamp is clear on the inside. | 呢件金係正貨，內圈個印好清楚。 | unnatural | naturalness: trade term is "hallmark" | This gold is genuine. You can see the hallmark inside. / 呢件係真金，入面有清楚嘅金印。 |
| 75 | J4 ids | j4-l6 missing (l5 → l7) | — | scene-logic | content gap: line id skipped; check whether a line was dropped | — |
| 76 | J4 RP3 | Tom: I like this jade. → EXPECT "This setting is eighteen-karat gold." | — | scene-logic | scene: non-sequitur reply about gold to a remark about jade | EXPECT: The colour is very even. |
| 77 | J4 Q3 | 客人講「The diamond is shinier than the jade.」 key 玉 | — | answer key / quiz | key: sentence is about the diamond; only one plausible noun offered | — |
| 78 | j5-l3 | This size is a little tight. It pinches when you close your hand. | 呢個碼有啲緊。你握拳嗰陣會夾。 | scene-logic | scene-logic: staff can't feel the pinch; the customer should say it | (Tom) This size is a little tight. It pinches when I close my hand. / 呢個碼有啲緊，握拳嗰陣會夾。 |
| 79 | j5-l7 | How does it feel? | 感覺點？ | scene-logic | scene order: asked after the customer has already said how it feels twice | move to before l6 |
| 80 | J5 RP3 | Tom: It feels a little loose. → EXPECT "Look in the mirror." | — | scene-logic | scene: reply ignores the problem | EXPECT: I can adjust it. |
| 81 | t3-l1 | Do you have a reservation under a name I can find? | 你有冇訂房，我可以搵個名？ | unnatural | naturalness + broken gloss | Do you have a reservation? What name is it under? / 你有冇訂房？用咩名訂㗎？ |
| 82 | t3-m3 | Late checkout is fine. You can leave your bags by the elevator. | 遲退房冇問題。你可以將袋放喺升降機旁邊。 | scene-logic | scene-logic: hotels store bags at the desk, not by the lift | Late checkout is fine. You can leave your bags at the front desk. / 遲退房冇問題，行李可以寄存喺前台。 |
| 83 | T3 Q3 | 客人講「Your room is a double and faces the harbor.」 key 雙床 | — | answer key / quiz | WRONG KEY: double = one double bed (雙人床); 雙床 = twin; contradicts U1 explain | key -> 雙人床 |
| 84 | T3 Q0/Q4 | listen "floor" / 邊個有 /l/ key floor | — | mismatch | mismatch: "floor" never appears in the T3 dialogue | add "Your room is on the tenth floor." or change the lemma |
| 85 | T3 C3 | Here is your key card… | 呢張係你把⋯⋯。 | gloss | gloss: wrong classifier 把 for a card (張) | — / 呢張係你嘅⋯⋯。 |
| 86 | r3-l7 | The sauce is spicy, and this dish is made without any peanuts. | 醬汁係辣嘅，呢碟冇花生。 | glued clauses | glued clauses with "and" | The sauce is a little spicy, but it has no peanuts. / 個醬有少少辣，不過冇花生。 |
| 87 | r3-l8 | Then I'll take the chicken, please. | 咁我要雞肉，唔該。 | scene-logic | scene-logic: chicken was already ordered in l1 | Great. The chicken, then, with the sauce on the side. / 好，咁就要個雞，醬另上。 |
| 88 | R3 Q2 | 客人講「We'll check the ingredients…」 key 麩質 | — | answer key / quiz | WRONG KEY: sentence never mentions gluten; none of 辣/貝類/麩質 fits; speaker is staff | key -> 睇吓有咩材料 |
| 89 | R3 Q0 | listen shellfish | — | mismatch | mismatch: "shellfish" not in the dialogue | — |
| 90 | t4-l1 | [Ray] The taxi is here. I can give the driver your address. | 的士到咗。我可以同司機講你個地址。 | scene-logic | scene-logic: Ray is the doorman here but the driver in l3–l7 | split speakers (doorman / driver) |
| 91 | t4-l2 | Could you take me to the landmark opposite the hotel? | 可唔可以載我去酒店街角對面嗰個地標？ | scene-logic | scene + gloss: a taxi to a place opposite the hotel; gloss adds 街角 | Could you take me to the Clock Tower, please? / 唔該去鐘樓。 |
| 92 | t4-l3 | The meter is on, and traffic is slow. | 咪錶開咗，交通好慢。 | glued clauses | glued unrelated clauses | The traffic is slow today. / 今日好塞車。 |
| 93 | t4-l4 | How long will this take if we go straight and turn left? | 如果直行再轉左，大概要幾耐？ | unnatural | naturalness: passengers don't specify a route when asking duration | Roughly how long will it take? / 大概要幾耐？ |
| 94 | t4-l8 | Thank you. I'll walk straight from this corner to the door. | 多謝。我會由呢個街角直行去門口。 | unnatural | naturalness | Thanks. I'll walk from here. / 多謝，我行過去得喇。 |
| 95 | T4 Q0 | 揀你聽到嘅字：租嚟嗰架車 (taxi) | — | gloss | gloss: 租嚟嗰架車 = rental car, not taxi | 的士 |
| 96 | T4 Q3 | 客人講「How long will this take…」 key 大概 | — | answer key / quiz | key: sentence doesn't contain "roughly" | — |
| 97 | r4-l1 | Are you enjoying the meal? I can bring a refill. | 你食得開唔開心？我可以幫你添一杯。 | gloss | gloss: 「食得開唔開心」 is not how a waiter asks in Cantonese | — / 食成點呀？要唔要幫你添杯水？ |
| 98 | r4-l2 | Could we get still water and one napkin for this fork? | 可唔可以嚟杯冇氣水，同埋一張餐巾畀呢支叉？ | unnatural | naturalness: "a napkin for this fork" is nonsense | Could we get some still water and another napkin, please? / 唔該畀杯冇氣水，同多張餐巾。 |
| 99 | r4-l6/r4-l8 | No dessert for me. Could we get the bill later? … Could I have a coffee later? | 我唔要甜品。可唔可以遲啲先要單？ | scene-logic | scene-logic: asks for bill "later", then orders coffee "later" after "anything else before you head off" | r4-l6: No dessert for me, thanks. Could we have the bill, please? / 我唔要甜品喇，唔該。可以埋單未？ |
| 100 | R4 RP2 | keywords ['sparkling','enjoy'] for "The sparkling water is coming." | — | answer key / quiz | keyword bug: "enjoy" is not in the expected line, so learner can never hit 2/2 | keywords ['sparkling','coming'] |
| 101 | R4 C2 | Could we get one more clean napkin for this fork please? | 可唔可以多要一張乾淨⋯⋯畀呢支叉？ | punctuation/spelling | punctuation (comma before please) + nonsense "for this fork" | Could we get one more clean napkin, please? |
| 102 | d6-l2 | [Mei] What should I tell the pharmacist before we choose a box? | 揀盒之前，我應該話藥劑師知咩？ | scene-logic | scene-logic: Mei asks what to tell the pharmacist, then acts as the pharmacist (l5, l7) | [Mei, pharmacist] Do you have any allergies? / 你有冇對咩藥敏感？ |
| 103 | d6-l3 | The only extra symptom is a drug allergy. | 另外就係藥物過敏。 | unnatural | naturalness/fact: an allergy is not a symptom; no drug named | I'm allergic to penicillin. / 我對盤尼西林敏感。 |
| 104 | d6-l6 | Can I take that tablet after meals if it's safer? | 如果安全啲，我可唔可以飯後食嗰粒藥片？ | unnatural | naturalness | Should I take it after meals? / 係咪飯後食？ |
| 105 | d6-l8 | I'll call this pharmacy if that cough comes back. | 如果咳嗽再返嚟，我會打畀呢間藥房。 | unnatural | naturalness | I'll come back if the cough doesn't get better. / 如果咳嗽冇好轉，我再嚟。 |
| 106 | D6 C1/C2 | pattern "one small tablet ___ a day for five days" vs example "one tablet twice a day" | 劑量係一日兩次。 | mismatch | mismatch: the shown pattern and the revealed example are different sentences | make pattern = example |
| 107 | D6 RP1 | keywords ['allergy','cough'] for "The only extra symptom is a drug allergy." | — | answer key / quiz | keyword bug: "cough" not in expected line | — |
| 108 | r9-l3 | Could we split the bill and get a separate receipt? | 可唔可以分開埋單，再要一張分開嘅收據？ | grammar | grammar: two people → "separate receipts" | Could we split the bill and get separate receipts? / 可唔可以分開俾，每人一張收據？ |
| 109 | r9-l4 | Yes, we can split it and show both amounts. | 可以分開，我會顯示兩個數。 | unnatural | naturalness | Sure. That's two hundred each. / 冇問題，每人兩百。 |
| 110 | r9-l5 | I'll pay my separate amount with an Octopus card. | 我用八達通畀我自己嗰份。 | unnatural | naturalness: "my share" | I'll pay my share with Octopus. / 我用八達通俾我嗰份。 |
| 111 | r9-l7 | There's a mistake on the bill. We didn't order the soup. | 張單有個錯。我哋冇叫嗰碗湯。 | scene-logic | scene order: mistake raised after paying and printing the receipt (l5–l6) | move before l3 |
| 112 | r13-l5 | Can I get this to go? | 可唔可以拎走？ | unnatural | naturalness: reply to "For here or to go?" is "To go, please." | To go, please. / 拎走，唔該。 |
| 113 | r13-l7 | It's Cleo. Sorry, I think this has regular milk, not oat milk. | Cleo。唔好意思，我覺得呢杯係普通奶，唔係燕麥奶。 | scene-logic | scene-logic/glued: complains about the finished drink in the same breath as giving the name, before the drink is made | split: "It's Cleo." / (later) "Sorry, I think this has regular milk, not oat milk." |
| 114 | R13 U1 | For here or to go? key 講緊燕麥奶 | — | answer key / quiz | WRONG KEY: the question is about takeaway; explain says 燕麥奶 | key -> 問堂食定拎走 |
| 115 | R13 U2 | I'll make you a new one with oat milk right away. key 講緊少糖 | — | answer key / quiz | WRONG KEY: line is about remaking with oat milk | key -> 即刻用燕麥奶整過 |
| 116 | R13 B1 | ORDER tokens sure / what | — | grammar | ungrammatical, meaningless target "sure what" | tokens: For / here / or / to / go |
| 117 | R13 B0 / Q4 | 你想用呢課嘅講法 / explain 「拿鐵。」 | — | answer key / quiz | key: no situation, all choices valid; explain unrelated to answer "less sugar" | — |
| 118 | j6-l1 / J6 + J7 tax | How much does this piece cost, and is the tax already in that price? / This purchase is tax-free… claim the tax / tax-free form / refund form | — | scene-logic | scene-fact: Hong Kong and Macau have no sales tax/VAT and no tourist tax-refund forms; a HK/Macau counter would never say this | replace with: "Is that the final price?" / "We can give you a receipt and a certificate." / 呢個係咪實價？ |
| 119 | j6-l2 | This piece is on sale today. | 呢件今日減價。 | scene-logic | scene-logic: does not answer "How much does this cost?" | It's three thousand dollars. It's on sale today. / 三千蚊，今日減緊價。 |
| 120 | j6-l6 | This piece is more expensive because the center stone is larger. | 呢件貴啲，因為中間粒石大啲。 | scene-logic | scene order: comes after the customer has already said "I'll take it" | move before l5 |
| 121 | j6-m1 | The total is a good deal, so many guests take both. | 總數好抵，所以好多客人兩件一齊要。 | unnatural | naturalness: retail says "customers", not "guests" | It's a good deal, so a lot of customers take both. / 幾抵，所以好多客都兩件一齊買。 |
| 122 | j7-l6 | Could I pay with notes if the till machine is busy now? | 收銀機而家忙嘅話，我可唔可以用紙幣畀錢？ | scene-logic | scene + natural: customer already chose card (l2); "till machine is busy" isn't said | drop |
| 123 | J7 lesson | l2 card → l6 notes → m1 phone/coins → l9 phone | — | scene-logic | scene-logic: payment method is renegotiated four times in one transaction | keep one payment exchange |
| 124 | j7-m1 | Would you like to settle by phone, or would coins be easier today? | 你想用電話結數，定係硬幣方便啲？ | unnatural | naturalness | Would you like to pay by card or by phone? / 你想用卡定手機付款？ |
| 125 | j7-m2 | Here is your receipt, which you should keep with the slip. | 呢張收據你要留低，同一張單。 | gloss | gloss broken (「同一張單」); English stilted | Here's your receipt. Please keep it with the certificate. / 呢張係收據，記得同證書一齊收好。 |
| 126 | J7 RP1 / B0 | Tom: Could I pay with cash? → EXPECT "Would you like to pay by card?" | — | scene-logic | scene: staff ignores the customer's stated wish | EXPECT: Of course. Cash is fine. |
| 127 | j15-l5 | How long does the warranty work take, and may I collect it on Saturday? | 保養工作要幾耐，星期六可唔可以取？ | scene-logic | scene + fact: Saturday pickup was already confirmed in l4; a resize is not "warranty work" | Is the resizing covered by the warranty? / 改碼包唔包喺保養入面？ |
| 128 | j15-l6 | The warranty work is ready on Saturday, and the charge is nothing at all. | 保養工作星期六做好，完全唔使錢。 | unnatural | naturalness | Yes, it's covered, so there's no charge. / 包嘅，所以唔使錢。 |
| 129 | j15-l7 | I will bring the receipt on Saturday and pay nothing for this warranty work. | 我星期六會帶收據，呢次保養工作唔使畀錢。 | unnatural | naturalness | Great. I'll bring the receipt on Saturday. / 好，我星期六帶收據嚟。 |
| 130 | J15 C1 | pattern "Yes we can make the ring half a size larger under the full ___." vs a different example | 保養可以改大半碼。 | mismatch | mismatch + punctuation (no comma after "Yes") | make pattern = example |
| 131 | J18 U1/U2 | U1 "Yes, we reseal it… metal band?" key 講緊電池; U2 "…one-year warranty." key 講緊防水 | — | answer key / quiz | WRONG KEYS: U2 is about pickup time and battery warranty, not water resistance; U1 is about resealing and the band | — |
| 132 | J18 / T15 / R13 B1 | ORDER "sure takes" / "sure late" / "sure what" | — | grammar | ungrammatical two-token targets (generator bug) | use a real lesson chunk |
| 133 | j20-l3 | The clasp is broken. How much is the labour charge? | 個扣壞咗。手工費係幾多？ | scene-logic | scene-logic: customer is buying a new 999 bangle; a broken clasp (repair) is unrelated, and 999 bangles usually have no clasp | How much is the labour charge on this bangle? / 呢隻手鐲手工費幾多？ |
| 134 | j20-l5 | Can I trade in this old chain against the new bangle? | 可唔可以用呢條舊鏈換購新手鐲？ | grammar | grammar: "trade in … towards", not "against" | Can I trade in this old chain towards the new bangle? / 可唔可以用呢條舊鏈抵新手鐲嘅錢？ |
| 135 | J20 Q2 | The labour charge is forty dollars on top of the gold. key 金價 | — | answer key / quiz | WRONG KEY: the meaning is the labour charge (手工費), which isn't offered | choices 手工費 / 手鐲 / 純度 → key 手工費 |
| 136 | t5-l5 | The embassy number is on this card, and I will help you file the report. | 大使館電話喺呢張卡上面，我會幫你報失。 | glued clauses | glued clauses with "and" | Here's the consulate's number. I'll help you file the report. / 呢個係領事館電話。我幫你報案。 |
| 137 | t5-l7 | I feel faint after the shock. Is this an emergency? | 我受驚之後覺得暈。呢個係咪緊急？ | unnatural | naturalness: patients don't ask if they are an emergency | I feel faint. I think I need a doctor. / 我覺得好暈，可能要睇醫生。 |
| 138 | t5-l8 | If you feel faint, I can call an ambulance while we file the report. | 如果你覺得暈，我可以叫救護車，同時我哋報失。 | scene-logic | scene-logic: filing a police report while waiting for an ambulance | Sit down. I'll call an ambulance now. / 你坐低先，我即刻叫救護車。 |
| 139 | t12-l3 | Could we please have a non-smoking room, and may the luggage stay here? | 可唔可以要非吸煙房，行李留喺度得唔得？ | scene-logic | scene + natural: staff just said luggage can stay; "may the luggage stay" is stilted | Could we have a non-smoking room, please? / 可唔可以要間非吸煙房？ |
| 140 | t12-l4 | It's free of charge, and the room is ready after four. | 非吸煙房唔使加錢，四點之後房間就準備好。 | glued clauses | glued with "and" | Sure, no extra charge. The room will be ready after four. / 冇問題，唔使加錢。房四點之後就得。 |
| 141 | t12-l5 | What wifi password can I use while I wait for the room? | 我入到房間可以用嘅無線網絡密碼係咩？ | gloss | gloss mismatch: EN "while I wait" vs gloss 「入到房間」 | What's the Wi-Fi password while I wait? / 等緊間房嗰陣，wifi 密碼係咩？ |
| 142 | t12-l8 | Please come back after four, and the desk will call your name. | 請四點之後返嚟取房間，櫃檯會叫你個名。 | unnatural | naturalness/scene | See you after four. / 四點之後見。 |
| 143 | T12 Q0 | listen "early check in" | — | mismatch | mismatch: phrase never in dialogue | — |
| 144 | t15-l1 | Hi, I'm checking out of room twelve-oh-eight. Could I get a late checkout? | 你好，我要退十二零八房。可唔可以延遲退房？ | scene-logic | scene-logic: "I'm checking out" now + asks for late checkout | Hi, I'm in room twelve-oh-eight. Could I get a late checkout? / 你好，我係 1208 房。可唔可以延遲退房？ |
| 145 | T15 U2 | Sure, it's on its way. Have a safe flight! key 講緊的士 | — | answer key / quiz | WRONG KEY: "it's on its way" is the emailed receipt | key -> 講緊收據 |
| 146 | T15 RP2/RP3 | keywords ['thanks','book'] / ['great','email'] | — | answer key / quiz | keyword bug: "thanks"/"great" absent from expected lines | — |
| 147 | t13-l4 | Three times a day, after meals. Don't take more than six tablets each single day. | 一日三次，食完飯先食。一日唔好多過六粒。 | unnatural | naturalness: "each single day" | … Don't take more than six tablets a day. / 一日唔好食多過六粒。 |
| 148 | t13-l7 | Do I need a prescription before I take this tablet? | 食呢種之前使唔使醫生處方？ | unnatural | naturalness | Do I need a prescription for this? / 呢隻使唔使醫生紙？ |
| 149 | t13-l1 | I have a bad headache and a high fever. What can I take? | 我頭痛得好緊，仲有高燒。我可以食咩？ | gloss | gloss: 「頭痛得好緊」 is unidiomatic | — / 我頭好痛，仲發高燒。可以食咩藥？ |
| 150 | T13 B0 | key "Hi. I have bad headache and high fever. What medicine can I take?" | — | grammar | grammar: KEYED answer drops articles ("a bad headache", "a high fever"); distractor "times day" | Hi. I have a bad headache and a high fever. What can I take? |
| 151 | r12-l4 | Yes, I'll put a high chair at the table for you. Do you need a deposit receipt? | 有，我會擺張兒童椅喺你張枱。你需唔需要訂金收據？ | scene-logic | scene order: deposit receipt offered before any deposit is mentioned (l5–l6) | Yes, I'll put a high chair at your table. There's a deposit for the private room. / 有，我會擺張兒童椅。包房要俾訂金。 |
| 152 | R12 Q0 | listen "party of" | — | mismatch | mismatch: phrase not in dialogue | — |
| 153 | r14-l1 | Hi. I'd like a cake in a size for ten people, please. | 你好。我想要一個夠十個人食嘅蛋糕。 | unnatural | naturalness | Hi. I'd like to order a cake for ten people, please. / 你好，我想訂個夠十個人食嘅蛋糕。 |
| 154 | r14-l3 | Mango, please. Can you write Happy birthday Mei on it? | 芒果，唔該。上面可唔可以寫 Happy birthday Mei？ | punctuation/spelling | punctuation: written message needs quotes/capitals/comma | Can you write "Happy Birthday, Mei" on it? |
| 155 | r15-l1/r15-l2 | Is this buffet all you can eat? Can I take food away? → Yes. This buffet is for here only. | 係。呢個自助餐只可以堂食。 | scene-logic | scene-logic: "Yes" answers the take-away question it then contradicts | Yes, it's all you can eat. But no takeaway. It's for here only. / 係任食，不過唔可以拎走，只可以堂食。 |
| 156 | r15-l4 | Yes. Those soft drinks are included for every adult at the table. | 係。每位成人喺檯上都包汽水。 | grammar | grammar: "Yes" to an either/or question | They're included for every adult. / 每位大人都包汽水。 |
| 157 | r15-l6 | The prawn soup has shellfish. Here's a clean plate. | 蝦湯有貝殼類。呢個係乾淨碟。 | gloss | gloss: prawn is 甲殼類/海鮮, not 貝殼類 (clams) | — / 蝦湯有海鮮（甲殼類）。呢隻係乾淨碟。 |
| 158 | R15 B1 | ORDER "The prawn soup has shellfish, so here is a clean plate." | — | glued clauses | glued false "so" (clean plate is not caused by the soup) | The prawn soup has shellfish. |
| 159 | r16-l6 | Yes. The kitchen will skip peanuts on both of those two plates. | 可以。廚房兩碟都唔會落花生。 | unnatural | naturalness: "both of those two" | Yes. The kitchen will leave peanuts out of both. / 可以，兩碟都唔落花生。 |
| 160 | R16 Q2/Q4 | distractors 讀（而家／習慣）/ 讀過（過去） / read / live | — | answer key / quiz | distractors copied from an unrelated grammar lesson | use food words |
| 161 | r5-l4 | The card machine is here, and the receipt includes the service charge. | 卡機喺度，收據會包括服務費。 | glued clauses | glued with "and" | Here's the card machine. The bill already includes a service charge. / 卡機喺度。張單已經包咗服務費。 |
| 162 | r5-l5 | The service was kind, so I will add a tip and you can keep the change. | 服務真係好好，我會加貼士，零錢留低當貼士。 | scene-logic | scene + natural: paying by card, so there is no change; "service was kind" | The service was great. I'll add a small tip. / 服務好好，我加少少貼士。 |
| 163 | r5-l6 | Thank you. The service charge comes before that extra tip. | 多謝。服務費計喺額外貼士之前。 | unnatural | meaning unclear; not a thing a server says | Thank you very much. / 多謝晒。 |
| 164 | r5-l7 | Could we get the cake as a takeaway before we leave? | 走之前可唔可以將蛋糕打包外賣？ | scene-logic | scene-logic: a cake never mentioned before; asked after paying | Could we take the rest of the cake home? / 剩低啲蛋糕可唔可以打包？ |
| 165 | R5 RP3 | keywords ['include','tip'] | — | answer key / quiz | keyword bug: "include" absent from expected line | — |
| 166 | R11 / R12 B1 | ORDER "okay egg" / "sure like" | — | grammar | ungrammatical two-token targets | — |
| 167 | w1-l1 | Good morning. This is Nia calling from the harbor office. How may I help? | 早晨。我係海港辦事處嘅 Nia 打嚟。有咩可以幫你？ | scene-logic | scene-logic: Nia is receiving the call (Tom: "I'm calling about…"), not calling | Good morning, Harbour Office. Nia speaking. How may I help? / 早晨，海港辦事處，我係 Nia。有咩可以幫到你？ |
| 168 | w1-l6 | Could you say the spelling slowly, and read the extension back? | 可唔可以慢慢講個串法，再將內線讀返畀我？ | scene-logic | scene-logic: roles reversed; the receptionist takes the message and checks spellings | (Nia) Could you spell your name slowly, please? / 可唔可以慢慢串一次你個名？ |
| 169 | w1-l8 | Thank you for the message. This afternoon is a good time to call back. | 多謝你幫我留言。下晝覆電話就得。 | unnatural | naturalness: caller thanks for "the message" | Thanks for your help. She can call me back this afternoon. / 多謝你。佢今日下晝覆我就得。 |
| 170 | W1 RP1 | I speak to Mei regarding appointment, and may I ask if she is available? | — | grammar | grammar: partner line is ungrammatical (missing "I'd like to", "an") | I'd like to speak to Mei about an appointment. Is she available? |
| 171 | W1 B1 | ORDER "Please hold the other line" | — | grammar | ungrammatical/meaningless target | Please hold the line |
| 172 | W1 / D1 RP | keywords ['spelling','extension'], ['headache','allergy'], ['pharmacy','follow-up'] | — | answer key / quiz | keyword bug: second keyword absent from each expected line | — |
| 173 | d1-l3/d1-l4 | Do you have a headache too? Are you allergic to any medicine we use? → I have had a headache since Monday. | — | scene-logic | scene: allergy question never answered; "any medicine we use" is odd | Yes, since Monday. And I'm not allergic to anything. / 有，由星期一開始。我冇藥物敏感。 |
| 174 | d1-l5 | I have had a cough since Monday. I need to rest. | 我由星期一起咳。我需要休息。 | scene-logic | scene: repeats the cough already reported in l2 | I feel very tired. Can I get a sick note? / 我好攰。可唔可以開張病假紙？ |
| 175 | d1-l2 | I have had a fever and cough since Monday. | 我由星期一起發燒同咳嗽。 | grammar | grammar: "a fever and a cough" | I've had a fever and a cough since Monday. |
| 176 | D1 Q1/Q2 | 「喉嚨嗰陣咳」; 「…，symptom 係咩意思？」 | — | answer key / quiz | gloss broken; quiz asks about "symptom", which is not in the quoted sentence | — / 喉嚨痕想咳 |
| 177 | D12 U2 / Q4 | Great. Nine thirty tomorrow with Dr Lam. key 講緊診金; Q4 explain 預約 for key consultation fee | — | answer key / quiz | WRONG KEY: the line confirms the appointment, not the fee | key -> 講緊預約 |
| 178 | d2-l4 | Could you help me block this card, and tell me the balance? | 可唔可以幫我凍結呢張卡，再話我知結餘？ | scene-logic | scene-logic: the card is lost, so "this card" is impossible | Could you block my lost card and tell me my balance? / 可唔可以幫我凍結張唔見咗嘅卡，再話我知結餘？ |
| 179 | d2-l5 | The balance is very low. Here is the full replacement fee. | 結餘好低。全數補卡費喺度。 | unnatural | naturalness: staff can't hand over a fee | Your balance is low. A new card costs fifty dollars. / 你戶口結餘好少。補卡要五十蚊。 |
| 180 | d2-l7 | Please sign this form at the branch. | 請喺分行簽呢張表格。 | scene-logic | scene-logic: they are already at the branch | Please sign this form here. / 唔該喺度簽呢張表。 |
| 181 | D2 lesson | canDo "open an account" — account opening is mentioned twice but never done | — | scene-logic | scene: lesson goal not met in dialogue | — |
| 182 | d14-l6 | Yes. I will note that damage because the box is split. | 可以。因為個箱裂開咗，我會記低損壞。 | glued clauses | naturalness: false "because" | Sure. I'll note that the box is damaged. / 好，我記低個箱爛咗。 |
| 183 | d14-l7 | Where do I sign my name for the box before I leave? | 我走之前喺邊度簽名收呢個箱？ | unnatural | naturalness | Where do I sign? / 喺邊度簽名？ |
| 184 | t7-l4 | This shirt size is too big. | 呢件衫碼太大。 | scene-logic | scene order + natural: said after already asking for a smaller size | (move before l2) This one is too big. / 呢件太大。 |
| 185 | t7-l5 | The fit works. Can I get a tax refund form? | 呢個版好啱。可唔可以畀我退稅表？ | unnatural | naturalness: "The fit works" | This one fits. Can I get a tax refund form? / 呢件啱身。可唔可以畀張退稅表我？ |
| 186 | t7-l8 | Thank you. The souvenir shop can stamp this tax refund form before you leave town. | 多謝。紀念品店可以喺你離鎮之前蓋呢張退稅表。 | scene-logic | fact/scene: refund forms are stamped by customs at departure, not by a souvenir shop | Show this form at customs at the airport before you fly. / 離境前喺機場海關出示呢張表。 |
| 187 | T7 U2 / B0 | Can I get a tax refund form for this shirt. / The reduced fit works well, so can I get a tax refund form for this shirt. | — | punctuation/spelling | punctuation: questions end with "."; B0 key is ungrammatical ("so can I …") | This one fits. Can I get a tax refund form? |
| 188 | T7 RP2 | May: we have a smaller size → EXPECT "This shirt size is too big." | — | scene-logic | scene: non-sequitur; keyword 'color' absent | — |
| 189 | w4-l2 | Not bad. The weekend was busy with my sister. | 幾好。個週末同家姐好忙。 | unnatural | naturalness; U1 key adds 「同家姐去咖啡店」 not in the English | Not bad. I spent the weekend with my sister. / 幾好，週末同家姐一齊。 |
| 190 | w4-l5 | I am ready. Shall we go into the room before the team sits? | 我準備好。我哋入房等團隊坐低？ | unnatural | naturalness | I'm ready. Shall we go in before everyone arrives? / 準備好喇。不如趁其他人未到先入去？ |
| 191 | w4-l7 | Then the team can start once everyone has a seat by the window. | 人人坐低近窗，團隊就可以開始。 | unnatural | naturalness/scene: "a seat by the window" is random | We can start once everyone is here. / 大家到齊就開始。 |
| 192 | w4-l4 | … are you ready for the 10 o'clock meeting with the sales team? | 十點同團隊嗰個會你準備好未？ | gloss | gloss drops "sales" (團隊 vs 銷售團隊) | — / 順便問吓，十點同銷售團隊開會你準備好未？ |
| 193 | r8-l1 | I would like to order one hot chicken takeaway for delivery to my office, please. | 我想叫一份熱雞外賣，送到我公司。 | unnatural | naturalness | I'd like to order the roast chicken for delivery to my office, please. / 我想叫個燒雞外賣，送去我公司，唔該。 |
| 194 | r8-l3 | It's eighteen Harbour Street. I spell Harbour H A R B O U R. | 地址係十八號 Harbour Street。… | unnatural | naturalness: "I spell Harbour…" | It's 18 Harbour Street. That's H-A-R-B-O-U-R. / 十八號 Harbour Street，串法係 H-A-R-B-O-U-R。 |
| 195 | r8-l4 | How long will the rider take to bring this hot delivery to my office? | 騎手要幾耐先將呢份熱外賣送到我公司？ | unnatural | naturalness | How long will it take? / 要幾耐先送到？ |
| 196 | R8 U1 | It's eighteen Harbour Street… key 請講街道地址，再串街名 | — | answer key / quiz | key: the sentence gives the address; the keyed answer is an instruction to give one | key -> 講地址同串街名 |
| 197 | w7-l6 | Will you be back on Monday, or stay home a bit longer? | 你星期一返，定係醫生要你喺屋企多留幾日？ | gloss | gloss adds 「醫生要你」 (not in English); EN missing "will you" in 2nd clause | Will you be back on Monday, or do you need a few more days? / 你星期一返唔返到？定係要多休息幾日？ |
| 198 | w7-l2 | I'm sorry. Could you bring a doctor's note when you come back? | 聽到你咁真係唔好意思。… | gloss | gloss: sympathy "I'm sorry" rendered as an apology 唔好意思 | — / 咁辛苦你喇。返嚟嗰陣可唔可以帶醫生紙？ |
| 199 | j8-l1 | Have you kept the receipt? Should I explain the warranty before you go? | 你有冇帶住張收據？走之前我可唔可以講下保養？ | gloss | gloss mismatch (kept ≠ 帶住) + scene: customer is back with a defect, not leaving after a sale | Do you have the receipt? Let me check the warranty for you. / 你有冇留住張收據？我幫你睇吓保養。 |
| 200 | j8-l3 | Please polish this bracelet with a soft cloth, and avoid harsh chemicals. | 請用軟布擦亮呢條手鏈，避開刺激化學劑。 | scene-logic | scene-logic: answers a scratch complaint with care tips | (after the claim is accepted) To keep it shiny, use a soft cloth and avoid harsh chemicals. / 之後記得用軟布抹，唔好掂刺激嘅化學品。 |
| 201 | j8-l4 | Does the guarantee cover this scratch, or should I file a claim within the week? | 保用包唔包呢道刮痕，定係我應該呢個禮拜內申請？ | unnatural | naturalness: confusing either/or | Does the warranty cover this scratch? / 保養包唔包呢條花？ |
| 202 | j8-l8 | Thanks. I understand the policy, the guarantee, and the return window. | 多謝。我明白政策、保用同退換期。 | unnatural | naturalness: textbook recap no customer says | Thanks. That's clear. / 多謝，我明白喇。 |
| 203 | d9-l5/d9-l6 | What ID do I need…, and when does the new card arrive? / … The new card arrives on Friday. | — | scene-logic | scene: Friday was already stated in l4; repeated twice | d9-l5: What ID do I need? / 要帶咩身份證明？ |
| 204 | d9-l7 | Can I draw cash at this counter on the temporary limit while I wait? | 我等緊嘅時候，可唔可以用臨時限額喺櫃檯拎現金？ | unnatural | naturalness | Can I take out some cash here while I wait for the new card? / 等新卡期間，我可唔可以喺櫃檯攞現金？ |
| 205 | D11 U0–U2 | U1 "For your salary, a savings account is best…" key 講緊地址; U2 "It'll arrive by post…" key 講緊戶口 | — | answer key / quiz | WRONG KEYS: rotated topic labels that don't match the sentence | — |
| 206 | D13 Q0/Q1 | both listen items use lemma filling-noun | — | answer key / quiz | duplicate item; second should test another word | — |
| 207 | j9-l1 | I'm sorry that there's a problem. Tell me what happened so I can help. | …話我知發生咩事，所以我可以幫手。 | gloss | gloss: 「所以我可以幫手」 calques "so" | — / 話我知發生咩事，等我幫你。 |
| 208 | j9-l4 | Could you replace the piece now, and tell me what you can do about it? | 而家可唔可以換過呢件，同我講你做到啲咩？ | unnatural | naturalness: redundant | Can you replace it, or what can you do? / 可唔可以換過件？定係你哋可以點處理？ |
| 209 | j9-l8 | I'll write up the complaint because the repair failed. | 我會寫低個投訴，因為修理失敗。 | scene-logic | scene-logic: no repair has been attempted yet | I'll write up your complaint now. / 我而家幫你寫低個投訴。 |
| 210 | J9 Q3 | 客人講「The manager can review the receipt, and we will repair it if the policy allows.」 key 即刻 | — | answer key / quiz | WRONG KEY: sentence has no "immediately"; correct meaning (經理睇收據／照政策修理) not offered | — |
| 211 | J9 RP | keywords ['apologize','understand'], ['manager','immediately'] | — | answer key / quiz | keyword bug: neither "apologize" nor "understand" appears in the expected line | — |
| 212 | j10-l4 | I like the pair, but I do not need the engraving if the price rises. | 我鍾意呢對，但如果價錢升，我就唔使刻字。 | scene-logic | scene-logic: engraving was never offered | (Mei first) We can also engrave a name. It's optional. / 我哋都可以刻名，唔要都得。 |
| 213 | j10-l6 | Please recommend your most popular option. | 請推薦你哋最多人揀嘅選擇。 | unnatural | naturalness | What's the most popular set? / 邊套最多人買？ |
| 214 | j10-l7 | If you prefer this necklace, the chain matches. The box is ready. | 如果你鍾意呢條頸鏈，條鏈都襯。禮盒準備好。 | unnatural | meaning unclear / non-sequitur | This set is the most popular. I can put it in a gift box. / 呢套最多人買，我可以幫你放禮盒。 |
| 215 | J10 C1 | This popular set is optional, and the engraving spells the name Mei on the box. | 呢個多人揀嘅⋯⋯可以唔要。 | unnatural | nonsense sentence | The engraving is optional. |
| 216 | j19-l7 | So the price is higher because the cut is cleaner? | 所以價錢高啲，係因為切工乾淨啲？ | scene-logic | fact: "cleaner" describes clarity, not cut | So it costs more because the cut is better? / 即係切工好啲，所以貴啲？ |
| 217 | j19-l8 | Yes. The report is from a lab. It is not a brand name. | 係。報告嚟自一間實驗室。佢唔係品牌名。 | unnatural | naturalness/meaning unclear | Yes. And the report comes from an independent lab. / 係，份報告係獨立化驗所發嘅。 |
| 218 | J19 spelling | dialogue "colour" vs quiz/chunk choices "color" | — | punctuation/spelling | spelling inconsistent inside one lesson | — |
| 219 | J16 U1/U2 | …fourteen characters, so it's two over the limit. key 講緊首字母; "…ready in three days." key 講緊日期 | — | answer key / quiz | WRONG KEYS: rotated topic labels | U1 -> 超咗字數上限; U2 -> 簽表，三日後取 |
| 220 | j22-l3 | Will plain lettering finish in time if the wedding stays on Saturday? | 如果婚禮係星期六，普通刻字趕唔趕得切？ | unnatural | naturalness: "if the wedding stays on Saturday" | Will plain lettering be ready before the wedding on Saturday? / 普通刻字趕唔趕得切星期六婚禮？ |
| 221 | j22-l7 | What's the rush fee if that proof needs one small change? | 如果校對稿要改一次，急單收費幾多？ | scene-logic | logic: conflates the rush fee with a change fee | What's the rush fee? And what if I need one small change? / 急單幾錢？如果要改少少又點？ |
| 222 | j21-l5/j21-l6 | What excess does my insurance policy charge…? / The excess on that policy is two hundred dollars… | — | scene-logic | scene-fact: a jeweller cannot know the customer's insurance excess | j21-l5: Can you write the repair cost on the appraisal for my insurer? / 可唔可以喺估價單寫埋維修費，等我交畀保險公司？ |
| 223 | J17 canDo + C2 | canDo: "wipe the pearl and then put perfume on"; C2 "Wipe the pearl, then put ___ on." gloss 先抹乾珍珠，再搽香水 | — | scene-logic | FACT ERROR + contradiction: correct care (and j17-l6) is perfume first, pearls last, wipe after wearing | Put perfume on first, then the pearls. Wipe them after wearing. / 先搽香水，再戴珍珠；戴完用布抹乾淨。 |
| 224 | t6-l1 | Good evening, this is Kim at the front desk. How may I help tonight? | 晚安，我係前台 Kim。… | gloss | gloss: 晚安 = good night (farewell); "Good evening" greeting is 你好／晚上好 | — / 你好，我係前台 Kim。今晚有咩可以幫到你？ |
| 225 | t6-l2 | The air conditioning is very noisy, and I barely slept in this room. | 部冷氣好嘈，我喺呢間房幾乎瞓唔到。 | scene-logic | scene: evening call ("Good evening… tonight") but guest says he barely slept | The air conditioning is very noisy. I can't sleep. / 部冷氣好嘈，我瞓唔著。 |
| 226 | t6-l6 | The air conditioning is still weak, so please ask the engineer to check. | 部冷氣仍然好弱，唔該叫工程師檢查。 | scene-logic | scene: problem was noise, not weakness; guest has already moved rooms | The new room is fine. Thanks. / 新房冇問題，多謝。 |
| 227 | t6-l8 | Thank you for the engineer, the towels, and the warm blanket. | 多謝你派工程師嚟、仲有毛巾同暖被。 | unnatural | naturalness: list-recap thanks | Thanks for your help. / 多謝你幫忙。 |
| 228 | T6 U0–U2, C0–C2, Q3 | There seems to be… / Would it be possible… / sorry for the inconvenience | — | mismatch | mismatch: the taught phrases never occur in the dialogue | add them to the dialogue |
| 229 | t19-l7 | What time will maintenance finish if I keep this suite? | 如果我留呢間套房，維修幾點做完？ | scene-logic | scene-logic: why ask if he's moving away from the noise | What time will the work in the hallway finish? / 走廊啲工程幾點做完？ |
| 230 | T19 B1 | Maintenance will finish at noon, and the harbor room stays held. | — | unnatural | naturalness: "stays held" | Maintenance will finish at noon. |
| 231 | r6-l1 | Good evening. A table for Mei, please. Is a window seat free tonight? | 晚安。訂 Mei 個名，唔該。今晚仲有冇靠窗位？ | unnatural | naturalness (phone booking needs time/party size) + gloss 晚安 | Good evening. I'd like to book a table for four tonight, under Mei. / 你好，我想訂今晚四位，用 Mei 個名。 |
| 232 | r6-l3 | Could we change the time and keep the reservation if we arrive later? | 可唔可以改時間，如果我哋遲啲到，訂位仲留住？ | scene-logic | scene: no time has been set yet | Could we make it eight o'clock instead? / 可唔可以改做八點？ |
| 233 | r6-l5/r6-l6 | If it rains, please cancel the outdoor seat and keep us indoors. / Those patio seats are booked, but I can add you to the waitlist. | — | scene-logic | scene-logic: party booked an indoor window seat; outdoor seat & waitlist come from nowhere | drop or rewrite as one indoor/outdoor choice |
| 234 | r6-l7 | Please confirm the booking. What time should we come? | 請確認訂位。我哋應該幾點嚟？ | scene-logic | scene: time already fixed at eight | Great. Could you confirm that by text? / 好，可唔可以發短訊確認？ |
| 235 | j12-l2/l3 | Do you still have a similar gold bracelet…? / I'll describe the similar gold bracelet we have. | — | scene-logic | scene: "similar" has no referent; promised description never comes | Do you have this gold bracelet in stock? I saw it online. / 你哋仲有冇呢款金手鏈？我喺網上見到。 |
| 236 | j12-l4/l5 | Text me when it's ready… / I'm calling to ask about stock… | — | scene-logic | scene order: the call's opening purpose comes 5th, after "text me when it's ready" | move l5 to the top |
| 237 | j12-l8 | I'll leave a short message, and you can collect the piece this Friday. | 我會留低短訊，你星期五可以嚟攞嗰件。 | scene-logic | scene: contradicts "collect tomorrow" (l5, canDo) | I'll text you. You can collect it tomorrow. / 我會發短訊畀你，你聽日可以嚟攞。 |
| 238 | J12 U0 / Q2 | Have you kept a similar gold bracelet in stock? / stock 係咩意思 (sentence has no "stock") | — | grammar | grammar ("Do you have … in stock?") + quiz asks about a word not in the quote | — |
| 239 | r7-l5/r7-l6 | Could you bring a dessert for us after you fix that plate? / I'll send that dessert right away… | — | scene-logic | scene-logic: dessert is sent "right away" though asked for "after"; customer demanding dessert mid-complaint is odd | (Suki) I'm so sorry. Dessert is on us tonight. / 真係唔好意思，今晚甜品我哋請。 |
| 240 | r7-l7 | Please don't serve the soup cold again when we come back. | 我哋下次返嚟，唔好再出凍湯。 | unnatural | naturalness/register: rude, not a model line | Thanks for sorting it out. / 多謝你哋幫手處理。 |
| 241 | R7 C0 | pattern "Excuse me please, Ana. I ___ the soup…" vs example "Excuse me, Suki…" | — | mismatch | mismatch: different names in pattern and example | — |
| 242 | t8-l4 | I'm not here on holiday. | 我唔係嚟度假。 | scene-logic | CONTRADICTION: speaker just said "I'm here for tourism" (l2); question was about business | No, I'm not here on business. Yes, I have a return ticket. / 唔係，我唔係嚟公幹。我有回程機票。 |
| 243 | t8-l5 | I declare these goods at the desk. | 我喺櫃檯申報呢啲貨物。 | scene-logic | naturalness + scene: immigration and customs are separate steps; not idiomatic | (customs) I'd like to declare this gift. / 我想申報呢份禮物。 |
| 244 | T8 RP2 | Pat: business? return ticket? → EXPECT "I'm not here on holiday." | — | scene-logic | contradiction carried into roleplay; keywords business/ticket absent | — |
| 245 | t18-l6 | You should pay forty dollars in cash because that alcohol is well over. | 因為酒過咗限額，你應該畀四十蚊現金。 | unnatural | naturalness: "well over" | The duty on that is forty dollars, in cash. / 呢枝要交四十蚊稅，要俾現金。 |
| 246 | t18-l8 | Yes. The duty is paid at this counter now, so keep the slip. | 可以。關稅而家喺呢個櫃檯交，留低張單。 | unnatural | naturalness | Yes, you can pay here. Please keep the receipt. / 可以，喺度交就得。記得留住收據。 |
| 247 | T18 U1 | 關於酒精 (alcohol) | — | gloss | gloss: 酒精 = ethanol; a bottle of alcohol is 酒 | 關於酒 |
| 248 | w2-l3 | I have attached the file as discussed, and I would like to clarify the deadline with you. | 我已經按討論附上份文件，想同你講清楚個期限。 | scene-logic | scene: Tom has just thanked her for attaching it | I'd like to clarify the deadline with you. / 我想同你講清楚個期限。 |
| 249 | w2-l6 | Yes. I'm free on Friday, so that deadline works. | 好。我星期五有空，所以個期限得。 | scene-logic | logic: being free on the deadline day doesn't make the deadline work | Yes, Friday works for me. / 好，星期五冇問題。 |
| 250 | W2 RP / Q3 | keywords ['propose','confirm'], ['grateful','deadline']; Q3 asks "grateful" (not in quoted line) | — | answer key / quiz | keyword bug + quiz word absent from quote | — |
| 251 | w3-l3 | Could you expand on the deadline and unmute so we can hear you? | 可唔可以再講個期限，同埋開返咪等我哋聽到？ | scene-logic | scene-logic: Tom was just heard speaking, so he isn't muted | Could you say more about the deadline? / 可唔可以講多啲個期限？ |
| 252 | w3-l5/w3-l6 | Let's agree on Friday… / I agree on Friday, but I suggest we mute and follow the agenda. | — | scene-logic | scene: ignores the concern that Mei can't make Friday; mute suggestion is a non-sequitur | l5: Can someone help Mei so we can keep Friday? / 有冇人可以幫 Mei，等我哋保持星期五？ |
| 253 | W3 canDo | EN "name an action item" vs YUE 「講出擔心」 | — | gloss | canDo EN and YUE describe different goals | — |
| 254 | W3 C1 / Q1 / B1 | gloss 「負責人趕唔切」 for "Mei can't meet"; mute = 「收細個咪」; ORDER ends with "but" | — | gloss | gloss subject mismatch (Mei → 負責人); 收細 = turn down, not mute; fragment target | — / 熄咪／靜音 |
| 255 | W8 Q3 / C2 | task 係咩意思 key 行動; gloss 「呢項行動我負責」 | — | answer key / quiz | gloss/key: task = 工作／任務, not 行動 (action) | key -> 工作 / 呢項工作我負責 |
| 256 | W8 RP | keywords ['behind','schedule'], ['Friday','note'], ['action','Friday'] | — | answer key / quiz | keyword bug: absent from expected lines | — |
| 257 | W11 U1/U2 / Q4 | Sure, I'll email you this afternoon. key 講緊計糧; Q4 explain 糧單 for key payroll | — | answer key / quiz | WRONG KEYS: rotated topic labels | U2 -> 下晝發電郵確認 |
| 258 | w12-l4 | Yes. The shop window display slipped last quarter, and the rest held. | 係。舖面櫥窗上季遲咗，其他都做到。 | unnatural | naturalness: "the rest held" | Yes. The window display was late last quarter, but everything else was on time. / 係，上季櫥窗陳列遲咗，其他都準時。 |
| 259 | W12 lesson | review is booked (l2) and then held in the same breath (l3–l8) | — | scene-logic | scene: booking call turns into the review itself | split into two scenes |
| 260 | d3-l2 | How much is the rent here, please, and are the utilities included? | 呢度月租幾多，唔該，水電包唔包？ | punctuation/spelling | punctuation/natural: "please" wedged mid-question | How much is the rent? Are utilities included? / 月租幾多？包唔包水電？ |
| 261 | d3-l8 | I will read the written notice carefully before I pay the deposit. | 我交按金之前會小心睇份書面通知。 | scene-logic | scene: "written notice" undefined; after already agreeing to sign | I'll read the lease carefully before I pay the deposit. / 交按金之前我會睇清楚份租約。 |
| 262 | D3 C1/C3 | C1 pattern "…and the ___ is one month" (ans deposit) vs example about rent; C3 ans "contract" vs example about keys | — | mismatch | mismatch: the revealed example does not contain the answer word | — |
| 263 | D3 B0 | 代理講咗月租同按金。你點先答？ key "The deposit is one month, and the rent stays fixed." | — | answer key / quiz | wrong key: keyed answer is the agent's own line | key -> If I decide today, is the deposit one month's rent? |
| 264 | D3 RP2/RP3 | partner Lea says Tom's line ("I will sign the lease…"); learner is expected to say Lea's lines | — | scene-logic | roleplay roles are swapped mid-scene | — |
| 265 | d8-l7 | Yes, the front guard can give you access, and the flat key stays at the front desk. | 可以，前門保安可以畀你入單位，鎖匙放喺前台。 | unnatural | naturalness: "front guard" | Yes. I'll leave the key with the security guard downstairs. / 可以，我會將鎖匙交畀樓下保安。 |
| 266 | T10 U2 | What tag number is on your baggage receipt…? key 行李牌號碼印喺行李收據上面 | — | answer key / quiz | key: the line is a question asking for the number; key is a statement | key -> 問行李牌號碼 |
| 267 | T14 U1/U2 / Q4 | Yes, I've rebooked you… key 講緊轉機; "Gate twenty-two…" key 講緊改簽; Q4 explain 延誤 for key rebook | — | answer key / quiz | WRONG KEYS: rotated topic labels | U1 -> 已經改簽，行李同班機 |
| 268 | w5-l1/w5-l7 | The reference number is on the box. (said twice) | 參考編號喺盒上面。 | unnatural | naturalness + repeat: caller should read the number, not say where it is | My order number is A one two three four. / 我張單編號係 A1234。 |
| 269 | w5-l2 | I'm sorry about the delay. Let me look into the broken clasp. | 唔好意思，遲咗。我睇吓個爛扣。 | scene-logic | scene: agent knows about the delay and clasp before the caller mentions them | What seems to be the problem? / 請問有咩問題？ |
| 270 | W5 Q2 / Q1 | quoted line "…by phone" not in dialogue; listen "apology" not in dialogue | — | mismatch | mismatch | — |
| 271 | W10 U1/U2 / B1 | No, offer a partial refund… key 講緊誠懇; "Say we'll call her tomorrow…" key 講緊延誤; ORDER "start sincere" | — | answer key / quiz | WRONG KEYS (rotated labels) + ungrammatical order target | U1 -> 畀兩成退款或者購物金; U2 -> 聽日打電話跟進，多謝佢耐心 |
| 272 | j14-l1 | We have a clear budget for a custom ring this month. | 我哋今個月有個清楚預算訂造戒指。 | unnatural | naturalness | We'd like a custom ring. Our budget is about twenty thousand dollars. / 我哋想訂造一隻戒指，預算大約兩萬蚊。 |
| 273 | j14-l7 | I can pay half the deposit this week. | 我呢個星期可以畀一半訂金。 | scene-logic | logic: the deposit already is half the budget; "half the deposit" = a quarter | I can pay the deposit this week. / 我呢個星期可以俾訂金。 |
| 274 | j14-l8 | I will hold the ring once the deposit arrives, and you can pick it up in four weeks. | 訂金到咗我就留住隻戒指，… | unnatural | wrong verb: the ring doesn't exist yet; "start the ring" | We'll start once the deposit arrives. It'll be ready in four weeks. / 收到訂金就開工，四個星期後可以攞。 |
| 275 | J11 RP / Q2 | keywords ['occasion','preference'], ['contemporary','discreet']; Q2 asks "preference" (not in quote) | — | answer key / quiz | keyword bug + quiz word absent | — |
| 276 | w6-l5 | That sounds reliable. How did teamwork help you…? | 呢個聽落好可靠。… | unnatural | naturalness: an event doesn't "sound reliable" | That's impressive. How did your team help that morning? / 好叻。嗰朝同事點樣幫到你？ |
| 277 | W6 B1 | ORDER "My strength is calm" | — | grammar | grammar: should be "My strength is staying calm" | My strength is staying calm |
| 278 | t9-l2/t9-l3 | …your connection is still safe. / Can we rebook for this evening…? | — | scene-logic | scene-logic: rebooking is asked right after being told the connection is fine; C0 example then says the connection "was missed" | The flight is delayed by three hours, so you'll miss your connection. / 航班延誤三個鐘，你會趕唔切轉機。 |
| 279 | t9-l6 | Is a full refund an alternative if the new flight does not leave until tomorrow morning from here? | … | unnatural | naturalness: stilted | If the next flight is tomorrow, can I get a full refund instead? / 如果下一班要聽朝先飛，可唔可以全數退款？ |
| 280 | t9-l8 | Your new itinerary is confirmed, and the desk will print it when the queue moves. | …隊伍一動櫃檯就會印畀你。 | unnatural | naturalness | You're confirmed on the next flight. Here's your new boarding pass. / 已經幫你確認咗下一班，呢張係新登機證。 |
| 281 | T9 RP3 | EXPECT repeats RP1's line ("Can we rebook for this evening…") | — | scene-logic | duplicate roleplay turn | — |
| 282 | j13-l2 | We need thirty pieces for the office, and we want the logo engraved on it. | 我哋要三十件畀公司，要喺上面刻標誌。 | grammar | grammar: thirty pieces → "on them" | We need thirty pieces, with our logo engraved on each one. / 我哋要三十件，每件都要刻公司標誌。 |
| 283 | j13-l5 | The better price is forty dollars each if you confirm the thirty-piece order this week. | 今個星期確認訂單，三十件每件四十蚊。 | unnatural | naturalness | If you confirm this week, we can do forty dollars each. / 今個星期確認嘅話，每件可以算你四十蚊。 |
| 284 | T20 (whole lesson) | e.g. t20-l3 "I missed the inner checkpoint by that belt."; t20-l6 "No. That grey case must use the scanner desk…" | 唔得。… | scene-logic | scene/grammar: lesson is keyword-stuffed; "No" contradicts the answer; t20-l8 "…thirty minutes early, because security opens at noon" false because | rewrite lesson: "Does this big case go through the normal scanner?" / "No, oversized bags go to the desk on the left." |
| 285 | J23 (whole lesson) | e.g. j23-l4 "The new deductible is noted after that first file."; j23-l8 "The deductible stays the same." | — | scene-logic | scene/meaning: insurance jargon chained without meaning; l8 contradicts l3–l4 (deductible changed); speaker refers to himself as "the claimant" | rewrite lesson |
| 286 | r17-l1 / R17 lesson | Could we book the banquet from six if the cancellation fee stays under fifty dollars? | … | unnatural | naturalness + fact: conditional is unnatural; a $40 banquet cancellation fee / $80 surcharge is unrealistic in HK | I'd like to book a banquet for 80 people at six. What's your cancellation policy? / 我想訂六點、八十位嘅宴會。取消有咩規定？ |
| 287 | r17-l5/r17-l7 | Is the service gratuity included … when the surcharge covers three full hours? / What time does the cancellation rule start if we drop the whole party after four? | — | unnatural | meaning: nonsensical conditionals | Is the service charge included? / What's the latest time we can cancel? / 包唔包服務費？最遲幾點可以取消？ |
| 288 | W14 (whole lesson) | w14-l3 "Will you circulate the written forecast if each stakeholder has not read the email yet?" / w14-l4 "…once the team has read the full email." | — | scene-logic | scene/meaning: l4 contradicts l3's condition; stacked conditionals throughout | rewrite lesson |
| 289 | W15 (whole lesson) | w15-l3 "Will you approve the full variance if procurement keeps it inside the written March ledger?"; w15-l5 "Could you put me down as the lead, and not read every line out in the meeting?" | — | glued clauses | meaning + glued: jargon chains, unrelated requests glued with "and" | rewrite lesson |
| 290 | J24 (whole lesson) | j24-l5 "Is the filigree quote lower if I take that rhodium pair home this Friday night?"; j24-l8 "I will hold that hallmark note until noon, and the gold prong can wait here." | — | scene-logic | meaning + fact: lesson is incoherent; hallmarks are stamped on the band/shank, not on a prong | rewrite lesson |
| 291 | t21-l3/t21-l4 | If the flight leaves at two, how early should I reach immigration with one bag? / Please reach immigration by one o'clock, because your layover flight leaves at two. | — | scene-logic | scene: at check-in the passenger's own flight is mislabelled "layover flight"; "with one bag" padding | How early should I go through immigration? → Please go through by one. Boarding starts at one thirty. / 要幾早過關？→ 一點前過關，一點半開始登機。 |

---

## 3. Update and cache safety (iPhone Safari)

**What I verified works:**

- Live `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest` and `/registerSW.js` all return 200 from the 2026-11-03 01:07 deploy. The live `index.html` matches the v1.0 build (same `eq-source` hash, same entry chunk).
- `web/src/sw.ts:12`, `:20` and `:27-30` keep `index.html`, `sw.js`, the manifest, `registerSW.js` and `workbox-*` out of precache, and route navigations NetworkOnly. Registration uses `updateViaCache: "none"` (`web/src/main.tsx`).
- The kill switch in `web/index.html:28-70` only unregisters service workers and deletes Cache Storage. `tests/sw-kill.mjs` asserts that no file calls `localStorage.clear`, `sessionStorage.clear`, `indexedDB.deleteDatabase` or `Clear-Site-Data`, and it passes.
- Progress lives only in IndexedDB `english-quest` → `kv` → `state` (`web/src/store.ts`, `web/src/persist.mjs`); `localStorage` is not used. Older schemas migrate forward. A record from a *newer* schema puts the app in read-only mode instead of overwriting it (`persist.mjs:410-423`, `App.tsx` readonly screen).
- e2e (Chromium here, WebKit in CI): an old SW reaches the new shell within 1 reload in light and dark mode, and the oldest historical workbox builds also migrate, with seeded progress intact.

**What is not safe or not guaranteed** (details in the P-list):

1. **The newest bundle is not guaranteed on open.** GitHub Pages sends `cache-control: max-age=600` for `index.html` *and* `sw.js`. The SW's NetworkOnly navigation fetch uses the default cache mode, so for up to 10 minutes after a deploy Safari can serve the previous `index.html` from its HTTP cache. (`sw.js` itself is safe because of `updateViaCache: "none"`.) → P1-1
2. **The app can't open offline,** although `SPEC.md:96` promises "offline for shipped lessons/audio/art". → P1-2
3. **The 1.5 s kill-switch timeout** (`web/index.html:43`, `:53-66`) is risky on a slow device. `sw.js` is 843 KB (8,613 manifest entries). If a cold SW start takes longer than 1.5 s, the page decides the worker is dead, unregisters it, **deletes all caches (≈181 MB)** and reloads. IndexedDB survives, but the device re-downloads everything and loses its offline copy, possibly on every cold start. → P1-3
4. **Stale precache revisions are never deleted.** `purgeOldShell` (`sw.ts:43-57`) keeps any entry whose *pathname* is current, but workbox stores `…mp3?__WB_REVISION__=…`. `PrecacheController.activate()` (the workbox step that deletes outdated revisions) is never called, so every re-rendered mp3/webp leaves its old copy behind. → P1-4
5. **A save can silently stop.** `persist.mjs:319` calls `stamp(next)` *before* its `try`. Any validation failure throws, and the status stays `{kind:"ok"}`, so the 「未儲存」 banner never shows. I confirmed this with a probe: saving a cursor with `quizScore > quizAnswered` throws `進度格式唔啱。` while status stays ok. The quiz-resume double count (P1-6) can reach the 40 cap in `normalizeCursor`, after which no further save succeeds. → P1-5

---

## 4. UX at 390 px

Reviewed: `run.mjs` screenshots at 390×844 (home, lesson, vocab, light and dark), a contact sheet of all 97 hero images, and `web/src/styles.css`.

- Home status pills: the goal pill (`.pill.goal`, `styles.css:169`) stretches the row, so 「今日未打卡」 and 「0 XP」 sit top-aligned inside tall pills. → P2-1
- The 慢速 toggle in Hear (`Lesson.tsx:323-326`) and the sound and Jyutping toggles in Settings (`pages.tsx:476-484`) are bare native checkboxes (about a 20 px box). The `.toggle` row is 48 px, so it is tappable, but the control reads as unfinished; README already lists this as an open issue. → P2-2
- `.word-play` buttons are 34×34 px (`styles.css:814`), below the 44 px minimum. → P2-3
- The sound setting label 「關掉就完全靜音」 (`pages.tsx:485`) promises full silence, but it mutes only sound effects. Teaching audio and runtime TTS (`media.ts:97-113`) ignore it. → P2-4
- **Hero images are inconsistent.** Most share one flat style, but:
  - Several are posters with English text baked in: d10 "CITY RIDE", d12 "CONNECT & CARE", d3 "WELCOME HOME", f3 "MONEY & TIME", f4 "THANK YOU!", j4 "NECKLACE", r9 "BILL", t11 "SUBWAY SUNSHINE" (Hong Kong says MTR, not subway), t12 "HOTEL CHECK-IN", t20 "SHUTTLE", w11 "PAYSLIP", and r1 "CAFÉ" (that lesson is restaurant seating).
  - r11 and t2 are near-empty scenes.
  - r17 is a semi-realistic night render.
  
  → P2-5
- Learner-visible lockups found in code (from my earlier code review, still present in v1.0):
  - The Hook button stays disabled forever if any hero or cast image fails to load (`art.tsx:18-28`).
  - A saved lesson position past the current item count opens a blank lesson with no buttons (`Lesson.tsx:212,222,235,474,583`).
  - A malformed `#/lesson/%E0` link throws in `App.tsx:20-22` and there is no error boundary.
  
  → P1-7, P1-8, P2-6

---

## 5. Code health

- **Bundle:** `shell` chunk is 2.59 MB (615 KB gzip), because `web/src/data.ts:1-99` statically imports all 97 lessons and the 61k-line `lexicon.json`.
- **Precache size:** 181 MB, 8,613 entries, downloaded in the background on the first fetch over any network (`sw.ts` `precacheInBackground`).
- **Duplicated code:**
  - `StressChips` (`Lesson.tsx:771`, `Vocab.tsx:159`).
  - `playKaraoke` (`Lesson.tsx:826`, `Vocab.tsx:193`).
  - Date-key helpers (`store.ts:29` `todayKey`, `pages.tsx` `todayStamp`).
  - `SHIPPED` is a hand-copied list beside the `lessons` array (`data.ts:242`, `:245`).
- **Dead code:** the `touchToday` store action (`store.ts:172-173`) is never called.
- **Hard-coded content in code:**
  - `tipFor` (`Lesson.tsx:28-46`) covers only 16 of 97 lessons.
  - `GLYPHS` (`pages.tsx`) and `CAST_LABEL` (`data.ts`) are hand-kept maps.
  - The roleplay counter is fixed at "/ 3" (`Lesson.tsx:587`).
- **Risky behaviour:**
  - Opening a vocab deck or deck quiz creates up to 10 *due* cards (`Vocab.tsx:349-351`, `:452-455`).
  - The deck quiz grades each word twice (`Vocab.tsx:412-417`, `:471`).
  - `keywordHits` matches substrings (`media.ts:97`).
  - `whenArtDecoded` has no `onerror` or timeout.
- **Accessibility:** `aria-*` is almost absent (0 in `App.tsx`, `Onboarding.tsx`, `goals.tsx`). Option buttons in onboarding, goals and minutes selection have no `aria-pressed` and no radio semantics. `lang="en"` is used consistently on English text, which is good.
- **Content generator** (`scripts/emit_content.py`, `scripts/round19_content.py`, `scripts/round20_content.py`): the systemic defects in 2.3 come from template generation and are not caught by any test.

---

## 6. Prioritised fix list

### P0: block the v1.0 label (content; no app-code risk)

| # | Where | Problem | Concrete fix |
|---|---|---|---|
| P0-1 | `content/lessons/r3.json` (r3-l1 glossYue), `r2.json`, `r3.json`, `r8.json`, `t2.json`, `t3.json`, `j5.json`, `j7.json` | 「叫雞」 appears 11 times (common slang for hiring a sex worker) | Replace with 「我要個雞」/「我想點雞肉」. Add a banned-string test to `tests/content-correctness.mjs`. |
| P0-2 | `t3.json` Q3, `r2.json` Q2, `r3.json` Q2, `j9.json` Q3, `j20.json` Q2, `r10.json` Q2, `f5.json` Q5, `f6.json` B0, `d4.json` B0, `d3.json` B0, `r13.json` U1/U2, `j18.json` U1/U2, `r12.json` U1/U2, `r11.json` U2, `d11.json` U1/U2, `d12.json` U2, `t15.json` U2, `j16.json` U1/U2, `w10.json` U1/U2, `w11.json` U2, `t14.json` U1/U2 | Wrong answer keys: a correct learner is marked wrong | Re-key each item per table 2.4. Replace the rotating 「關於/講緊/唔係」 understand items with real meaning choices. |
| P0-3 | `t8.json` t8-l4 (+ RP turn 2) | "I'm not here on holiday" contradicts "I'm here for tourism" | "No, I'm not here on business. Yes, I have a return ticket." / 「唔係，我唔係嚟公幹。我有回程機票。」 |
| P0-4 | `j17.json` canDoEn/canDoYue + C2 | Pearl care is backwards ("wipe the pearl, then put perfume on") and contradicts j17-l6 | "Put perfume on first, then the pearls; wipe them after wearing." / 「先搽香水再戴珍珠，戴完抹乾淨。」 |
| P0-5 | `j6.json`, `j7.json` (tax lines, tax-free form, refund form), `t7.json` t7-l8 | Hong Kong and Macau have no sales tax and no tourist refund forms; a souvenir shop doesn't stamp refund forms | Rewrite J6/J7 around final price, receipt and certificate. For T7, say "Show this form at customs before you fly." |
| P0-6 | `t20.json`, `j23.json`, `r17.json`, `w14.json`, `w15.json`, `j24.json` | Incoherent, keyword-stuffed B2 dialogues; filler distractors; fragment build targets | Rewrite each lesson from a real scene (rows in 2.4 give starting lines). Until then, mark them `soon` in `content/path.json`. |
| P0-7 | 32 build-order items across the lessons (see 2.3) | Targets that are not sentences ("sure what", "okay egg") | Use a full lesson chunk of ≥4 tokens. Add a test that order answers start with a capital, have ≥3 tokens and end at a clause boundary. |
| P0-8 | `t3.json` U1 vs Q3, `t17.json` t17-l4 | Contradictory facts inside one lesson (double vs twin; power bank left in the bag) | As in 2.4 |

### P1: fix before or with v1.0.1

| # | Where | Problem | Concrete fix |
|---|---|---|---|
| P1-1 | `web/src/sw.ts:27-30` | Navigation fetch can return a ≤10-min-stale `index.html` from the HTTP cache (Pages `max-age=600`) | `new NetworkOnly({ fetchOptions: { cache: "no-cache" } })` (or `"no-store"`) for navigations and the SHELL regex |
| P1-2 | `web/src/sw.ts:27-30`, `vite.config.ts:126-132` | No offline launch, which contradicts `SPEC.md:96` | Network-first navigation: on success, return it and overwrite a cached copy of `index.html`; serve the cached copy *only* when `fetch` rejects. Keep `no-cache` on the network leg. |
| P1-3 | `web/index.html:43`, `:52-66` | A slow cold SW start (>1.5 s, 843 KB `sw.js`) wipes all caches and reloads | Treat only an explicit wrong reply as "dead"; on timeout, boot normally. Or raise the timeout to ≥5 s and remember a successful ping in `sessionStorage`. |
| P1-4 | `web/src/sw.ts:43-57`, `:85-95` | Old precache revisions are never deleted | After `precacheController.install(...)` resolves, call `precacheController.activate(fakeEvent)`, or compare full cache-key URLs in `purgeOldShell`. |
| P1-5 | `web/src/persist.mjs:311-333` | `stamp()` throws outside the `try`; save fails silently and the status stays ok | Move `stamp(next)` inside the `try`; on error set `status = { kind: "unsaved", reason: "進度格式唔啱。" }`. Fix the comment at `store.ts:113`. |
| P1-6 | `web/src/Lesson.tsx:118-128`, `:645-648` | Quiz resume re-counts an answered question ("小測 4 / 3 · 準確 133%", extra XP) | Save the cursor with `sub + 1` once a quiz item is answered, or store answered indices. |
| P1-7 | `web/src/art.tsx:18-28` | 入去場景 stays disabled forever if an image fails | Add `img.onerror = resolve` and an overall `setTimeout(resolve, 2500)`. |
| P1-8 | `web/src/Lesson.tsx:212,222,235,474,583` | Stale or imported cursor past the item count → blank screen with no controls | Clamp `sub` to each beat's item count on resume; if it is out of range, advance to the next beat. |
| P1-9 | All lessons with roleplay (52 keywords) | Keywords absent from the expected line | Regenerate keywords from words in `expect`; add a test `keywords ⊂ expect`. |
| P1-10 | 90 chunk items | Pattern ≠ revealed example | Set `example = pattern.replace("___", answer)`; add a test. |
| P1-11 | 22 listen-quiz items; T6/W2/J12 U items | Testing words the lesson never says | Choose lemmas from the dialogue; add a test. |
| P1-12 | 54 「客人講」 prompts | Wrong speaker attribution | Use the real speaker label (「Kim 講」「店員講」) from the source line. |
| P1-13 | `web/src/Vocab.tsx:349-351`, `:452-455`, `:412-417` | Browsing a deck inflates due counts; the quiz double-grades | Enqueue only on mark or answer; grade once per word per quiz. |
| P1-14 | Unnatural, glued and scene-logic rows in 2.4 (≈180 rows) | Lines a native speaker wouldn't say, or steps in the wrong order | Apply the suggested rewrites. Re-render the affected audio with `npm run audio`. |

### P2: polish

| # | Where | Problem | Concrete fix |
|---|---|---|---|
| P2-1 | `web/src/styles.css:169` + `.status-row` | Pill text top-aligned on home | `align-items: center` on the row, or give non-goal pills `align-self: center` |
| P2-2 | `Lesson.tsx:323-326`, `pages.tsx:476-484` | Bare checkboxes | A 44 px switch component with `role="switch"` and `aria-checked` |
| P2-3 | `styles.css:814` | 34 px play buttons | `min-width/min-height: 44px` |
| P2-4 | `pages.tsx:485`, `media.ts:97-113` | "完全靜音" label overpromises | Relabel as 「只關音效」, or make `playAsset` respect `profile.sound` |
| P2-5 | `assets/art/lessons/{d10,d12,d3,f3,f4,j4,r9,t11,t12,t20,w11,r1,r11,t2,r17}.webp` | Mixed hero styles, baked-in English text, empty scenes | Regenerate in the house style with no text, cast present |
| P2-6 | `web/src/App.tsx:20-22` | `decodeURIComponent` can throw; no error boundary | Wrap it in try/catch and fall back to `{name:"path"}`; add a top-level error boundary |
| P2-7 | `web/src/data.ts:1-99`, `vite.config.ts:125` | 2.6 MB chunk; 181 MB precache over any network | `import.meta.glob` lessons per route; precache shell + art, and cache audio on demand (CacheFirst) or behind a "download for offline" button |
| P2-8 | `tsconfig.json:20` | SW not type-checked | Add a `tsconfig.sw.json` with `lib: ["webworker"]` and run it in `typecheck` |
| P2-9 | `web/src/learner.ts`, `media.ts:89-95` | A Chinese profile name is read or spelled by an en-US voice in `{{learner}}` / `{{learner-spell}}` lines | Ask for a romanised English name in onboarding, or skip TTS for non-Latin names |
| P2-10 | All content | Mixed UK/US spelling; 132 English quiz prompts at A1–B1 | Pick one spelling standard; translate prompts to 廣東話 |
| P2-11 | `Lesson.tsx:771/826`, `Vocab.tsx:159/193`, `store.ts:172`, `data.ts:245` | Duplicated helpers, the unused `touchToday`, the hand-copied `SHIPPED` | Extract shared components; derive `SHIPPED` from `lessons.map(l => l.id)` |
| P2-12 | `e2e/migrate.mjs:372-377` | The browser-only filter matches nothing and reports ok | Accept `chromium`/`webkit` as prefixes; fail when 0 jobs match |
| P2-13 | `Onboarding.tsx`, `goals.tsx`, `pages.tsx` minutes buttons | No selection semantics for assistive tech | Add `aria-pressed`, or use `role="radiogroup"` / `role="radio"` |
| P2-14 | `Lesson.tsx:587` | Roleplay counter fixed at "/ 3" | `/ {lesson.roleplay.turns.length}` |
