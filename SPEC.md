# English Quest（情景英文）— SPEC

**Side quest** · independent repo `penny323mo/english-quest` · **not** the daily grokbot nightly.  
**Live:** https://penny323mo.github.io/english-quest/  
**Supervisor:** Grok Duet · **Coder:** grok 4.7 · **Reviewer:** grok (this orchestrator’s grok pane)  
**Authority:** `DECISIONS.md` overrides `RESEARCH.md` wherever they conflict. Read both.

Quality bar: commercial Duolingo / Babbel / Speak polish. **No** primary-school frames, emoji clip-art, white card stacks, or “ABC then stop” toys. Wrong English taught = automatic fail.

---

## 1. Goal & users

Help Cantonese speakers in Macau/HK who only know “How are you / Thank you” build usable spoken English through **scenario role-play**, accurate pronunciation, and spaced review.

Persona: 「阿琳」— jewellery counter worker, iPhone Safari, 12–15 min/day, anxious about being laughed at. UI in **Traditional Chinese / 廣東話**; English is the learning content.

---

## 2. Night-1 scope (HARD CAP)

Ship **exactly 6 lessons**, each **fully polished end-to-end** (art, audio, lexicon, flow, speaking). Prove the lesson template. Do **not** stub the other 9 of the eventual 15.

| ID | Lesson | Sound focus |
|----|--------|-------------|
| **F1** | Sounds & breath (alphabet sounds that matter, breath, schwa intro) | long/short vowels |
| **F2** | Greetings & names | /θ/ in *thank* |
| **J1** | Jewellery: greeting a customer | /θ/ *thank*, *with* |
| **J2** | Jewellery: what are you looking for? | /w/ vs /v/ |
| **T1** | Travel: airport check-in | /ʃ/ check-in, boarding |
| **R1** | Restaurant: entering & seating | /r/ table |

Use RESEARCH.md §3.1 for J1 dialogue gold template; invent equally complete content for the other five following the same 12-beat flow (§2.5). Path may show “coming soon” locks for later lessons — never broken links.

---

## 3. Pedagogy & features

- **Learn → Practice → Apply** inside each lesson; linear **Path** on home.
- Universal lesson beats: Hook scene → Goal (粵+EN) → Hear (normal+slow, karaoke) → Understand → Chunk patterns → Shadow/speak → Build → Role-play Apply (3 turns, no mid-interrupt) → Quiz → Sound focus → Recap + FSRS enqueue → Next preview.
- **Calm streaks + XP** — no hearts, no punish-fail lockouts.
- **FSRS** via `ts-fsrs` (MIT), cards in IndexedDB.
- **Speaking:** Web Speech Recognition when available; **mandatory graceful fallback** — record and play side-by-side with model audio. Lessons **never** block on ASR/mic failure.
- Pronunciation tips for Cantonese speakers: mouth-position notes + **minimal pairs** (ship/sheep, wine/vine, light/night, thank/sank…). **Do not** teach English sounds via Jyutping approximations. Jyutping may exist only as an optional settings toggle for Chinese glosses, never as “how to say this English sound.”

---

## 4. Lexicon pipeline (CRITICAL)

Every vocab item is a tuple, never bare `word → audio`:

`(lemma, pos, senseId, ipa, syllables, stress, audioAssetId, glossYue, glossZh, collocations[], exampleSentenceId, sources[], verified_at, status)`

### Pipeline
1. Pull sense/POS/IPA from kaikki/Wiktextract or Free Dictionary API.
2. Cross-check with **CMUdict** (US ARPAbet→IPA) + FreeDict phonetics.
3. Show **stress marks** and **syllable splits** on every word card.
4. If CMUdict and FreeDict/Wikt **disagree** → status `IPA_REVIEW`, append to `review/flags.json`, **do not silently pick**. Block SHIP while any taught lemma is `IPA_REVIEW` without human resolution noted.
5. Audio must match the **intended sense** (read/read, live/live, close/close…). Prefer Commons/Wikt human audio with licence recorded; else TTS of a sense-disambiguating carrier sentence.
6. Gloss: ECDICT ZH secondary; **hand-check** Cantonese (`glossYue`) for naturalness on all night-1 lemmas.
7. Write `content/lexicon.json` + sha256(audio) + sources.

### Automated check (required test)
`tests/lexicon-check.*` must fail the suite if any taught lemma has: missing IPA, missing audio file, `IPA_REVIEW` unresolved, sense/audio mismatch flag, or missing stress/syllables. Also include a fixed heteronym bank (read, live, bow, wind, bass, close, …).

---

## 5. Audio / TTS

- **ONE accent: US**, consistent with CMUdict.
- Prefer **Kokoro** (Apache-2.0) if it runs on this box in reasonable time for night-1 line count; otherwise **Piper** `en_US-ljspeech-medium` from `PREP/voices/` (symlink to `/workspace/nightly/PREP-english-app`). Sample MP3/WAV already in `assets/audio/` for jewellery/restaurant lines — reuse where text matches; re-render the rest.
- Pre-render **normal + slow** (length-scale ~1.35) for every dialogue line and every word card.
- Web Speech API = ad-hoc playback only, never teaching source of truth.
- Do **not** ship `edge-*-` samples or Edge/Azure voices (licence unclear).

---

## 6. Art Direction — 「Harbor Glow Editorial」

