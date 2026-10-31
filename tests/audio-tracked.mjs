import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

function collect(value, out) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collect(item, out);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if ((key === "audio" || key === "audioSlow") && typeof item === "string" && item.endsWith(".mp3")) out.add(item);
    else collect(item, out);
  }
}

test("every lexicon and line audio path is tracked in git", () => {
  const listed = new Set(execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean));
  const refs = new Set();
  collect(JSON.parse(fs.readFileSync(path.join(root, "content/lexicon.json"), "utf8")), refs);
  collect(JSON.parse(fs.readFileSync(path.join(root, "content/lines.json"), "utf8")), refs);
  for (const rel of refs) {
    assert.equal(listed.has(rel), true, rel);
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
  for (const id of ["email-noun", "headache-noun", "stamp-verb", "weight-noun", "savings-account-phrase"]) {
    assert.equal(listed.has(`assets/audio/words/${id}.mp3`), true, id);
    assert.equal(listed.has(`assets/audio/words/${id}-slow.mp3`), true, id);
  }
});
