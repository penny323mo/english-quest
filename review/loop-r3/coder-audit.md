# Coder live audit after round 3 (2026-10-30 ~01:50, live https://penny323mo.github.io/english-quest/ , 390x844 touch)

Fix ALL of these in addition to reviews/orch-r4-grok.md. Every one is user-visible on the live build.

1. Word card shows the raw internal sense id as a label: `VERB · PRESENT-INTERPRET-TEXT` on #/word/read-verb-present. Replace with a learner label in Cantonese (e.g. 動詞 · 現在式) and never render senseId to users. Check every card.
2. Word card renders the simplified-Chinese glossZh line under the Cantonese gloss (`读（现在）` under `讀（現在）`). HK users don't need it; hide glossZh in the UI (keep in data).
3. Role-play tip says `你而家係 你。` because CAST_LABEL.ling = "你" (web/src/Lesson.tsx:427). Rewrite so it reads naturally, e.g. `輪到你講。等對方講完先答，中途唔會插嘴。` or `你扮 Mei。…` when you play a named character.
4. Cast portraits and lesson thumbnails pop in late as empty circles/green squares (F1 hook circle, J1 Tom circle, path thumbs and cover blank for ~1–3 s on first load). Preload the hook's cast images and lesson art, give them a blurred/tinted placeholder, and set width/height so there is no empty ring.
5. Cantonese example glosses that read unnaturally — fix these and sweep the whole lexicon/lines for the same problems:
   - `Nice to meet you.` → 認識你真好。 is translationese; use 好高興認識你。
   - `Here is my passport.` → 我張護照喺度。 wrong classifier; use 呢本係我嘅護照。/ 我本護照喺度。
   - `Yes, sir.` → 係，先生。 is stiff; use 好嘅，先生。
   - `送俾我太太` → use 畀 consistently (畀我太太嘅).
6. Audio: clips start at 0.05 s with no lead-in silence; add ~150 ms leading and ~200 ms trailing padding so iPhone Safari doesn't clip the first phoneme. Re-render `certainly-adv-slow` and verify with ASR/phonemize that "take a" is clearly present (my ASR heard "Certainly. Please look.").
7. Content depth (DECISIONS.md #1: add the rest of the 15 lessons in later rounds): Foundations shows only 2 shipped lessons then 即將推出. This round ship F3 數字、錢同時間 and F4 禮貌用語 to the same full 12-beat standard as F1/F2 (hook art in Harbor Glow style with the existing cast, lexicon entries dual-checked CMU+Wiktionary with flags.json entries for any disagreement, Piper audio + slow audio, role-play, quiz). Path, unlock order and tests updated. Zero-beginner friendly (learner only knows "how are you").

Keep: Lighthouse mobile is 100/100/100/100, no 390px overflow anywhere — don't regress either.
