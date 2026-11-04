# 每日抽卡 — paused checkpoint (2026-11-04, Asia/Macau afternoon)

Branch `claude/daily-draw`, PR #24 (open, **do not merge**: Penny accepts before merge).
Delete this folder before the PR is merged.

## Decisions (Penny, 2026-11-04)
1. Pictures: **Option A** — Tabler (MIT) line icons on a palette badge, every Tabler match
   reviewed by hand; hand-drawn SVGs for the jewellery nouns, clear at card size (160px).
   Concept images for abstract words. Samples: `samples/` (coffee = Tabler, necklace =
   hand-drawn, certainly = concept).
2. Word audio: render **all 753** word clips (normal + slow) and pass the ASR check in CI.
3. `jewelry-noun` and `elevator-noun` are never drawn (done: `NOT_DRAWN` in web/src/daily.mjs).
4. 提示 = the card's `glossYue`; finishing = +10 XP (done).
5. Own PR, separate from #23, pushed but **not merged**.

## Done on the branch (commit 08772886)
- Feature: path entry + floating bar, `#/daily`, pack shake/reveal (~1s, tap to skip,
  reduced motion), flip cards, finish → bumpStreak + 10 XP + FSRS cards, once per Macau day.
- Logic `web/src/daily.mjs` (seeded draw, 7-day no repeat, open/seen lessons first);
  additive `daily` field on persist v3 (no version bump); tests `tests/daily-draw.mjs`.
- Picture slot: `content/card-art.json` (empty) + placeholder badge; `tests/card-art.mjs`;
  ART-STYLE.md §8.
- Word clips: `content/word-audio.json`; `scripts/render_audio.py` renders them;
  `scripts/check_audio_asr.py` checks them; `scripts/pick_word_takes.py` keeps takes that
  Whisper base.en **and** Parakeet hear as the word (6 tries).
- e2e `e2e/daily.mjs` (Chromium + WebKit, 390px, screenshots → CI artifact
  `daily-draw-screenshots`), wired into `.github/workflows/ci.yml`.
- Local results: npm test 161 pass / 0 fail / 1 skip; daily e2e 45/45 (Chromium);
  goal e2e still passes; ASR on kept word clips 1,014 / 1,014 exact transcript.
- CI on PR #24 was still running when paused: check its result first.

## Open — conflicts with decision 2
- Only **507 of 753** cards have a word clip. The 246 in `content/word-audio-skip.json`
  never produced a take both recognisers heard as the word. Single words are the problem:
  Whisper and Parakeet both mishear isolated short words (bag, egg, water, good, nine…),
  and the check's DTW fallback can't separate single words (same-word re-renders up to
  2.12, different words from 1.87; limit 1.8). Options to put to Penny:
  a) Whisper-only gate (what CI checks), more takes (e.g. 20) → more words pass; or
  b) ear-check the remaining words and list them in tests/fixtures/asr-known.json; or
  c) keep them out of the draw (current state).
  Decision 2 says all 753 — ask before choosing.

## Next steps
1. Pictures (decision 1): build `content/card-art.json` + `assets/art/cards/*.svg` for every
   drawable card. Coverage scan (Tabler 3.31.0 names + tags): ~400 direct, ~110 via a
   content word, ~243 no icon. Review each match by hand; hand-draw jewellery nouns
   (necklace, bracelet, earring, bangle, pendant, brooch, gemstone, ring…) on the 24 grid,
   stroke 2, round caps; concept images for abstract words. Credit Tabler (MIT) on 出處.
   Lift the 120 KB / path checks in tests/card-art.mjs as needed (SVG ~0.6–0.9 KB each).
2. Contact sheet of 60 random card images for review (seeded, e.g. 10×6 grid).
3. Screenshots at 390px, Safari + Chrome: front, hint open, back, animation frames.
   WebKit can't be downloaded in this container — take Safari shots from the CI artifact,
   or a container that can install WebKit.
4. Resolve the word-audio open item, then push; keep PR #24 unmerged.

## Recreating the tools (container is ephemeral)
- `python3 -m venv venv && venv/bin/pip install piper-tts==1.3.0 sherpa-onnx numpy`
- Voice + Whisper: the sherpa-onnx GitHub release tarballs used in
  `.github/workflows/audio-asr.yml` (HuggingFace is blocked by the proxy here).
  A fresh render of an existing sentence sits 1.17–1.55 from its stored clip (same voice).
- Parakeet: `sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8` from the same release page.
- Chromium e2e locally: `EQ_BROWSERS=chromium EQ_CHROMIUM=/opt/pw-browsers/chromium node e2e/daily.mjs`