- Soft cinematic key light, shallow depth, painterly-but-clean editorial illustration (travel magazine × gentle anime proportions, **not** chibi).
- Palette: `#1B1F3B` `#C6A75E` `#2F6F6A` `#F4EDE4`.
- Recurring cast (same face/wardrobe every scene): **Mei** (salesperson), **Tom** (tourist), **Chef Ana**, **Agent Kai**.
- Full-bleed diegetic hooks; bottom sheet controls (~bottom 28%). No emoji heroes, no clip-art, no real brands/logos/watermarks.
- Images: **WebP**, lazy-loaded, mobile-data-friendly. Character refs under `assets/art/refs/`; lesson heroes under `assets/art/lessons/`. Cover/thumb: `assets/art/cover.webp`, `assets/art/thumb.webp`.
- Generate with Cursor GenerateImage and/or HF Z-Image Turbo; lock style in prompts. Reject face drift.

---

## 7. Tech stack

- **Vite + React + TypeScript** (or solid vanilla TS if faster — prefer React), CSS modules, hash router.
- `base: '/english-quest/'` for GitHub Pages project site.
- State: Zustand + `idb` IndexedDB for progress, FSRS, settings. **No analytics / tracking.**
- Content JSON under `content/` (lessons, path, lexicon ids).
- Audio under `assets/audio/` (or `public/audio/`).
- **PWA:** web manifest + service worker; installable to iPhone home screen; offline for shipped lessons/audio/art.
- iPhone-first **390×844**; tap targets ≥44px; safe-area insets; no autoplay sound without gesture.
- Deploy: production build output committed so Pages (`main` `/`) serves the app (root `index.html` + assets, or documented Actions — prefer simple root publish of `dist` contents). Relative paths only.
- **Public repo hygiene:** never commit secrets, tokens, `.env`, API keys, OAuth files. Add `LICENSE` (recommend MIT for code) + in-app **Attributions** page listing Wiktionary/kaikki (CC BY-SA), CC-Canto (CC BY-SA), ECDICT (MIT), CMUdict, Piper/LJSpeech or Kokoro, NGSL, ts-fsrs, art model notes — share-alike respected.

Symlink `PREP` → `/workspace/nightly/PREP-english-app` for voices/samples/research.

---

## 8. Rubric & done gates

Score each dimension **0–10**. Penny’s north-star is 99.99; **tonight’s minimum done gates** (Grok Duet):

1. **Every** rubric dimension ≥ **9/10**
2. **Zero** IPA/audio errors in audit
3. **Lighthouse mobile** ≥ **90**

| Dimension | What “9” looks like |
|-----------|---------------------|
| Art / scene | Cohesive Harbor Glow, character-locked, full-bleed |
| UI / iPhone | Store-ready, diegetic, no overflow at 390, safe-areas |
| Lexicon accuracy | Dual-check green, heteronyms correct, credits complete |
| Pronunciation UX | Clear US audio, slow mode, mouth tips + minimal pairs |
| Pedagogy | Speak-like flow, workplace-real scenarios |
| Speaking | Role-play + record-compare fallback works on iPhone |
| Review / SRS | FSRS due cards, calm streak |
| Flow / onboarding | Clear Path, goal pick, delightful |
| Perf | Fast lesson start, lazy media, offline pack |
| Audio quality | Kokoro or clear Piper, consistent voice |

**Critical defects (any = NOT READY):** wrong pronunciation taught; lesson soft-lock; mic flow broken with no fallback; **horizontal overflow / clipped controls at 390px**; unlicensed asset; nonsense gloss; secrets in repo; lexicon check fail.

Tonight: **10 orchestrator rounds**, then stop and report to Grok Duet. Do not exceed 10 without Duet OK.

---

## 9. Git / publish discipline (every phase)

This repo’s `origin` is `https://github.com/penny323mo/english-quest.git` (Pages on `main` `/`).

**At the end of every build and fix phase the coder MUST:**
1. Run tests
2. `git add -A` (respecting `.gitignore`)
3. `git commit` with a clear message
4. `git push origin main` (ff-only; **never** `--force`)
5. Confirm no secrets staged

Orchestrator also commits/pushes after phases; coder push keeps the live link fresh during long builds. **Do not touch** `penny323mo/grokbot`.

---

## 10. Reviewer rules (every round)

- Exercise the **running app at 390px** with real taps (Playwright OK).
- **VERDICT: SHIP** is **blocked** on any 390px overflow/clip **or** any lexicon-check / IPA/audio failure.
- Spot-check ≥20 words per round against dictionary sources.
- Write `reviews/orch-rN-grok.md` with `VERDICT: SHIP` or `VERDICT: NOT READY` as line 1.

---

## 11. Build order (build phase)

1. Scaffold Vite/React/TS + PWA + Path shell + onboarding  
2. Lexicon pipeline + `tests/lexicon-check` for all night-1 lemmas  
3. Kokoro-or-Piper render all lines/words (US)  
4. Character refs + 6 lesson heroes + cover/thumb WebP  
5. Implement J1 as gold template → clone to F1, F2, J2, T1, R1  
6. FSRS review + calm streak + speaking + record-compare fallback  
7. Attributions + LICENSE + Lighthouse pass attempt  
8. Playwright dogfood 390px; fix overflow; push main  

---

## 12. Out of scope tonight

Paid APIs, Azure/Edge voices, tracking, accounts/login, content beyond the 6 lessons (except Path teaser locks), Whisper-on-device as default, Jyutping-as-English-phonics.

---

*SPEC locked to DECISIONS.md 2026-10-29 23:23 · start immediately (side quest).*
