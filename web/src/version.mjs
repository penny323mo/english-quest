// Which build is running, and whether the server has a newer one. Pure so node tests
// can import it. The build writes { time, sha } into the app (__EQ_BUILD__) and into
// dist/version.json; the app fetches that file past every cache and compares.

/** "2026-11-05 23:41" in Macau / Hong Kong time (UTC+8 all year). */
export function buildLabel(time) {
  const ms = Date.parse(time);
  if (!Number.isFinite(ms)) return "";
  const t = new Date(ms + 8 * 60 * 60 * 1000).toISOString();
  return `${t.slice(0, 10)} ${t.slice(11, 16)}`;
}

/**
 * Compare the running build with the one the server has now.
 * "latest": same build. "newer": the server has a later build. "unknown": no answer
 * (offline, an old server without version.json) or the server's build is not later.
 */
export function compareBuild(own, server) {
  if (!own || !server || typeof server.sha !== "string" || typeof server.time !== "string") return "unknown";
  if (server.sha === own.sha && server.time === own.time) return "latest";
  const a = Date.parse(own.time);
  const b = Date.parse(server.time);
  if (Number.isFinite(a) && Number.isFinite(b) && b > a) return "newer";
  return "unknown";
}
