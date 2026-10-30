# Duolingo UX reference → English Quest adaptations

**Research date:** 2026-10-30 (Macau).  
**Sources (public web; Mobbin connector blocked — paid plan required, skipped per no-paid-services rule):**
- [Duolingo blog — home screen Path redesign](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- [The Duolingo Handbook — Path vs Tree](https://handbook.duolingo.com/)
- [Practice tab guide](https://blog.duolingo.com/guide-to-duolingo-practice-hub/) (2026-02-18)
- [Hearts → Energy](https://blog.duolingo.com/duolingo-energy/)
- [App critique — visual/feedback](https://www.alicenmatthews.com/work/duolingo)
- [Revyl Atlas — start lesson from path](https://revyl.com/atlas/duolingo/flows/start-a-lesson-from-the-path-map/)
- Mobbin public index pages (metadata only): [Completing a lesson flow](https://mobbin.com/explore/flows/1b0f13c1-82c5-4738-9bf0-0af8ef50bd2f), [Practice Hub screen](https://mobbin.com/explore/screens/5a86d1f3-dcab-41e6-87c2-dcfa55f33862)

**Hard rule:** Adapt patterns only. **Do not** copy Duo owl, brand greens as trademark, wordmarks, lesson copy, or assets. No “Duo”, no owl mascot.

---

## What Duolingo does (observed patterns)

| Pattern | How it works |
|---------|----------------|
| **Winding Path** | Linear home path of circular nodes (lessons / practice / stories / chests). Locked → current (pulsing) → completed (gold). Units group nodes; guidebook per unit. |
| **Bite-size** | Short exercise templates chained in one lesson: image select, translate, word bank, listen-tap, match pairs, speak. Top progress bar. |
| **Instant feedback** | Green correct / red incorrect sheet + sound; continue CTA; mistakes can reappear in-session. |
| **Celebration** | End-of-lesson XP, accuracy %, streak bump, leaderboard tease, confetti-ish motion. |
| **Streak** | Decoupled from XP goal: **1 lesson/day** keeps streak. Separate daily XP goal. Streak-goal commitment screen = “good friction”. |
| **Hearts / Energy** | Mistakes used to cost hearts (punishing for beginners). Energy burn on lessons + refill on correct streaks is newer — still a scarce resource for free users. |
| **Legendary / Review** | Completed node → Review or Legendary (harder mastery). Legendary can crown a whole unit. |
| **Practice Hub** | Barbell tab: Mistakes, Words, Speak, Listen — on-demand; Words deck ≈ vocab review. |
| **Characters** | Flat bright cartoon cast cheering on path; simple geometric construction, high chroma, soft depth. |
| **Nav** | Bottom tabs: Learn (path), Quests, Practice, Leaderboard, Profile. Top bar: streak flame, currency/gems, hearts/energy. |

---

## Adapt into English Quest (cartoon bright theme)

Keep Spec cast (Mei / Tom / Chef Ana / Agent Kai) and Harbor Glow editorial DNA, but **brighten Path chrome** toward playful cartoon UI (flat fills, thick friendly strokes, bouncy micro-motion) without becoming clip-art or emoji-hero.

### Must bring over
1. **Winding unit Path** with node states: locked / current / done / soon / legendary-ready. CEFR chip on node (A1–B2) from CURRICULUM.md.  
2. **Bite-size beats** already exist (12-beat lesson) — add Duolingo-like **instant green/red toast + soft sound** on quiz/role checks.  
3. **Celebration screen** after lesson: XP, accuracy, streak+1, “下一課” CTA, light confetti (CSS/canvas, no heavy Lottie dependency if Perf risk).  
4. **Calm streak + daily XP goal** (already Spec): keep **no punish-fail lockout**. Prefer Spec over Duo hearts — **do not add hearts that eject mid-lesson**. Optional “focus energy” that refills on correct answers is OK only if it never blocks Finish.  
5. **Review / Legendary nodes** on completed lessons: Review = SRS weak items + Word-Review slice; Legendary = harder role + less Yue scaffolding (B1+).  
6. **Practice / 生字 hub** (see CURRICULUM.md WORD-REVIEW): Words · Mistakes · Speak · Listen style cards — labelled in Cantonese.  
7. **Character cheer** on Path milestones using existing cast (wave / clap poses), not an owl.  
8. **Top status**: streak · XP-to-goal · optional gems later — iPhone 390 safe.

### Must NOT copy
- Duo logo, owl, trademark green `#58CC02` as brand identity (our teal/gold palette stays primary; bright accents OK).  
- Exact Path bezier art, chest IP, league shields copy.  
- Paywall / Super upsell patterns.  
- Heart-punish lockouts (Spec forbids).

### Visual tokens (bright cartoon direction)
- Path background: soft sky→cream vertical wash; nodes as chunky circles with icon glyphs.  
- Current node: gentle scale pulse + gold ring.  
- Feedback: `#2F9E44` success / `#E85D4C` error surfaces (not Duo-identical).  
- Type: existing UI Traditional Chinese; English in content only.  
- Motion: 150–250 ms ease-out; respect `prefers-reduced-motion`.

### Implementation slices for loop
| Slice | Where | Notes |
|-------|-------|-------|
| Path nodes + CEFR tracks | `content/path.json`, Path page | Units F/J/R/T/W/D; level filters A1–B2 |
| Feedback + celebration | Lesson quiz/role end | Sound + sheet + XP |
| Practice / 生字 hub | New route | WORD-REVIEW mode |
| Legendary | Done nodes | Harder variant flag in lesson JSON later |
| Art brightness | Path chrome CSS + node icons | Keep lesson hooks Harbor Glow |

Perf gate unchanged: Lighthouse mobile Perf ≥98.

