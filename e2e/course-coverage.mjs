import { checkLessonAnswers } from "./lesson-answers.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => JSON.parse(readFileSync(new URL("../content/" + file + ".json", import.meta.url)));
const entries = read("path").units.flatMap(unit => unit.lessons).filter(entry => !entry.soon);
const live = entries.map(entry => read("lessons/" + entry.id.toLowerCase())).filter(lesson => !lesson.hidden);

// This fixture opens earned lessons in a temporary browser profile. The full
// F1 test above it independently earns XP and saves progress via the actual UI.
export async function checkCourse(page, origin, saved) {
  const progress = Object.fromEntries(live.map(l => [l.id, {at:"2026-01-01T00:00:00.000Z", xp:15}]));
  async function importProgress(lesson, beat) {
    await page.goto(origin + "#/settings");
    const completed = {...progress};
    if (lesson) delete completed[lesson.id];
    const lessonCursor = lesson ? {lessonId: lesson.id, beat, sub:0, quizScore:0, quizAnswered:0} : null;
    const buffer = Buffer.from(JSON.stringify({...saved, progress:completed, lessonCursor}));
    await page.locator('input[type="file"]').setInputFiles({name:"lesson-review.json",mimeType:"application/json",buffer});
    await page.getByRole("button", {name:"確定匯入"}).click();
    await page.getByText("已匯入呢部機。", {exact:true}).waitFor();
    if (lesson) {
      await page.goto(origin + "#/lesson/" + lesson.id);
      await page.getByRole("button", {name:"繼續",exact:true}).click();
    }
  }
  // Start with an earlier saved self-assessment. A repeat must preserve it.
  await page.goto(origin + "#/settings");
  const earlier = {...saved, progress: {...saved.progress,
    F1: {...saved.progress.F1,transferDays:{"2025-01-03":"guided"}}}};
  await page.locator('input[type="file"]').setInputFiles({name:"earlier.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(earlier))});
  await page.getByRole("button", {name:"確定匯入"}).click();
  await page.getByText("已匯入呢部機。", {exact:true}).waitFor();
  await page.goto(origin + "#/profile");
  await page.getByRole("combobox", {name:"重練已完成課堂嘅口語任務"}).selectOption("F1");
  const repeat = page.getByRole("region", {name:"換個情境自己講"});
  await repeat.getByRole("button", {name:"講完，睇下一個要求"}).click();
  await repeat.getByRole("button", {name:"講完，核對表達"}).click();
  await repeat.getByRole("button", {name:"自己做到"}).click();
  await repeat.getByText("2025-01-03 · 用提示做到", {exact:true}).waitFor();
  assert.equal(await repeat.getByRole("list", {name:"按日口語自評"}).getByRole("listitem").count(),2);
  await importProgress();
  assert.equal(live.length, 91);
  for (const lesson of live) {
    await page.goto(origin + "#/lesson/" + lesson.id);
    await page.locator(".sheet").getByRole("heading", {name:lesson.titleYue,exact:true}).waitFor();
    assert.equal(await page.getByRole("button", {name:"入去場景"}).count(), 1);
    if (process.env.EQ_WHOLE_COURSE === "1") {
      await checkLessonAnswers(page, lesson, saved.profile.name);
      console.log("Course answers passed", lesson.id);
    }
  }
  await importProgress(live.find(l => l.id === "F2"), 2);
  await page.evaluate(() => Object.defineProperty(window, "speechSynthesis", {configurable:true,value:undefined}));
  await page.locator(".hear-play").nth(1).click();
  await page.getByText("裝置未能讀出你個名。錄音用 Alex 做示範，你可以用自己個名答。").waitFor();
  assert.ok((await page.evaluate(() => window.__lastAudio)).endsWith("name-demo-greeting.mp3"));
  for (const lesson of live.filter(l => l.cefr === "B2")) {
    await importProgress(lesson, 7);
    assert.equal(await page.getByRole("button", {name:"聽模範",exact:true}).count(), 0);
    await page.getByRole("button", {name:"自己試答，再睇示範"}).click();
    await page.getByRole("button", {name:"聽模範",exact:true}).waitFor();
    await importProgress(lesson, 9);
    await page.getByRole("button", {name:"去溫習"}).click();
    const task = page.getByRole("region", {name:"換個情境自己講"});
    await task.getByRole("button", {name:"講完，聽下一個要求"}).click();
    assert.equal(new URL(await page.evaluate(() => window.__lastAudio)).pathname, new URL(lesson.challenge.audio, origin).pathname);
    await task.getByRole("button", {name:"慢速聽要求"}).click();
    assert.ok((await page.evaluate(() => window.__lastAudio)).endsWith(lesson.challenge.audioSlow));
    assert.equal(await task.getByText(lesson.challenge.text, {exact:true}).count(), 0);
    await task.getByRole("button", {name:"講完，核對表達"}).click();
    await task.getByRole("button", {name:"自己做到"}).click();
    await task.getByText("上次自評 · 自己做到").waitFor();
  }
  console.log("Opened all 91 live lessons and verified all five B2 follow-ups and self-assessments");
}
