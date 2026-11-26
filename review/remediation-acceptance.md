# English Quest review acceptance

Baseline `0c01408c`. These checks cover the local production build, the progress a learner can export and the repository's deployment workflow.

| Change | Acceptance condition |
| --- | --- |
| Daily route | From the path, 每日任務 opens three cards on a case-insensitive Mac build. |
| Macau midnight | An open draw switches to three new cards at midnight or on returning to the foreground. The new day starts with no flips or completion. Finishing earns XP once per date. |
| Lesson restart | Start T1 with the travel goal, switch goals, then restart from the path or the lesson prompt. T1 opens at its first screen, remains accessible after reload and awards no completion XP for restarting. |
| Offline pack | After a temporary download failure the same worker can resume. During an update an installed offline lesson and its audio remain available until the replacement assets and page are ready. Other apps' caches and progress are preserved. |
| Deployment | A push to main that changes teaching audio or its validation inputs must pass the acoustic check on the candidate SHA before Pages can deploy it. Ordinary code changes still run the existing CI. |
| Course inventory | README matches the published path and distinguishes hidden content. |
| Vocabulary review | 生字回顧 includes all visible foundation lesson words. Every visible lesson recap links to a session and quiz using only that lesson's vocabulary. Hidden content stays hidden and shared FSRS records keep their history. |

## 0.9 local verification on 26 November 2026

The original Mac production build failed the existing Chromium daily-route test. The midnight, restart, interrupted offline update, recap link, course inventory and acoustic workflow checks also failed at their corresponding baseline. After the fixes, the 330 Node tests passed with Pillow and the Piper US model installed, including the phoneme check. TypeScript and the build/source check passed. WebKit and Chromium completed F1, played 36 audio actions each and retained completion and XP after reload. Both engines passed daily rollover, restart from both entry points, the foundation and lesson deck flows and the version check. Two successive persistent-profile runs recovered the previous and replacement boot scripts and audio offline after a 503. The workflow check here verifies wiring. Hosted acoustic results are tracked separately from local acceptance.
