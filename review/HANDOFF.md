# Handoff: content and audio fixes (resume here)

The user asked for six separate PRs, in this order, each with tests so the problem can't come back. Repo: `penny323mo/english-quest`. The PRs are **stacked**: each branch is based on the previous one.

## Done
- `claude/charming-ritchie-csh657`: `review/v1-audit.md` and `review/content-audit.md`, committed and pushed.
- **PR #14** (branch `claude/charming-ritchie-csh657-1-meanings`, base `main`): offensive and wrong glosses, wrong quiz keys, factual errors and carousel order.
  - 16 regression tests in `tests/content-meaning.mjs`. All 16 fail on `main` and pass on the branch.
  - `npm test` passes (107/107).

## In progress: PR 2 (audio), branch `claude/charming-ritchie-csh657-2-audio-wip` (based on PR 1; a remote `-2-audio` branch already existed with other commits, so it was not overwritten)
This is a work-in-progress commit; `tests/audio-say.mjs` fails on purpose until steps 2–5 below are done.

Already written:
- **`scripts/render_audio.py`:** now renders only clips whose mp3 is missing or whose stored `audioTextSha256` differs from the hash of the text they should say. It stamps the hash after rendering, and also stamps `lines.json`. `runtimeTts` lines are skipped.
- **`scripts/asr_check.py`:** Whisper `base.en` on each clip, with a recheck on `small.en`. A clip fails only when both models disagree with its text.
  - Modes: `--all`, `--changed REF`, `--clips`.
  - Allowlist: `tests/fixtures/asr-known.json` (not created yet).
- **`.github/workflows/ci.yml`:** new `asr` job. It checks changed clips on every push and PR, and all clips weekly or on manual dispatch.
- **`tests/audio-text-hash.mjs`:**
  - Every recorded line in `lines.json` must match its text hash.
  - A card's main `say` must equal its first example.
- **`tests/audio-say.mjs`:**
  - Every `[[override]]` must spell the word it replaces.
  - No IPA in clip text.
  - Roleplay text must equal its audio's text.
- **ASR baseline** on the PR 1 content: 4,226 clips, **484 fail**. The report is in `review/handoff/asr_report0.json` and the log in `asr_run0.log`. The transcript cache is `review/handoff/asr_cache.jsonl`; pass it with `--cache`.

### Next steps for PR 2
1. **Set up.**
   - Install Piper and the voice: `pip install piper-tts==1.3.0 faster-whisper==1.2.1`.
   - Download `en_US-ljspeech-medium.onnx` and its `.onnx.json` from `huggingface.co/rhasspy/piper-voices` (`en/en_US/ljspeech/medium/`) into `PREP/voices/`. That folder is gitignored.
   - The helper scripts are in `review/handoff/`. Copy them into a scratch directory, `cd` there, and run them from there. `eq.py` hard-codes the repo path as `/home/user/english-quest`.
2. **Run `python3 pr2a.py`.** It:
   - repairs the 43 corrupted `say` strings on 15 cards;
   - rewrites the 13 clips that make the voice read IPA aloud (the wine, vine, west and vest main clips, plus 9 mini-dialogue lines);
   - shortens the R3 roleplay lines;
   - syncs the 49 roleplay texts to their audio text.
   
   It deletes the mp3s that need re-rendering.
3. **Run `python3 pr2b.py <path>/asr_report0.json`.** It deletes every clip that failed ASR, so it gets re-rendered, and stamps text hashes on the lesson lines that ASR confirmed.
4. **Run `python3 scripts/render_audio.py`** from the repo root. It renders every missing or stale clip at normal and slow speed.
5. **Check the new clips.** Run `python3 scripts/asr_check.py --changed main --cache <cache>`. Any clip that still fails after a fresh render is a TTS mispronunciation, not stale audio:
   - try rewording it, as PR 1 did ("bag" became "luggage", "insurer" became "insurance company");
   - otherwise list it in `tests/fixtures/asr-known.json` as `{path: reason}`.
   
   That list is also the **human ear-check list** the user asked for, so don't auto-fix those.
   
   Known suspects: ship and sheep in F1, Hong Kong, tablet, water, SIM, Saturday, forty and eighty, shop, box, bag, invoice, salesperson, watch, and "a table for two".
6. **Verify and open the PR.** `npm test`, `npm run typecheck`, `npm run build` and `node scripts/verify-build.mjs` must all pass. Then commit and open PR 2 with base `claude/charming-ritchie-csh657-1-meanings`.

## Remaining PRs (stack each on the previous branch)
- **PR 3: rewrite the ~200 nonsense vocab sentences by hand, for real Hong Kong/Macau scenes.**
  - Targets and context are in `review/handoff/pr3_targets.json` and `pr3_context.txt`: 258 candidates, including some that are fine. Skip the 28 B2 cards, which PR 4 hides.
  - Use `Content.set_ex` and `set_md` from `eq.py`, then run `render_audio.py` and `asr_check.py --changed`.
  - Extend the banned-template test in `tests/lexicon-skeleton.mjs` with the templates in `templates.txt`.
- **PR 4: hide T20, J23, R17, W14, W15 and J24 and their 28 cards.**
  - Mark the lessons `soon` in `content/path.json` and remove the cards from `decks.json`.
  - Update `SHIPPED` in `web/src/data.ts`, the test at `tests/lessons.mjs:200`/`:432`, and the `next` pointers.
  - Add a test.
- **PR 5: British spelling.** Change color to colour and harbor to harbour in content and glosses, re-render the changed clips, and add a test.
- **PR 6: code bugs, in this order: 3, 4, 5, 6, then 1, 2, 7.** The numbers come from the first code review:
  1. Offline launch (`sw.ts:27-30`).
  2. Kill-switch 1.5 s timeout (`web/index.html:43`).
  3. Image `onerror` and timeout (`art.tsx:18-28`).
  4. Clamp a stale cursor (`Lesson.tsx:212/222/235/474/583`).
  5. Quiz resume double count (`Lesson.tsx:118-128`, `:645-648`).
  6. `stamp()` inside the `try` (`persist.mjs:311-333`).
  7. Purge old precache revisions (`sw.ts:43-57`).
- **Ear-check list:** give the user `tests/fixtures/asr-known.json` as the list of mispronunciations for a human to check. Don't auto-fix them.

Rules: never push to `main`. End commit messages with the Co-Authored-By line, and PR bodies with the Claude Code footer.
