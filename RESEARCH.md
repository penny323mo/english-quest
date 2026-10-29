# 《情景英文》PREP RESEARCH — Build-ready brief

**Prepared:** 2026-10-29 (Asia/Macau)  
**Project codename:** Scenario English / 情景英文  
**Target:** iPhone-first static web app (GitHub Pages) for Cantonese speakers at near-zero English  
**Quality bar:** Duolingo / Babbel / Speak commercial polish — no primary-school frames, no emoji clip-art, no card stacks  
**Live destination (expected):** `https://penny323mo.github.io/grokbot/projects/scenario-english/` (or nightly naming)

> Teaching wrong English is unacceptable. Every word must ship with sense-matched IPA + audio that has been cross-checked.

---

## 0. Executive decisions (read first)

| Decision | Choice | Why |
|---|---|---|
| Pedagogy | Speak-style **Learn → Practice → Apply** inside scenario units; Duolingo-style linear **Path** for mastery | Speak gets people speaking in seconds; Path prevents skipping foundations |
| UI language | Traditional Chinese + 廣東話 explanations; English content with Jyutping only when needed for Cantonese tips | Learner is Macau Cantonese; ECDICT/CC-CEDICT for Mandarin Chinese glosses, hand-write Cantonese tips for core vocab |
| Audio primary | **Pre-rendered Piper LJSpeech** (public-domain dataset) MP3s for all lesson lines + word cards; **Wiktionary/Commons real recordings** preferred for dictionary headwords when licence OK | Works offline on GitHub Pages; iOS Safari Web Speech quality is uneven; Edge-TTS nicer but commercial redistribution unclear |
| Audio fallback | Web Speech API (`en-US`) for ad-hoc / rare words only | Always available on iOS; never the teaching source of truth |
| Dictionary spine | **kaikki.org Wiktextract English** (POS + senses + sounds) + **CMUdict** cross-check + **Free Dictionary API / Commons audio** + **ECDICT** ZH gloss + **CC-Canto** Jyutping | Sense-aware; handles heteronyms |
| SRS | `ts-fsrs` (MIT, FSRS-7) in IndexedDB | Best open scheduler; Anki-class science |
| Speaking check MVP | Web Speech Recognition (`webkitSpeechRecognition`) on iOS Safari 14.5+ → transcript match + Cantonese-error score rules | Works without heavy WASM; Whisper/transformers.js = later polish (iOS memory fragile) |
| Art | Premium **editorial illustration** — soft cinematic lighting, cohesive palette, diegetic scenes (jewellery counter, cabin, restaurant). Generated with locked style bible + seed/ref. Prefer Cursor `GenerateImage` + HF Z-Image Turbo for batch; optional FLUX.1-schnell / SDXL if local GPU later | Penny rejects cheap/generic; Open Peeps only for tiny avatar chips, never hero scenes |
| Scope tonight | **V1 polished** of Foundations + 3 scenario themes (Jewellery / Travel / Restaurant), ~15 scenario lessons, full dictionary pipeline for taught words, FSRS review, speaking practice | Duolingo “V1 not MVP” — ship fewer units, finish them |

---

## 1. Competitive teardown — what successful apps include

