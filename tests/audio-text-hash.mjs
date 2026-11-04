import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lex = JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8"));

function renderText(line) {
  if (typeof line.say === "string" && line.say.length > 0) return line.say;
  return String(line.en);
}

function check(id, where, line) {
  const text = renderText(line);
  const hash = createHash("sha256").update(text, "utf8").digest("hex");
  assert.equal(line.audioTextSha256, hash, `${id} ${where} text hash`);
  for (const key of ["audio", "audioSlow"]) {
    assert.equal(typeof line[key], "string", `${id} ${where} ${key}`);
    const file = path.join(root, line[key]);
    assert.equal(fs.existsSync(file), true, `${id} ${where} missing ${line[key]}`);
    assert.ok(fs.statSync(file).size > 400, `${id} ${where} ${line[key]}`);
  }
}

test("example and mini audio matches the rendered-text hash", () => {
  for (const item of lex.items) {
    for (const [index, example] of (item.examples || []).entries()) {
      check(item.id, `ex${index}`, example);
    }
    for (const [index, turn] of (item.miniDialogue || []).entries()) {
      check(item.id, `md${index}`, turn);
    }
  }
});

const lines = JSON.parse(fs.readFileSync(path.join(root, "content/lines.json"), "utf8"));

test("every recorded lesson line matches the rendered-text hash", () => {
  // render_audio.py only writes audioTextSha256 after it renders a clip, so a text edit
  // without a re-render fails here instead of shipping an old recording.
  for (const line of lines) {
    if (line.runtimeTts) continue;
    check(line.id, "line", { ...line, say: line.say || line.text, en: line.text });
  }
});

test("a card's main clip and its first example say the same thing", () => {
  for (const item of lex.items) {
    for (const [index, example] of (item.examples || []).entries()) {
      if (example.audio !== item.audio) continue;
      assert.equal(renderText(example), item.say, `${item.id} ex${index} vs card say`);
      assert.equal(example.en, item.example, `${item.id} ex${index} vs card example`);
    }
  }
});
