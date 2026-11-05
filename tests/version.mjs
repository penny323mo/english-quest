// The build stamp (review: "which version am I on?"): label in Macau time, and the
// comparison with the server's version.json.
import assert from "node:assert/strict";
import test from "node:test";
import { buildLabel, compareBuild } from "../web/src/version.mjs";

test("the label is the build time in Macau time and minutes", () => {
  assert.equal(buildLabel("2026-11-05T16:34:49.831Z"), "2026-11-06 00:34");
  assert.equal(buildLabel("2026-11-05T03:00:00.000Z"), "2026-11-05 11:00");
  assert.equal(buildLabel("not a time"), "");
});

test("same build is latest; a later server build is newer; anything else is unknown", () => {
  const own = { time: "2026-11-05T16:34:49.831Z", sha: "c0c4f92" };
  assert.equal(compareBuild(own, { ...own }), "latest");
  assert.equal(compareBuild(own, { time: "2026-11-06T01:00:00.000Z", sha: "abc1234" }), "newer");
  assert.equal(compareBuild(own, { time: "2026-11-04T01:00:00.000Z", sha: "0ld0000" }), "unknown", "an older server build is not offered");
  assert.equal(compareBuild(own, null), "unknown");
  assert.equal(compareBuild(own, { time: 5 }), "unknown");
  assert.equal(compareBuild(own, "<html>"), "unknown");
});
