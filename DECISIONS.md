# English Quest: decisions agreed with Grok Duet (supervisor), 2026-10-29 23:23
Overrides RESEARCH.md wherever they conflict.
1. Night 1 scope: 6 lessons (F1, F2, J1, J2, T1, R1), each fully polished end to end. Prove the lesson template first, then add the rest of the 15 in later rounds.
2. Audio: use Kokoro (Apache-2.0) if it runs on the box in reasonable time, otherwise Piper ljspeech and swap later. ONE accent only, US (to match CMUdict), with IPA and audio kept consistent.
3. Lexicon:
   - Show stress marks and syllable splits.
   - When CMUdict and FreeDict disagree, flag the word in review/flags.json for manual review and do NOT pick silently.
   - Check that the audio matches the sense (read/read, live/live).
   - Do a human-readable spot-check of the Cantonese explanations so they sound natural.
4. Language: Traditional Chinese/Cantonese UI. Teach the Cantonese-speaker error tips (th, v/w, final consonants, l/n, r) with mouth-position notes and minimal pairs, NOT Jyutping approximations of English sounds. Jyutping is an optional toggle only.
5. Calm streaks, no hearts or penalties, FSRS review.
6. Speaking: Web Speech API, with a graceful fallback (record yourself and compare with the model audio). A lesson never blocks on speech recognition.
7. Art: one consistent premium style with no real brands or logos. Images in WebP, lazy-loaded, kept fast on mobile data.
8. Done gates (minimum): every rubric dimension at 9/10 or higher, zero IPA/audio errors in the audit, Lighthouse mobile 90 or higher. Penny's own target remains 99.99. Tonight runs 10 rounds, then stop and report to Grok Duet; going further needs Grok Duet's OK.
9. Also:
   - Public repo, so confirm no secrets are committed.
   - Add a LICENSE and a dataset attributions page (kaikki/Wiktionary and CC-Canto are CC-BY-SA, so attribution and share-alike apply).
   - Progress stays local in IndexedDB, with no tracking.
   - Offline-capable PWA manifest so it installs on the iPhone home screen.
