# English Quest · 情景英文

Practical, scenario-based English for Cantonese speakers: basics, everyday life, travel, restaurants, work and jewellery retail, each an equal track.

**Live:** https://penny323mo.github.io/english-quest/

iPhone-first PWA. Progress stays on-device (IndexedDB). See `SPEC.md`, `DECISIONS.md`, and the in-app Attributions page for licences.

```bash
npm install
npm test
npm run dev
```

Dev and the production preview both use the Pages base path: http://127.0.0.1:5173/english-quest/

The path has 91 playable lessons from 97 lesson files. Six lessons are hidden following content review. Night-1 started with F1, F2, J1, J2, T1, and R1.

Lesson and sentence recordings use US English. Most use Piper. Five B2 lessons use distinct Kokoro voices for the speakers, with selected recordings in F1, F2 and D4 also using Kokoro. Isolated vocabulary audio uses Kokoro or the three attributed dictionary recordings. Personal names use the device voice with a labelled Alex recording available offline.

The candidate adds separate listening and reading practice for beginners, dated spoken-task self-assessment, two-speed examples on all visible vocabulary cards, and an offline pack with integrity checks and recovery. Its acceptance specification and learner trial cover pronunciation, usage, course progression and offline operation. [1.0 specification](RELEASE-1.0.md) · [Learner and listener trial](release-evidence/trial.md)

GitHub Pages serves the tested main branch. Candidate builds are published separately as GitHub prereleases.
