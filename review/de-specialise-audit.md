# De-specialise audit: from jewellery app to general-purpose

**Date:** 2026-11-05 · **Branch base:** `main` @ `761c4b83` (after #24) · **Audit only: no code changed.**

Goal (Penny): English Quest is general-purpose. Jewellery retail is one equal track beside basics, daily life, work, travel and restaurant. Nothing should assume the learner works in jewellery.

Constraints for every later fix: British English; Cantonese glosses in colloquial Traditional Chinese, never Mandarin; no loss of user progress or IndexedDB data.

Severity: **P0** = what a new user sees first or what defines the app; **P1** = content and balance; **P2** = naming and polish.

---

## Summary

| # | Layer | Verdict | Worst findings |
|---|---|---|---|
| 1 | Identity | **Jewellery-first** | App icons show a jewellery shop window; meta, manifest and splash lead with 珠寶櫃檯; README and SPEC persona are a jewellery counter worker |
| 2 | Onboarding and defaults | **Jewellery by default** | Goal preselected = jewellery, so a new user's 今日 is J1; basics path runs through J1; Daily life and Work cannot be chosen |
| 3 | Content balance | Jewellery is the largest track | 22 of 91 lessons, 169 of 692 dialogue lines, 183 of 705 first-taught words; basics has 6 lessons |
| 4 | Leakage | Real but contained | Jewellery distractors in 8 non-jewellery lessons; W5 (work complaint call) is about a broken clasp; 15 general cards use jewellery examples, 6 as their main example |
| 5 | Daily draw | Size-weighted | Jewellery is 24% of the 751-card pool (23% of today's drawable cards); a uniform shuffle hands the biggest track the most cards |
| 6 | Visuals and gamification | Mostly neutral | Icons and cover art are jewellery scenes; no levels, badges or achievements exist; mascot is neutral |
| 7 | Code naming | Mostly safe | `jewellery` goal value, `J*` lesson ids and `*-noun` card ids are stored in IndexedDB and must stay; labels and deck order can change freely |

---

## 1. Identity

| Where | Current | Proposed |
|---|---|---|
| `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (manifest at `vite.config.ts:123-127`, `web/index.html:16`) | All three show a night-time jewellery shop window with a saleswoman and a necklace display. This is the home-screen icon. | New neutral icon: the 小燈 lantern mascot or a speech-bubble "EQ" mark on the palette. Keep file names, so no manifest change is needed. |
| `assets/art/cover.webp`, `assets/art/thumb.webp`; preloaded at `web/src/shell.tsx:18` | Jewellery counter with a necklace in a glass case and the lantern mascot. `cover.webp` is preloaded but never shown; `thumb.webp` is not used by the app. | Replace with a mixed-scene cover (counter, airport, café, office), or drop the unused preload (it costs ~100 KB on first load). |
| `web/index.html:9` meta description | 「情景英文：珠寶櫃檯、登機、入座。…」 | 「情景英文：日常、出行、餐廳、返工同珠寶櫃檯。廣東話介面…」, with jewellery listed last as one of several. |
| `vite.config.ts:115` manifest `description` | 「畀廣東話使用者嘅情景英語：珠寶櫃檯、登機、入座。」 | Same wording change as the meta description. `name` and `short_name` (`vite.config.ts:113-114`, 「English Quest 情景英文」) are already neutral; keep them. |
| `web/src/App.tsx:42` splash tagline | 「珠寶櫃檯、登機、入座。」, the first words every launch shows | 「日常、出行、返工，一句一句講出口。」 or similar, with no single track named first. |
| `README.md:3` | "Scenario-based English learning for Cantonese speakers (jewellery sales, travel, restaurant)." | "…for Cantonese speakers: everyday life, travel, restaurants, work and retail (including jewellery)." |
| `SPEC.md:16` persona | 「阿琳」, a **jewellery counter worker** | Broaden: an adult Cantonese speaker who uses English at work and when travelling; jewellery counter staff are one of several user groups. |
| `CURRICULUM.md:60` | "Unit J — Jewellery sales（珠寶櫃檯）· A1→B2 **priority track**" | Drop "priority track"; list the units as equals. |
| `web/src/pages.tsx:595` (出處 page) | 「…珠寶等圖示由本 app 自繪…」 | 「…部分圖示由本 app 自繪…」 |
| `public/favicon.svg` | Abstract ring and dot on navy | Fine as an abstract mark. It can read as a ring, so align it with the new icon when that lands. |

## 2. Onboarding and defaults

| Where | Current | Proposed |
|---|---|---|
| `web/src/Onboarding.tsx:12` | `useState<Goal>(existing?.goal \|\| "jewellery")`: a new user is **preselected into jewellery** | Default `"foundation"` (打好基礎), or no preselection, with 下一步 disabled until a goal is picked. |
| Consequence (since #23, `web/src/unlock.mjs`) | A new user who taps through gets 今日 = **J1**, and the path scrolls to the jewellery counter. | With the default changed, 今日 = F1. |
| `web/src/goals.tsx:11-16` option order and copy | foundation, jewellery, travel, restaurant. The jewellery copy 「明日櫃檯用得着」 assumes a job at a counter ("you will use it at the counter tomorrow"). | Order: foundation, daily life, travel, restaurant, work, jewellery (or alphabetical by label). Copy: 「推介首飾、試戴、收錢」 (describes the track, not the user's job). |
| `web/src/types.ts:1`, `web/src/persist.mjs:10`, `web/src/unlock.mjs:14` | `Goal = "foundation" \| "jewellery" \| "travel" \| "restaurant"`. **Daily life (D, 14 lessons) and Work (W, 13 lessons) cannot be chosen**, and `TRACK_PREFIX` has no D or W. | Add `"daily"` and `"work"` goals mapped to D and W. **Compatibility hazard:** `persist.mjs:29` throws on an unknown goal, so an older cached build reading a record with `goal: "daily"` would go read-only (讀唔到進度). Ship a tolerant reader first (unknown goal → foundation, no throw), let it reach users, and only then add the new goals (see the plan, P0-2). |
| `web/src/goals.tsx:5` label | `jewellery: "珠寶櫃檯"` | 「珠寶銷售」 or keep 「珠寶櫃檯」 as the track name. It's fine as a track name once it is no longer the default or listed first. |
| `web/src/data.ts:111` `SHIPPED` order, `content/path.json:29,33` (A1 unit 「打好基礎」) | Linear order F1–F5 → **J1 → R1** → F6. A foundation learner must pass the jewellery counter and the restaurant to finish basics. J1 and R1 sit inside the A1 basics unit. | Make basics contiguous: F1–F6, then each track's first lesson. Move J1 and R1 to the 起步 unit. **Never re-lock:** add a legacy unlock rule (J1 and R1 stay open when F5 is done) so nobody loses an opened lesson. |
| `content/lessons/f5.json:329` | `"next": "J1"` (下一課 after F5 goes to jewellery for foundation learners) | `"next": "F6"`, and J1's next follows its own track. |
| `web/src/pages.tsx` PathHome | 今日 for foundation follows the linear order, so it lands on J1 after F5 | Fixed by the reorder above. |

## 3. Content balance

Counts on `main` (91 shipped lessons, hidden lessons excluded). A word counts under the track that first teaches it, in path order.

| Track | Lessons | Dialogue lines | Role-play turns | Words first taught | Line clips | Word clips (sentence, example, mini) | Cards with a 抽卡 word clip |
|---|---|---|---|---|---|---|---|
| Basics (F) | 6 | 30 | 18 | 104 | 40 | 393 | 74 |
| **Jewellery (J)** | **22** | **169** | **66** | **183** | **183** | **987** | **112** |
| Restaurant (R) | 16 | 123 | 48 | 110 | 131 | 576 | 75 |
| Travel (T) | 20 | 154 | 60 | 132 | 159 | 702 | 81 |
| Daily life (D) | 14 | 112 | 42 | 83 | 113 | 496 | 55 |
| Work (W) | 13 | 104 | 39 | 93 | 104 | 554 | 68 |
| Total | 91 | 692 | 273 | 705 | 730 | 3,708 | 465 |

48 visible cards are taught by no lesson (deck-only), so the pool totals 753; 751 can be drawn.

**Imbalance:**
- **Jewellery is the largest track** by every measure: 24% of lessons and dialogue, 26% of first-taught words, 27% of word clips.
- **Basics is thin:** 6 lessons, 30 dialogue lines.
- Daily life and Work are the smallest situational tracks, and they are exactly the "general-purpose" ones.
- No lessons are added (the path is frozen at 97), so the fix is to rebalance exposure (defaults, path order, draw weighting), not to cut jewellery.
- Vocab decks (`content/decks.json:4`): jewellery is listed **first** and is the largest (156 words; restaurant 87, travel 106, work 93, daily 100). Reorder the decks: daily, travel, restaurant, work, jewellery.

## 4. Leakage (jewellery inside non-jewellery content)

**4a. Build-drill distractors.** These are wrong answers taken from jewellery lessons, shown in unrelated scenes:

| Where | Lesson | Current wrong option | Proposed |
|---|---|---|---|
| `content/lessons/d1.json:206` (+ `:179` token) | D1 At the doctor | "…You might also like this matching pair. The necklace is eighteen dollars." | Distractor from the doctor or chemist scene, e.g. "The pharmacy closes at eight." |
| `content/lessons/d2.json:206` (+ `:179`) | D2 At the bank | same necklace sentence | A bank distractor, e.g. "The cash machine is outside." |
| `content/lessons/t6.json:205` (+ `:178`) | T6 Hotel problem | same | "The lift is on the left." |
| `content/lessons/w2.json:206` (+ `:179`) | W2 Email phrases spoken | same | "I will call you after lunch." |
| `content/lessons/w3.json:207` (+ `:180`) | W3 Meetings | same | "The printer is out of paper." |
| `content/lessons/t4.json:208` (+ `:171`) | T4 Taxi and asking the way | "The clasp is broken." | "The meter is not on." |
| `content/lessons/r6.json:199` | R6 A reservation by phone | "The clasp on it broke." | "The soup is a little cold." |
| `content/lessons/t8.json:198` | T8 At immigration | "I can reserve this bracelet for Mei." | "My flight leaves at nine." |

**4b. A non-jewellery scene built on a jewellery problem:**

| Where | Current | Proposed |
|---|---|---|
| `content/lessons/w5.json:46,57,90` (dialogue), `:229,232,257` (role-play) | W5 "A complaint call" (Work) is about a **broken clasp** and its repair | A neutral product, e.g. a broken suitcase handle or a laptop charger. Keep the complaint-call structure; re-render the changed lines and pass the ASR check. |
| `content/lexicon.json` cards taught by W5 (see 4c: escalate, compensation, apology) | Clasp examples | Re-example along with W5. |

**4c. General cards with jewellery example sentences** (15 real hits; card start line shown; "main" = the card's primary `example`, the one the card back plays):

| Card (`content/lexicon.json:line`) | First taught | Jewellery sentence | Main? |
|---|---|---|---|
| `welcome-verb` :2775 | F (basics) | "Welcome to our jewellery store." | **main** |
| `our-det` :3389 | no lesson | "Welcome to our jewellery store." / "Our jewellery is in this glass case." | **main** |
| `is-verb` :3279 | no lesson | "This necklace is beautiful." | **main** |
| `i-pron` :3224 | no lesson | "I am only looking at the rings." | example |
| `keep-verb` :1508 | F | "Please keep the ring clean." | **main** |
| `madam-noun` :2719 | F | "Madam, the clasp has been repaired." | example |
| `thank-you-phrase` :10612 | F | "Thank you. The clasp sits perfectly." | example |
| `much-adv` :11896 | F | "How much is the ring?" | example |
| `how-much-phrase` :12702 | F | "How much is the silver bracelet?" | example |
| `size-noun` :14316 | R | "What size is this ring?" | example |
| `replace-verb` :22078 | D | "We can replace the bracelet." | **main** |
| `escalate-verb` :38307 | W | "Please escalate this broken clasp to the workshop." | example |
| `compensation-noun` :38477 | W | "Fair compensation matters when the clasp is broken." | example |
| `apology-noun` :38981 | W | "Please accept my apology for the late repair of your clasp." | example |
| `currently-adv` :43419 | W | "I am currently working in a shop that sells jewellery." | example |

(`seven-num` "The alarm rings at seven" is a false positive.) Each rewrite needs a new Cantonese gloss (colloquial Traditional) and a re-render through `npm run audio` and the ASR check. `welcome-verb` and `our-det` use the same sentence, "Welcome to our jewellery store.", as `store-noun` and `jewellery-noun` (each card has its own clip of it). The two jewellery cards keep it; the general ones get their own sentence.

**4d. Learner persona in basics** (not jewellery-specific, but it assumes a retail job):

| Where | Current | Proposed |
|---|---|---|
| `content/lessons/f5.json:130` (chunk) and `:26` (lemma `salesperson-noun`) | Basics F5 "Personal details" practises "I work as a salesperson." | Practise "What do you do?" with a neutral answer ("I work in an office." / "I'm a student."). Keep `salesperson` as a work or jewellery card. |
| `content/lessons/f6.json:130,152,233`, `f5.json:301` | Basics F6 "Daily routines": "The shop is always open before lunch." / "I always close the shop after my shift." | A routine that fits anyone: "I usually start work at nine." / "I always have lunch at one." |
| F3 and F5 role-play intro (`roleplay.intro`) | 「Mei 喺櫃檯問你價錢同時間」, 「你喺櫃檯同 Mei 講…」 | 「Mei 喺店舖／接待處問你…」 or no location. |
| Cast | Mei is the partner in all 6 basics lessons **and** the jewellery coworker in 10 J lessons | Optional: a different partner for basics. Low priority. |

## 5. Daily draw

Share of the pool by first-teaching track:

| Track | Cards in the 751 pool | Share | Drawable today on `main` (has a word clip) | Share |
|---|---|---|---|---|
| Basics | 104 | 14% | 74 | 15% |
| **Jewellery** | **182** | **24%** | **112** | **23%** |
| Restaurant | 110 | 15% | 75 | 15% |
| Travel | 131 | 17% | 80 | 16% |
| Daily life | 83 | 11% | 55 | 11% |
| Work | 93 | 12% | 68 | 14% |
| Taught by no lesson | 48 | 6% | 24 | 5% |

(PR #25, still open, raises drawable cards from 488 to 551 with a similar mix.)

**How it draws today** (`web/src/Daily.tsx:26-36`, `web/src/daily.mjs:71`): cards from open or finished lessons first, then a uniform seeded shuffle of the whole pool. So once a learner's own cards run out, the draw follows track size, and jewellery comes up about 1 card in 4. A jewellery-goal learner's first draws are J1-heavy, which is right for them, but the default goal (section 2) makes that everyone.

**Proposed weighting** (still seeded by the Macau date, still with no repeats within 7 days, still open or seen lessons first):
1. **Pick tracks first, then cards.** Of the 3 cards per day, 1 comes from the learner's goal track (basics for 打好基礎) and 2 from two other tracks, rotating by date so all six tracks come round in turn. Within a track, keep "open or seen lessons first".
2. With no goal, or foundation: equal weight across the six tracks, so each is about 17% over a week whatever its size.
3. Deck-only cards (48, taught by no lesson) join the track of their deck in `content/decks.json`, or the general pool.
4. Unit test: over 60 simulated days the per-track share is within ±5 points of the target, and the goal track never exceeds 1 card a day once other tracks have cards.

## 6. Visuals and gamification

| Where | Current | Proposed |
|---|---|---|
| App icons, cover, thumb | Jewellery scenes (section 1) | Replace (P0). |
| Mascot 小燈 (`assets/art/mascot-*.webp`; `ART-STYLE.md` §4) | A harbour lantern, neutral | Keep. |
| Card art (`scripts/card-art/build.mjs:35-37`) | Badge colour by track. Jewellery uses the brand gold `#FCEFC4/#E0A820`, the same gold as the streak flame and done nodes, so jewellery cards look "brand". | Optional: give jewellery its own hue (e.g. a soft violet within the palette rules), so gold stays the reward colour. P2. |
| Card art glyphs | Every track has hand-picked glyphs; jewellery has 36 drawn ones | Fine: equal treatment. |
| Vocab deck glyph (`web/src/Vocab.tsx:58`) | `jewellery: "gem"` (one per deck) | Fine. |
| XP, levels, badges, achievements | **None exist.** XP is a number and the streak is days. No level names or achievements to rename. | Nothing to do. If added later, keep the names neutral. |
| Splash text (`web/src/App.tsx:42`) | Jewellery first (section 1) | P0 with identity. |
| Lesson heroes | Per lesson; jewellery heroes only on J lessons | Fine. |

## 7. Code naming

**Must stay (stored in the learner's IndexedDB record or in export files; renaming loses or invalidates data):**

| Identifier | Where stored | Note |
|---|---|---|
| Goal value `"jewellery"` | `profile.goal`; validated at `web/src/persist.mjs:10,29` | Keep accepting it for ever. A display rename is fine; a value rename needs a migration and a tolerant reader first. |
| Lesson ids `J1`–`J22` and the `J` prefix | `progress` keys, `lessonCursor.lessonId`, unlock rules (`web/src/unlock.mjs:14`) | Must stay. |
| Card ids (`jewellery-noun`, `necklace-noun`, …) | FSRS `cards` keys, `daily.ids` and `daily.history` | Must stay. |
| IndexedDB name `english-quest`, store `kv`, key `state` (`web/src/store.ts:57`, `web/src/persist.mjs:8`) | Database | Already neutral; must stay. |
| Content file names `content/lessons/j*.json`, audio paths `assets/audio/words/<id>*.mp3` | Imports; service-worker precache URLs | Renaming forces re-downloads and breaks cached audio. Leave. |

**Safe to rename (display only, or never persisted):**

| Identifier | Where | Note |
|---|---|---|
| `GOAL_LABEL.jewellery` text | `web/src/goals.tsx:5` | Display only. |
| GoalPick order and copy | `web/src/goals.tsx:11-16` | Display only. |
| Deck id `jewellery` | `content/decks.json:4`, route `#/vocab/jewellery`, `web/src/Vocab.tsx:58` | Not persisted. A rename only breaks bookmarks; keep it unless there's a reason. Reorder freely. |
| Onboarding default | `web/src/Onboarding.tsx:12` | Only affects new profiles. |
| `NOT_DRAWN` ids `jewelry-noun`, `elevator-noun` | `web/src/daily.mjs:11` | US-spelling contrast cards; unrelated to specialisation. |
| Tests and e2e that hard-code jewellery as the default (`e2e/goal.mjs:2,63,170-172`, `e2e/migrate.mjs:92`, `e2e/oldest.mjs:128`, `tests/goal-track.mjs`, `tests/daily-draw.mjs:102`) | Test fixtures | Update with each PR. The `migrate`/`oldest` fixtures should keep `goal: "jewellery"`, because they model real old records. |

---

## Prioritised fix plan (small PRs)

Each PR: British English; Cantonese glosses colloquial Traditional; any changed spoken line re-rendered and ASR-checked; no change to stored ids or values; existing progress opens exactly as before.

**P0: identity and onboarding**
1. **P0-1 Identity copy.** Meta description, manifest description, splash tagline, README line 3, SPEC persona, CURRICULUM "priority track", the 出處 line. Text only; no data risk. *(S)*
2. **P0-2a Tolerant goal reader.** `persist.mjs`: an unknown `profile.goal` reads as `foundation` instead of throwing. Migration test with a v3 record holding `goal: "daily"`. Ship alone so it reaches cached clients before any new goal exists. *(S)*
3. **P0-2b Onboarding default and choices.** Default goal `foundation` (or none); new order; neutral jewellery copy; add `daily` (D) and `work` (W) goals plus `TRACK_PREFIX` entries; update the goal e2e and unit tests. Merge only after P0-2a has shipped. *(M)*
4. **P0-3 Basics path contiguous.** `SHIPPED` and `path.json`: F1–F6 together, J1 and R1 to 起步; `f5.next = F6`; legacy unlock rule (J1 and R1 open if F5 is done) so nothing re-locks; test that every lesson open before is still open. *(M)*
5. **P0-4 App icon and cover.** New neutral icon set (192, 512, Apple touch) and cover. Same file names, so no manifest or service-worker change. Art task; Penny approves the artwork. *(S code, art separate)*

**P1: draw balance and leakage**
1. **P1-1 Draw by track.** Track-then-card draw in `daily.mjs` (section 5) with a balance unit test. The stored `daily` format is unchanged. *(M)*
2. **P1-2 Distractor clean-up.** The 8 build drills in section 4a (text only; check whether any of those sentences has its own clip). *(S)*
3. **P1-3 W5 complaint call.** Neutral product in place of the clasp. Re-render 3 lines and the role-play turns, and re-example the 3 W5 cards. *(M)*
4. **P1-4 General card examples.** The 15 cards in 4c: new example and gloss, re-render and ASR check. `welcome-verb` and `our-det` get their own sentence instead of sharing "our jewellery store". *(M)*
5. **P1-5 Basics persona.** F5 "salesperson" and F6 "close the shop" lines and the F3/F5 counter intros (4d). Re-render. *(M)*
6. **P1-6 Deck order.** `content/decks.json`: daily, travel, restaurant, work, jewellery. *(S)*

**P2: naming and visuals**
1. **P2-1 Labels.** Optional rename of the 「珠寶櫃檯」 label to 「珠寶銷售」; a comment in `types.ts` that stored goal values are fixed. *(S)*
2. **P2-2 Card-art colours.** Jewellery gets its own badge hue so gold stays the reward colour; rebuild the 751 SVGs. *(S)*
3. **P2-3 Cast.** Optional separate partner for basics instead of Mei. *(M, content and audio)*

**Not to change:** stored goal values, lesson ids, card ids, database name, content and audio file names (section 7).