Sources: [Duolingo Handbook](https://handbook.duolingo.com/), [Duolingo 2025 highlights](https://blog.duolingo.com/product-highlights/), [Speak method](https://www.speak.com/blog/how-speak-reinvents-language-learning), [Babbel Speak](https://support.babbel.com/hc/en-us/articles/25875402999826-Babbel-Speak), [ELSA](https://elsaspeak.com/en), Cake/SpeakShark comparisons, Memrise/Anki/LingoDeer/HelloTalk reviews, Reddit learner threads.

### 1.1 Feature matrix

| Capability | Duo | Babbel | Speak | ELSA | Cake | Memrise | Anki | LingoDeer | HelloTalk | **We must** |
|---|---|---|---|---|---|---|---|---|---|---|
| Onboarding goal + daily minutes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | light | ✓ scenario goal pick |
| Level / placement | Score/path | ✓ | ✓ | ✓ | light | light | ✗ | ✓ | ✗ | 8-item placement + self-rate |
| Linear mastery path | Path | units | courses | topics | feed | decks | decks | units | ✗ | Path of scenarios |
| Scenario / role-play | Stories | Speak tab | **core** | workplace | video clips | ✗ | ✗ | limited | chat | **core** |
| Phrase patterns (chunks) | some | ✓ | **core** | ✗ | ✓ | ✓ | cards | ✓ | ✗ | **core** |
| Grammar explain in L1 | weak | strong | Tutor | weak | weak | weak | decks | **strong** | peers | Cantonese tip cards |
| Vocab + collocations | flashcards | ✓ | ✓ | weak | ✓ | ✓ | ✓ | ✓ | ✗ | word card: def / collocation / 粵解 / audio |
| Spaced repetition | practice | review | review | weak | review | ✓ | **FSRS/SM** | review | ✗ | ts-fsrs |
| Speaking from second 10 | speaking ex. | Speak | **yes** | drills | repeat | ✗ | ✗ | record | voice msgs | shadow + role-play |
| Phoneme feedback | weak | weak | forgiving | **ELSA** | weak | ✗ | ✗ | weak | peers | Cantonese-error rubric + transcript |
| Gamification | streak/XP/league | light | light | scores | light | points | ✗ | streaks | social | streak + XP + calm (no hearts punish) |
| Native / real audio | TTS+char | studio | video | studio | video | native clips | decks | native | humans | Commons + Piper |
| L1 for Chinese speakers | EN↔ZH courses uneven | paid | EN focus | EN | EN | some | DIY | strong for Asian L2 | social | 粵語-first UX |

### 1.2 What learners say they need (esp. Chinese / Cantonese)

From Reddit + reviews (paraphrased consensus):

- **Enough sentence variety** — Duo drills the same 3 sentences until memorised; words don’t transfer.
- **Real speaking without anxiety** — want AI role-play that does **not** interrupt mid-sentence (Babbel Speak model), then feedback after.
- **Grammar + why**, in their language — Duo removed many grammar snapshots; LingoDeer praised for Asian-language grammar depth.
- **Vocabulary tracker** they own — list of learned words with review due.
- **Pronunciation that isn’t binary pass/fail nonsense** — Duo ASR often accepts gibberish / rejects good attempts; ELSA-style sound-level feedback is the gold for Chinese L1.
- **Workplace / travel / service scenarios** that match Macau jobs (tourism, retail jewellery, F&B).

### 1.3 Cantonese-speaker pronunciation hotspots (teach explicitly)

From [EdUHK HKE feature list](https://corpus.eduhk.hk/english_pronunciation/wp-content/uploads/2020/03/Pronunciation-Feature-list-of-HKECantonese-speakers.pdf) and CityU / Chan & Li research:

| # | Pattern | Example | Teaching tip (粵) |
|---|---|---|---|
| 1 | /θ/ → [f]/[t]/[s] | thanks → fanks | 舌尖輕咬上牙，吹氣 |
| 2 | /ð/ → [d]/[z] | this → dis/zis | 同上但要有聲 |
| 3 | /v/ → [f]/[w] | very → ferry/wery | 下唇輕觸上牙 |
| 4 | /w/ vs /v/ | wine / vine | 圓唇 vs 咬唇 |
| 5 | /l/ ↔ /n/ onset | light / night | 澳門／香港常見混淆 |
| 6 | final /l/ delete or vocalise | feel → fee | 舌尖要頂到 |
| 7 | /r/ → [l]/[w] | right → light/wight | 美式捲舌 tip |
| 8 | final consonant drop | help → hel | 爆破要收尾 |
| 9 | long/short vowels | ship / sheep | 拉長 vs 短促 |
| 10 | /æ/ vs /e/ | bad / bed | 口型更開 |
| 11 | no schwa / syllable-timed | pho-TO-gra-pher | 弱讀練習 |
| 12 | missing linking | a lot of | 連讀 a-lo-tof |

**Product rule:** every scenario lesson tags 1–2 “音點” (sound focuses). Review queue prioritises words hitting those sounds.

---

## 2. Learner persona simulation

### 2.1 Persona — 「阿琳」Lam, 28, Macau

- Works counter at a jewellery shop in Senado Square corridor; weekends help family cha chaan teng.
- School English: can write “How are you / My name is / Thank you”, freezes when tourists speak fast.
- Phone: iPhone, Safari, often on tram/wifi; 12–15 min/day after dinner.
- Goal in 90 days: greet customers, describe materials/price, take restaurant orders, survive airport + hotel check-in.
- Anxiety: afraid of being laughed at; needs judgment-free AI partner + 粵語 safety net.
- Motivation spikes when lesson = tomorrow’s shift (jewellery scenario first).

### 2.2 Target CEFR path (pre-A1 → A2/B1)

| Stage | CEFR | Hours (app) | Active lemmas | Can do |
|---|---|---|---|---|
| 0 Foundations | pre-A1 | 4–6 h | ~120 | greet, numbers, polite forms, alphabet sounds |
| 1 Shop floor | A1 | +12 h | ~400 total | jewellery greeting → sale close |
| 2 Travel | A1+ | +10 h | ~650 | airport, hotel, taxi, directions |
| 3 Restaurant | A1+/A2 | +10 h | ~850 | order, allergy, bill, complaint soft |
| 4 Daily life + work | A2 | +15 h | ~1200 | shopping, phone, email soft, small talk |
| 5 Stretch | A2+/B1 | +20 h | ~1800 | negotiate, explain problem, past stories |

Vocab targets align with [NGSL](https://www.newgeneralservicelist.com/new-general-service-list) (~2809 words, ~92% coverage) + [NGSL-Spoken](https://www.newgeneralservicelist.com/ngsl-spoken) (721) for early speaking priority. Penguin/CEFR reader guidance: Pre-A1 ~350, A1 ~550–1000, A2 ~1000–1200 lemmas.

### 2.3 Fifteen scenario lessons (MVP→V1 curriculum)

Each lesson ≈ 8–12 min, **target 18–28 new/activated lemmas**, 6–10 phrase patterns, 1 sound focus.

**Unit F — Foundations (unlock before scenarios)**  
F1 Sounds & breath · F2 Greetings & names · F3 Numbers, money, time · F4 Polite toolkit (please/thank/sorry/excuse)

**Unit J — Jewellery salesperson** (~22 lemmas/lesson avg)

| ID | Lesson | Target lemmas | Sound focus |
|---|---|---|---|
| J1 | Greeting a customer | 20 | /θ/ in *thank*, *with* |
| J2 | Asking what they are looking for | 22 | /w/ vs /v/ |
| J3 | Naming pieces (ring, necklace, bracelet, earring) | 24 | final /ŋ/ |
| J4 | Materials (gold, silver, diamond, jade) | 22 | /ʤ/ jade |
| J5 | Size, try-on, mirror | 20 | /r/ try |
| J6 | Price & payment | 24 | numbers + /θ/ |
| J7 | Soft close & farewell | 18 | linking |

**Unit T — Travel**

| ID | Lesson | Lemmas | Sound |
|---|---|---|---|
| T1 | Airport check-in | 24 | /ʃ/ check-in, boarding |
| T2 | Security & directions | 22 | /θ/ through |
| T3 | Hotel check-in | 24 | /l/ vs /n/ |
| T4 | Taxi & getting around | 20 | final consonants |
| T5 | Asking for help when lost | 22 | schwa in *about* |

**Unit R — Restaurant**

| ID | Lesson | Lemmas | Sound |
|---|---|---|---|
| R1 | Entering & seating | 18 | /r/ table |
| R2 | Ordering food & drink | 26 | /v/ very, vegetarian |
| R3 | Allergies & special requests | 22 | consonant clusters |
| R4 | During the meal / problems | 20 | /θ/ something |
| R5 | The bill & tipping | 18 | /ɪ/ vs /iː/ bill/meal |

*(F1–F4 + J1–J7 + T1–T5 + R1–R5 = 4 + 7 + 5 + 5 = 21 lessons; ship **15** in first nightly by cutting T5, R4–R5, J7 to “coming soon” OR ship all Foundations + J1–J5 + T1–T3 + R1–R2 as the hard 15.)*

**Recommended ship-15 for night-1:** F1–F4, J1–J5, T1–T3, R1–R2.

### 2.4 Grammar sequencing (light, scenario-tied)

1. Be / subject pronouns / possessives  
2. a/an/the + singular/plural  
3. This/that/these/those  
4. Can I…? / Could I…? / I’d like…  
5. There is/are  
6. Present simple (habits, shop facts)  
7. Present continuous (looking, trying)  
8. Prepositions of place  
9. Count/non-count + some/any  
10. Past simple of high-frequency verbs (went, bought, said) — late A1  
11. Comparatives for jewellery (heavier, more expensive) — A2 start  

Never dump grammar walls. Each tip card: **Pattern → 2 examples → 1 粵語 why → 1 micro drill**.

### 2.5 Universal lesson flow (every scenario)

Modeled on Speak’s Learn / Practice / Apply + Duo bite-size + Cake shadowing:

1. **Hook scene** (full-bleed illustration, 3s ambient) — diegetic, not a card  
2. **Goal line** in 粵語 + English can-do (“你能夠同客人打招呼”)  
3. **Hear** — dialogue audio (normal → slow) with karaoke highlight  
4. **Understand** — tap chips for meaning; Cantonese gloss on hold  
5. **Chunk** — extract 3–5 phrase patterns (`Welcome to ___`, `How may I ___ you?`)  
6. **Repeat / shadow** — hold-to-record or tap mic; show waveform; playback side-by-side  
7. **Build** — reorder / fill gap / choose response (3 distractors that are plausible)  
8. **Role-play Apply** — AI partner lines pre-scripted branching (3 turns); no mid-interrupt  
9. **Quiz** — 5 items mixing listen, speak, meaning  
10. **Sound focus** — 60s micro drill for tonight’s phoneme  
11. **Recap + SRS enqueue** — new cards enter FSRS; XP + streak  
12. **Next unlock** preview (curiosity, not FOMO spam)

---

## 3. Full sample lessons

### 3.1 J1 — Jewellery salesperson: greeting a customer

**Can-do:** Greet a walk-in, offer help, respond to “just looking.”  
**Lemmas (20):** welcome, jewellery/jewelry (teach both spellings, prefer *jewellery* for Macau/UK), store, help, today, looking, just, please, thank you, of course, morning/afternoon, sir/madam (optional), come in, how may I, for you, take a look, certainly, browsing, let me know, enjoy  

**Phrase patterns:**  
- `Welcome to ___`  
- `How may I help you (today)?`  
- `I’m just looking.` / `Just browsing, thanks.`  
- `Of course. Please take a look.`  
- `Let me know if you need anything.`

**Dialogue (customer C / salesperson S):**  
1. S: Welcome to our jewellery store. How may I help you today?  
2. C: Hi. I’m just looking, thank you.  
3. S: Of course. Please take a look around.  
4. C: This necklace is beautiful.  
5. S: Thank you. Let me know if you need anything.

**Flow beats:** Hook (warm shop interior, soft gold light) → Hear both speeds → Tap “jewellery / welcome / just looking” → Shadow line 1 slow → Choose response when customer says “just looking” (correct: Of course…) → 3-turn role-play → Quiz → Sound focus /θ/ in *thank*, *anything* → SRS.

**Audio files (pre-rendered on box):**  
`samples/jewellery-greeting.mp3`, `jewellery-greeting-slow.mp3`, `jewellery-necklace.mp3`, `thanks.mp3`

### 3.2 R2 — Restaurant: ordering

**Can-do:** Order a main + drink politely; ask for a recommendation.  
**Lemmas (~26):** menu, order, I’d like, could I have, water, sparkling, still, chicken, rice, noodles, vegetarian, spicy, recommendation, for here, to go, allergic, please, thank you, anything else, that’s all, appetizer, main, dessert, bill (preview), delicious, medium  

**Patterns:**  
- `Could I have ___, please?`  
- `I’d like the ___.`  
- `What do you recommend?`  
- `I’m allergic to ___.`  
- `That’s all, thank you.`

**Dialogue:**  
1. Waiter: Are you ready to order?  
2. You: Yes. Could I have the chicken rice, please?  
3. Waiter: Anything to drink?  
4. You: Sparkling water, please. What do you recommend for a starter?  
5. Waiter: The soup of the day is very good.  
6. You: I’ll try that. That’s all, thank you.

**Flow:** same 12-beat template; sound focus /v/ in *very*, *vegetarian*; role-play with 2 menu branches.

**Audio:** `samples/restaurant-table.mp3`, `restaurant-check.mp3`

---

## 4. Lexicon & pronunciation accuracy (CRITICAL)

### 4.1 Open dictionary datasets

| Source | URL | Licence | Use |
|---|---|---|---|
| **kaikki.org / Wiktextract English** | https://kaikki.org/dictionary/rawdata.html · https://kaikki.org/dictionary/English/ | Wiktionary dual CC BY-SA / GFDL; audio per-file Commons licence | **Primary spine:** word → POS → senses → `sounds[]` (ipa, mp3_url, ogg_url, tags) |
| **Free Dictionary API** | https://dictionaryapi.dev/ · https://api.dictionaryapi.dev/api/v2/entries/en/{word} | Aggregates Wiktionary; per-audio licence in JSON (e.g. BY-SA 3.0) | Quick lookup + multiple phonetics for heteronyms (verified: `read` → `/ɹiːd/` and `/ɹɛd/` with separate audio) |
| **Wiktionary / Commons audio bulk** | kaikki rawdata audio pack (~942k files) | **Per-file** (often CC BY / BY-SA); never assume one licence | Prefer real human recordings for headwords |
| **CMUdict 0.7b** | http://www.speech.cs.cmu.edu/cgi-bin/cmudict/ · BSD-style | ARPAbet; convert to IPA | Cross-check IPA; stress |
| **Open English WordNet 2025** | https://en-word.net/downloads | CC BY 4.0 (+ Princeton notice) | Sense IDs / synsets / examples — **no IPA**; link senses |
| **ECDICT** | https://github.com/skywind3000/ECDICT | **MIT** (author confirmed commercial OK) | EN→ZH definitions, tags (cet4/oxford), frequency — **Mandarin Chinese**, not Cantonese |
| **CC-CEDICT** | https://cc-cedict.org/ | **CC BY-SA 4.0** | ZH→EN; attribution + share-alike |
| **CC-Canto + CEDICT Cantonese readings** | https://www.cccanto.org/download.html | **CC BY-SA 3.0** | Jyutping readings |
| **NGSL 1.2 / NGSL-Spoken** | https://www.newgeneralservicelist.com/ | Creative Commons (project site) | Curriculum frequency backbone |
| **Tatoeba** | https://en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus | Text **CC BY 2.0 FR** (attribute author); **audio separate per contributor** | Hand-curate examples only; never bulk-trust |
| **h2p-parser** | https://github.com/ionite34/h2p-parser/ | check repo licence | Optional heteronym POS→phoneme assist |

### 4.2 Heteronym rule (must not teach wrong)

Examples that **must** key on POS + sense, not orthography alone:

| Word | Sense | IPA | POS |
|---|---|---|---|
| read | present | /ɹiːd/ | verb |
| read | past | /ɹɛd/ | verb |
| live | reside | /lɪv/ | verb |
| live | not recorded | /laɪv/ | adj |
| bow | weapon / ribbon | /boʊ/ | noun |
| bow | bend | /baʊ/ | verb |
| wind | air | /wɪnd/ | noun |
| wind | turn | /waɪnd/ | verb |
| bass | fish | /bæs/ | noun |
| bass | low pitch | /beɪs/ | noun/adj |
| close | shut | /kloʊz/ | verb |
| close | near | /kloʊs/ | adj |

**Curriculum authoring rule:** every vocab item is a tuple  
`(lemma, pos, senseId, ipa, audioAssetId, glossYue, glossZh, collocations[], exampleSentenceId)`.  
Never store bare `word → audio`.

### 4.3 Verification pipeline (build this before mass content)

```
for each curriculum lemma L with intended POS P and sense S:
  1. FETCH_WIKT = kaikki/wiktextract entry for L
  2. FILTER sounds & glosses where pos == P (and sense tags if present)
  3. IPA_A = preferred IPA from wikt (tag: US or UK — pick US for voice consistency, note UK variants)
  4. IPA_B = CMUdict ARPAbet→IPA for L (if multiple, pick by POS heuristics / h2p)
  5. IPA_C = Free Dictionary API phonetics[].text for matching audio entry
  6. NORMALISE (strip brackets, stress marks comparable)
  7. if IPA_A ≈ IPA_B or IPA_A ≈ IPA_C → status = IPA_OK
     else → status = IPA_REVIEW (block ship; human/LLM-with-sources check)
  8. AUDIO:
     a. Prefer Commons/Wiktionary mp3 whose audio-ipa matches IPA_A (licence copied into credits.json)
     b. Else Free Dictionary API audio URL with licence object — download + mirror locally for Pages
     c. Else Piper LJSpeech TTS of a sense-disambiguating carrier sentence
        e.g. past-read: "Yesterday I read the book."  present-read: "I read the news every day."
  9. GLOSS:
     a. ECDICT ZH for learner card secondary line
     b. Hand Cantonese tip for top 800 words (required for V1 taught set)
  10. Write lexicon row + sha256(audio) + sources[] + verified_at
  11. QA page: flash “suspect” list where IPA sources disagree or audio missing
```

**Nightly CI check:** unit test bank of 50 heteronyms + 100 random NGSL words must stay IPA_OK.

**Proven live:** Free Dictionary returns separate entries for `read` with `/ɹiːd/` (read-1-uk/us) and `/ɹɛd/` (read-2-us) — use this pattern in importers.

### 4.4 Pronunciation strategy (product)

1. **Dictionary audio** = human recording whenever licence allows.  
2. **Lesson dialogue audio** = Piper LJSpeech pre-render (consistent voice “Teacher Lin”) + slow length-scale 1.35.  
3. **On-device Web Speech** = only for “hear again” extras / user-typed words.  
4. **Speaking practice scoring (MVP):**  
   - Capture via `webkitSpeechRecognition` (iOS Safari partial support 14.5+)  
   - Normalise transcript; score token overlap + keyword hits  
   - Overlay Cantonese-error rules (if target has /θ/ and transcript has `f`/`t`/`s` substitution patterns → tip)  
5. **Later:** transformers.js Whisper `tiny.en` WASM-only on iOS (WebGPU crashes Safari — known issues); never block lesson on Whisper load.

---

## 5. Free runtime / asset resources

### 5.1 TTS (verified on this box 2026-10-29)

| Engine | Licence | iPhone Pages? | Notes |
|---|---|---|---|
| **Piper + en_US-ljspeech-medium** | Piper GPL-3; **LJSpeech dataset public domain**; trained from scratch | Ship **pre-rendered MP3** | Installed in `PREP-english-app/.venv`; samples in `samples/*.mp3` — clear, slightly flat, OK for teaching |
| Piper lessac / amy (Lessac-finetunes) | **Blizzard 2013 research-only** — **DO NOT USE commercially** | — | Deleted from PREP after check |
| Piper libritts | Dataset **CC BY 4.0** | Pre-render OK with attribution | Multi-speaker alternative |
| **Kokoro-82M** | **Apache-2.0** | Pre-render | Better quality; needs torch — install later for batch polish |
| Web Speech API | browser voices | ✓ iOS | Quality varies; not source of truth |
| edge-tts JennyNeural | Wrapper LGPLv3; **MS Read Aloud commercial redistribution unclear** | Prototype only | Sample `samples/edge-jewellery-greeting.mp3` sounds more natural — **do not ship in product** without Azure licence |

**Quality note (human listen on box via duration/bitrate):** Piper LJSpeech intelligible, good for slow learner mode; Edge more “premium”; Kokoro recommended upgrade path under Apache-2.0.

### 5.2 Speech recognition

- **Web Speech Recognition:** partial on Safari iOS 14.5+ ([caniuse](https://caniuse.com/speech-recognition)); HTTPS + mic permission.  
- **transformers.js Whisper:** possible with WASM + `tiny.en`; memory crashes reported on iOS — feature-flag off by default.

### 5.3 SRS

- **`ts-fsrs`** npm — MIT — https://www.npmjs.com/package/ts-fsrs — FSRS-7 via `DefaultScheduler()`. Persist cards in IndexedDB.

### 5.4 Illustrations — premium AI scenes (required)

Penny: **on-topic AI scenes, consistent premium style, not cheap/generic.**

**Art direction bible (lock this):**

- Style name: **「Harbor Glow Editorial」**  
- Look: soft cinematic key light, shallow depth, painterly-but-clean illustration (think modern travel-magazine editorial × gentle anime-influenced proportions without chibi), warm gold + jade + night-blue palette for Macau harbour night accents  
- Characters: recurring cast — **Mei** (salesperson), **Tom** (tourist), **Chef Ana**, **Agent Kai** — same face/hair/wardrobe every scene  
- Never: emoji, flat clip-art, pure white card backgrounds, Comic Sans energy, random style drift, watermark clutter  
- Composition: iPhone 390×844 safe — hero 9:16 or 3:4; UI chrome overlays bottom 28%

**Prompt template:**

```
[Harbor Glow Editorial illustration], consistent character design sheet style,
{SCENE}, {CHARACTER_LIST with locked wardrobe},
soft cinematic lighting, warm gold and jade accents, clean painterly digital art,
premium language-learning app scene, no text, no watermark, no logo,
cohesive color grade, high detail faces, iPhone vertical composition
Negative: blurry, deformed hands, emoji, clipart, collage, watermark, lowres, childish crayon
```

**Consistency method:**

1. Generate **character reference sheets** first (front/3-quarter) with fixed seed; save under `art/refs/`.  
2. Every scene prompt includes “same character as reference” + attach refs via `GenerateImage.reference_image_paths` or HF img2img.  
3. Fixed seed per character; shared palette hex: `#1B1F3B` `#C6A75E` `#2F6F6A` `#F4EDE4`.  
4. Human QA: reject if character face drifts > “same person?” gut check.  
5. Optional later: train tiny style LoRA on 20 approved stills (SDXL / FLUX.1-schnell Apache).

**Generators usable from this environment:**

| Tool | How | Licence / notes |
|---|---|---|
| **Cursor `GenerateImage`** | `CallDynamicTool` cursor namespace | Primary for hero stills + refs; supports `reference_image_paths`, aspect `9:16` |
| **HF `gr1_z_image_turbo_generate`** | user-Huggingface-skills MCP (account @Penny323) | Fast batch; fix `seed` for consistency |
| FLUX.1-schnell | HF / local if GPU | **Apache-2.0** — commercial OK |
| FLUX.1-dev | HF | **Non-commercial** — avoid for shipped art |
| SDXL | local/HF | Commercial OK generally |
| Open Peeps / Humaaans | CC0 | **Only** tiny avatars / empty states — never lesson heroes |
| Storyset | Freepik terms, attribution | Backup only; feels generic vs Penny bar |

---

## 6. Tech stack (static GitHub Pages)

- **App:** Vite + React (or vanilla TS if nightly prefers) + CSS modules; iPhone-first 390×844  
- **Routing:** hash router for Pages  
- **State:** Zustand + IndexedDB (`idb`) for progress, FSRS cards, settings  
- **Content:** JSON lessons in `/content` — dialogues, patterns, lexicon IDs  
- **Audio:** `/audio/words/*.mp3`, `/audio/lines/*.mp3` (Piper + Commons mirrors)  
- **Lexicon DB:** build-time script → `lexicon.json` (+ optional SQLite→JSON) from verification pipeline  
- **TTS build tool:** `PREP-english-app/.venv` + Piper LJSpeech already downloaded  
- **Analytics:** none required night-1; local counters only  
- **Repo path:** `penny323mo/grokbot` projects folder  

**iPhone Safari constraints:** no autoplay with sound without gesture; mic only on user tap; avoid >50MB first load — lazy-load unit audio packs.

---

## 7. Feature priority

### MVP (must work end-to-end tonight → still V1 quality)

1. Onboarding: name, goal (jewellery/travel/restaurant), daily minutes, tiny placement  
2. Home Path with Foundations + ship-15 scenarios  
3. Full lesson flow (hear → understand → shadow → build → role-play → quiz → sound focus)  
4. Lexicon cards with verified IPA + audio + 粵解 + collocation  
5. FSRS review session  
6. Streak + XP (calm, no punishing hearts)  
7. Premium scene art for each shipped lesson (even if some reuse poses)  
8. Credits page with all licences  

### V1 (same week loops)

- Branching role-play (3 endings)  
- Heteronym-safe dictionary browser for all taught words  
- Pronunciation tips per Cantonese error class  
- Slow/normal/toggle + karaoke  
- Progress CEFR meter  
- Offline cache (service worker)  

### V1.x

- Kokoro re-render all lines  
- Whisper optional scoring  
- More units (Daily life, Phone English)  
- HelloTalk-like “share streak” optional  

---

## 8. UX / art direction

- **Diegetic UI:** lessons feel like walking into the shop/airport/restaurant. Bottom sheet controls, not floating white quiz cards as the hero.  
- **Typography:** one strong Latin display + clean Traditional Chinese body (system PingFang HK / Noto Sans TC).  
- **Motion:** 200–280ms soft; celebrate with scene character reaction, not confetti spam.  
- **Empty / error:** illustrated Mei shrugs — never “404 emoji”.  
- **Accessibility:** tap targets ≥44px; captions always available; reduce-motion respect.

---

## 9. Quality rubric → 99.99 (score every round)

Score each dimension 0–100. **Ship bar: all ≥ 95 and weighted total ≥ 99.00; “99.99” needs all ≥ 99 with zero critical defects.**

| Dim | Weight | 40 | 70 | 90 | 99 |
|---|---|---|---|---|---|
| **Art / scene** | 12% | clip-art/emoji | mixed styles | cohesive Harbor Glow | cinematic, character-locked, full-bleed |
| **UI / iPhone** | 12% | overflow, tiny taps | usable | polished safe-areas | store-ready, diegetic, no card-stack smell |
| **Lexicon accuracy** | 18% | wrong IPA/audio | mostly OK | verified pipeline, rare misses | 0 heteronym errors, dual-IPA check green, credits complete |
| **Pronunciation UX** | 12% | no audio / robotic only | TTS everywhere | human+ TTS mix, slow mode | Commons preferred, Cantonese tips, reliable mic loop |
| **Pedagogy / scenarios** | 15% | word lists | dialogues | Speak-like Learn/Practice/Apply | transfer-ready patterns, workplace-real |
| **Handling / speaking** | 10% | tap-only | some shadow | role-play works on iPhone mic | forgiving mid-convo, useful feedback |
| **Review / SRS** | 8% | none | crude queue | FSRS due cards | retention-aware, sound-error bias |
| **Flow / onboarding** | 5% | confusing | completable | clear Path | delightful, goal-aligned |
| **Perf (iPhone Safari)** | 5% | jank >3s | OK wifi | <2s lesson start cached | silky, offline pack |
| **Audio quality** | 3% | broken | uneven | clear LJSpeech | Kokoro/human grade |

**Critical defects (any = auto-fail round):** wrong pronunciation taught; lesson soft-locks; mic permission flow broken; horizontal overflow on 390px; unlicensed asset shipped; English gloss nonsense.

**Loop protocol (Penny rule):** after every round — screenshots checked by agent, scores table, fixed vs remaining, next-round plan in Cantonese.

---

## 10. PREP artifacts already on disk

```
/workspace/nightly/PREP-english-app/
  RESEARCH.md          ← this file
  .venv/               ← piper-tts, edge-tts
  voices/
    en_US-ljspeech-medium.onnx(+json)   # public-domain training set
  samples/
    jewellery-greeting.mp3 (+ slow)
    jewellery-necklace.mp3
    restaurant-table.mp3
    restaurant-check.mp3
    thanks.mp3
    edge-jewellery-greeting.mp3         # prototype only — do not ship
```

Regenerate line audio:

```bash
cd /workspace/nightly/PREP-english-app
echo "TEXT" | .venv/bin/piper -m voices/en_US-ljspeech-medium.onnx -f out.wav
# slow: --length-scale 1.35
ffmpeg -y -i out.wav -codec:a libmp3lame -qscale:a 4 out.mp3
```

---

## 11. Credits skeleton (must ship in app)

- Piper TTS + LJ Speech (public domain recordings)  
- Wiktionary / Wikimedia Commons contributors (per-file)  
- Free Dictionary API / meetDeveloper  
- CMU Pronouncing Dictionary  
- ECDICT (MIT) — skywind3000  
- CC-CEDICT (CC BY-SA 4.0) · CC-Canto (CC BY-SA 3.0)  
- NGSL — Browne & Culligan  
- ts-fsrs — open-spaced-repetition  
- Tatoeba sentence authors (if used)  
- Illustration model + seeds documented per asset  

---

## 12. Suggested night-1 build order

1. Scaffold Pages app + Path shell + diegetic home  
2. Lexicon pipeline script for ship-15 vocab (block on IPA_REVIEW)  
3. Piper-render all dialogue lines + word audio gaps  
4. Generate character refs + 15 lesson hero scenes (fixed style)  
5. Implement J1 + R2 completely as gold templates  
6. Clone template across remaining ship-15  
7. FSRS review + streak  
8. iPhone Playwright 390×844 dogfood; score rubric; fix until ≥ bar or report gaps  

---

*End of RESEARCH.md — ready for nightly orchestrator consumption.*
