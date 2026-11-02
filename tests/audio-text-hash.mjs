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
