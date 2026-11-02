import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  cantoneseClauseCount,
  clauseMismatch,
  englishClauseCount,
  glossProblems,
  lessonGlossFailures,
  mandarinMarks,
  quizKeyFailures,
} from "./lib/content-checks.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessons = fs.readdirSync(path.join(root, "content/lessons"))
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(fs.readFileSync(path.join(root, "content/lessons", name), "utf8")));
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));
const lexById = Object.fromEntries(lex.items.map((item) => [item.id, item]));
const exemptions = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/gloss-exemptions.json"), "utf8"));

test("lesson glosses are spoken Cantonese, not Mandarin, and agree with the English", () => {
  const failures = [];
  for (const lesson of lessons) failures.push(...lessonGlossFailures(lesson, exemptions));
  assert.deepEqual(failures, []);
  for (const id of exemptions.lines) {
    assert.equal(typeof exemptions.why[id], "string", id);
    assert.ok(exemptions.why[id].length > 40, id);
  }
});

test("every quiz and order key matches its source line", () => {
  const failures = [];
  for (const lesson of lessons) failures.push(...quizKeyFailures(lesson, lexById));
  assert.deepEqual(failures, []);
});

test("the gloss and key checks fail on the stage 4 bugs", () => {
  const dessert = glossProblems(
    "Could you bring a dessert for us after you fix that plate?",
    "換完之後，可唔可以畀我哋兩份免費甜品？",
    false,
  );
  assert.ok(dessert.some((row) => row.includes("免費")), dessert.join("; "));
  assert.ok(dessert.some((row) => row.includes("2")), dessert.join("; "));
  const mandarin = mandarinMarks("請而家把液體放進托盤，並取出電腦。");
  assert.ok(mandarin.includes("把") && mandarin.includes("並"), mandarin.join(","));
  const reversed = {
    id: "J17",
    dialogue: [{
      id: "j17-l6",
      text: "Wipe the pearl, then put perfume on.",
      glossYue: "先抹乾珍珠，再搽香水。",
    }],
    understand: [{
      prompt: "Wipe the pearl, then put perfume on. 呢句即係點？",
      choices: ["戴完先噴香水", "證書寫價錢", "戴之前噴香水，之後抹乾"],
      answer: 2,
    }],
    quiz: [],
    build: [],
    chunks: [],
  };
  const keys = quizKeyFailures(reversed, lexById);
  assert.ok(keys.some((row) => row.includes("order")), keys.join("; "));
  const dosage = glossProblems("The dosage is one tablet twice a day.", "劑量係一日兩粒。", false);
  assert.ok(dosage.some((row) => row.includes("tablet") || row.includes("times")), dosage.join("; "));
  const truncated = glossProblems(
    "I have called to ask about stock.",
    "我打嚟問存貨，你確認之後我聽日嚟取條手鏈。",
    false,
  );
  assert.equal(englishClauseCount("I have called to ask about stock."), 1);
  assert.equal(cantoneseClauseCount("我打嚟問存貨，你確認之後我聽日嚟取條手鏈。"), 2);
  assert.ok(truncated.some((row) => row.includes("clause")), truncated.join("; "));
  assert.ok(truncated.some((row) => row.includes("聽日") || row.includes("手鏈")), truncated.join("; "));
  const written = mandarinMarks("我會留住個訂位到八點，再寄一則短訊。請將液體放進托盤。");
  assert.ok(written.includes("一則") && written.includes("放進") && written.includes("寄…短訊"), written.join(","));
  const restored = clauseMismatch(
    "I have called to ask about stock, and I will collect the bracelet tomorrow after you confirm.",
    "我打嚟問存貨，你確認之後我聽日嚟取條手鏈。",
  );
  assert.equal(restored, "");
});
