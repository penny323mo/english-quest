import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const dirs = ["web", "content", "public", "assets/art"];
const extra = ["vite.config.ts", "package.json", "package-lock.json"];

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const abs = path.join(dir, name);
    const rel = path.relative(root, abs).split(path.sep).join("/");
    const st = fs.statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else if (st.isFile()) out.push(rel);
  }
}

/** Stable hash of the app source, content, and art. Dist output is not included. */
export function sourceHash() {
  const files = [...extra];
  for (const dir of dirs) walk(path.join(root, dir), files);
  files.sort();
  const hash = crypto.createHash("sha256");
  for (const rel of files) {
    hash.update(rel);
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(root, rel)));
    hash.update("\0");
  }
  return hash.digest("hex");
}
