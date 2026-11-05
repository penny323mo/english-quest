// Pages deploys only a commit that passed CI (review finding 6): pages.yml runs on
// workflow_run of ci, only for a successful push run on main in this repository,
// checks out exactly that run's commit, and skips when main has moved on.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = fs.readFileSync(path.join(root, ".github/workflows/pages.yml"), "utf8");
const ci = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
// Comments may mention anything; check the workflow itself.
const body = pages.split("\n").filter((line) => !line.trim().startsWith("#")).join("\n");

test("pages runs after ci, not on its own push", () => {
  assert.match(ci, /^name: ci$/m, "the workflow pages waits for is named ci");
  assert.match(body, /^on:\n  workflow_run:\n    workflows: \[ci\]\n    types: \[completed\]\n    branches: \[main\]\n/m);
  assert.doesNotMatch(body, /^\s+push:/m, "no direct push trigger");
  assert.doesNotMatch(body, /pull_request|workflow_dispatch/, "no trigger that skips ci");
});

test("only a successful push run of ci on main in this repository deploys", () => {
  const guard = body.match(/^    if: >-\n((?:      .+\n)+)/m);
  assert.ok(guard, "the deploy job has a guard");
  const text = guard[1];
  assert.match(text, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(text, /github\.event\.workflow_run\.event == 'push'/);
  assert.match(text, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(text, /github\.event\.workflow_run\.head_repository\.full_name == github\.repository/);
  assert.equal((text.match(/&&/g) || []).length, 3, "all four conditions must hold");
});

test("the checkout is the exact commit ci tested", () => {
  assert.match(body, /- uses: actions\/checkout@v4\n        with:\n          ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(body, /TESTED_SHA: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(body, /test "\$\(git rev-parse HEAD\)" = "\$TESTED_SHA"/);
});

test("a commit no longer at the tip of main does not deploy over a newer one", () => {
  assert.match(body, /git rev-parse origin\/main\)" = "\$TESTED_SHA"/);
  const steps = body.slice(body.indexOf("id: tip"));
  for (const action of ["npm run build", "upload-pages-artifact", "deploy-pages"]) {
    const at = steps.indexOf(action);
    assert.ok(at > 0, action);
    const before = steps.slice(0, at);
    const lastIf = before.lastIndexOf("- if: steps.tip.outputs.deploy == 'true'");
    const lastStep = Math.max(before.lastIndexOf("\n      - "), 0);
    assert.ok(lastIf >= 0 && lastIf + 1 >= lastStep, `${action} runs only when the tip check says deploy`);
  }
});

test("the build is still checked against its source before upload", () => {
  assert.ok(body.indexOf("verify-build.mjs") < body.indexOf("upload-pages-artifact"));
});
