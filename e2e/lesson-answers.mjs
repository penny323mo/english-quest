// Check the answer keys through the browser. The separate mobile walkthrough
// exercises touch interaction, audio playback, retries and persisted progress.
export async function checkLessonAnswers(page, lesson, name) {
  await page.getByRole("button", { name: "入去場景", exact: true }).click();
  return page.evaluate(async ({ lesson, name }) => {
    const sheet = document.querySelector(".sheet");
    const fill = text => text.replaceAll("{{learner-spell}}", name.toUpperCase().split("").join(" ")).replaceAll("{{learner}}", name);
    const update = () => new Promise(resolve => setTimeout(resolve, 0));
    const required = (node, label) => {
      if (!node) throw new Error(lesson.id + " missing " + label + " at " + sheet.dataset.beat);
      return node;
    };
    async function click(label, selector = "button") {
      const node = [...sheet.querySelectorAll(selector)].find(b => !b.disabled && b.textContent.trim() === label);
      required(node, label).click();
      await update();
    }
    async function correct() {
      required(sheet.querySelector(".result-sheet.good"), "positive feedback");
      await click("繼續");
    }
    async function choose(answer) {
      const option = [...sheet.querySelectorAll("button.choice")].find(b => b.lastElementChild?.textContent === fill(answer));
      required(option, answer).click();
      await update();
      await correct();
    }
    await click("去聽");
    const heard = [...sheet.querySelectorAll(".hear-play .line")].map(el => el.textContent);
    if (heard.length !== lesson.dialogue.length || heard.some((t,i) => t !== fill(lesson.dialogue[i].text))) throw new Error(lesson.id + " dialogue transcript");
    await click("聽完，繼續");
    for (const q of lesson.understand) await choose(q.choices[q.answer]);
    for (const q of lesson.chunks) await choose(q.answer);
    await click("跟完，去砌句");
    for (const q of lesson.build) {
      if (q.type === "order") {
        for (const token of q.answer) await click(fill(token), ".tokens button.token");
        await click("對一對");
        await correct();
      } else await choose(q.choices[q.answer]);
    }
    for (const [i, turn] of lesson.roleplay.turns.entries()) {
      if (sheet.querySelector(".line")?.textContent !== turn.line) throw new Error(lesson.id + " partner " + i);
      await click(i === lesson.roleplay.turns.length - 1 ? "去小測" : "下一句");
    }
    for (const q of lesson.quiz) await choose(q.choices[q.answer]);
    await click("去溫習");
    const tally = "小測 " + lesson.quiz.length + " / " + lesson.quiz.length;
    if (!sheet.textContent.includes(tally)) throw new Error(lesson.id + " expected " + tally);
  }, { lesson, name });
}
