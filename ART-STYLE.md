# English Quest — Art Style Guide (Bright Cartoon v1)

**Date:** 2026-10-30 (Asia/Macau)  
**Status:** **APPROVED by Penny 2026-10-30 ~15:58 (Asia/Macau)** — implement in app (round 20+). Mockups: `review/mockup-v1/` (local only).  
**Scope:** Path chrome, Practice hub, celebration, mascot, UI chrome, **SFX**.  
**Hard rules:** Adult-friendly cartoon (no chibi, no emoji-hero, no primary-school ABC frames). **Do not** copy Duolingo owl, wordmark, or trademark green `#58CC02` as brand identity. Adapt Path / feedback / Practice patterns only (see `DUOLINGO-REF.md`).

Lesson **hook scenes** may keep a softened Harbor Glow flavour; **app chrome** (Path, tabs, cards, feedback) follows this bright cartoon system.

---

## 1. Palette (hex)

| Token | Hex | Use |
|-------|-----|-----|
| `--sky` | `#E8F6FF` | Path / screen wash top |
| `--cream` | `#FFF8EF` | Main background / card paper |
| `--sand` | `#F3E6D4` | Soft bands, locked nodes |
| `--ink` | `#1F2A37` | Primary text |
| `--ink-soft` | `#5B6B7C` | Secondary / captions |
| `--teal` | `#1F9E8F` | Primary brand / CTAs (NOT Duo green) |
| `--teal-deep` | `#0F7A6E` | Pressed / path line |
| `--coral` | `#FF7A59` | Accents, current pulse ring, XP |
| `--gold` | `#F5C84C` | Streak flame, done nodes, stars |
| `--gold-deep` | `#E0A820` | Gold stroke |
| `--success` | `#2F9E44` | Correct sheet |
| `--success-bg` | `#E6F7EA` | Correct surface |
| `--error` | `#E85D4C` | Wrong sheet |
| `--error-bg` | `#FDECE9` | Wrong surface |
| `--white` | `#FFFFFF` | Cards, pills |
| `--line` | `#E4D5C3` | Soft borders |
| `--a1` | `#7EC8E3` | CEFR A1 chip |
| `--a2` | `#8FCB6D` | CEFR A2 chip |
| `--b1` | `#F5C84C` | CEFR B1 chip |
| `--b2` | `#FF7A59` | CEFR B2 chip |

Background recipe: vertical wash `sky → cream` (≈ `#E8F6FF` 0% → `#FFF8EF` 55% → `#FFF8EF` 100%). Soft warm cloud blobs optional, low opacity.

---

## 2. Typography

| Role | Stack | Size (390px) | Weight |
|------|-------|--------------|--------|
| Display / celebration | `"Nunito"`, `"Avenir Next Rounded"`, `"PingFang HK"`, `"Noto Sans TC"`, sans-serif | 28–34px | 800 |
| Screen title | same | 22–26px | 700–800 |
| Body UI (Cantonese) | `"Nunito"`, `"PingFang HK"`, `"Noto Sans TC"`, system-ui | 16–17px | 500–600 |
| English learning content | same (slightly tracking +0.01em) | 18–20px | 700 |
| IPA | `"SF Mono"`, `"Menlo"`, `"Noto Sans"`, monospace | 14–15px | 500 |
| Captions / chips | same UI stack | 11–13px | 700 |
| Tab labels | UI stack | 11px | 600 |

UI chrome language: **Traditional Chinese / 廣東話**. English only inside learning content (lemmas, examples, dialogue).

---

## 3. Shapes & chrome

- **Corner radius:** cards 20–24px; pills 999px; lesson nodes **perfect circles** 64–72px; CEFR chips 10px.
- **Strokes:** 2.5–3px warm ink or teal on nodes; cards 1.5px `--line` or soft shadow only.
- **Shadows:** soft, warm — `0 8px 24px rgba(31,42,55,0.08)`, never harsh black.
- **Path:** thick teal line (~6px) winding left–right between nodes; slight S-curve.
- **Node states:**
  - Locked: sand fill, dashed stroke, lock glyph, muted
  - Current: white/teal fill, **coral/gold ring**, gentle scale pulse
  - Done: gold fill + check / star
  - Legendary-ready: gold crown badge on done node
  - Soon: sand + “即將” tag
- **Buttons:** chunky 52px height, radius 16px, teal fill + deeper bottom edge (pseudo 3D / pressable).
- **Feedback sheets:** full-width bottom sheet, success green or error coral, rounded top 24px, big Continue CTA.
- **Motion:** 150–250ms ease-out; respect `prefers-reduced-motion`.

---

## 4. Mascot — 「小燈 Lantern」

**Not an owl. Not Duo.**

- **Species / form:** a friendly **harbour lantern** character — rounded brass-gold body, soft teal glass glow inside, tiny arms/legs, big calm eyes, small smile.
- **Personality:** warm coach for adult learners; cheers without sarcasm; never childish squeal.
- **Wardrobe accents:** tiny scarf in coral or teal ribbon (optional per scene).
- **Poses needed:** idle wave (Path header), clap/cheer (celebration), tip finger (word card tip), thinking (wrong answer soft).
- **Construction:** flat-to-soft cartoon, thick friendly outline (~3px `#1F2A37`), limited cel shading (1–2 tones), high chroma but not neon.
- **Proportions:** ~1.2 head:body overall silhouette height for icon; avoid chibi squash.

Recurring cast (Mei / Tom / Chef Ana / Agent Kai) keep recognizable wardrobe; redraw in the same thick-outline cartoon system when appearing on Path milestones.

---

## 5. Illustration rules

- Bright daylight / soft studio light; warm key, cool fill.
- Backgrounds simple: soft gradients, 1–2 props max.
- Icons on nodes: simple glyphs (breath, wave, necklace, plane, fork) inside circle — not photo realism.
- **Forbidden:** Duolingo owl, Duo greens as logo, clip-art emoji stacks, dark night Harbor chrome on Path, dense paragraph walls on cards.

---

## 6. Screen inventory (mockup v1)

1. **Path home** — streak / XP / daily goal header + winding nodes + CEFR bands + mascot + bottom tabs  
2. **Lesson exercise + feedback** — progress bar, prompt, choices, green correct sheet  
3. **Word card expanded** — IPA, glossYue, usage, examples,「更多」open  
4. **Practice / 生字 hub** — scenario decks  
5. **Lesson complete celebration** — XP, accuracy, streak+1, confetti,「下一課」

Mockups: `review/mockup-v1/` (gitignored). **Penny approved** — implement in `web/` starting round 20; do not ship mockup HTML as the product.

---

## 7. Sound effects (Penny 2026-10-30)

Cheerful, short, Duolingo-*like* (never Duo assets). Prefer **Web Audio** synthesis or self-made free/CC0 files. **No paid** SFX packs/APIs.

| Event | Direction |
|-------|-----------|
| correct | bright major plink |
| wrong | soft low thud (not harsh) |
| lesson complete | short fanfare ≤900ms |
| level-up / XP | ascending sparkle |
| streak | warm blip |
| tap | optional tiny click |

**Product rules:** Settings mute toggle (persist). iOS: resume `AudioContext` on first user gesture. SFX must **not** overlap pronunciation clips (`media.ts`); speech wins. Keep clips tiny so Lighthouse Perf stays ≥98.
