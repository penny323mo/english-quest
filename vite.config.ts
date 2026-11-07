import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { sourceHash } from "./scripts/source-hash.mjs";

const repo = path.dirname(fileURLToPath(import.meta.url));

function copyWebps(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) copyWebps(from, to);
    else if (ent.name.endsWith(".webp")) fs.copyFileSync(from, to);
  }
}

/** 每日抽卡 card pictures are small SVGs (scripts/card-art/build.mjs). */
function copySvgDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name.endsWith(".svg")) fs.copyFileSync(path.join(src, name), path.join(dest, name));
  }
}

function copyMp3Dir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name.endsWith(".mp3")) fs.copyFileSync(path.join(src, name), path.join(dest, name));
  }
}

/** Replace public symlinks with real art/audio so the service worker can precache them. */
function materializeAssets() {
  return {
    name: "materialize-assets",
    apply: "build" as const,
    closeBundle: {
      sequential: true,
      order: "pre" as const,
      handler() {
        const distAssets = path.join(repo, "dist", "assets");
        fs.mkdirSync(distAssets, { recursive: true });
        for (const name of ["art", "audio"]) {
          const dest = path.join(distAssets, name);
          if (fs.existsSync(dest)) {
            const st = fs.lstatSync(dest);
            if (st.isSymbolicLink()) fs.unlinkSync(dest);
            else fs.rmSync(dest, { recursive: true, force: true });
          }
        }
        copyWebps(path.join(repo, "assets", "art"), path.join(distAssets, "art"));
        copySvgDir(path.join(repo, "assets", "art", "cards"), path.join(distAssets, "art", "cards"));
        copyMp3Dir(
          path.join(repo, "assets", "audio", "words"),
          path.join(distAssets, "audio", "words"),
        );
        copyMp3Dir(
          path.join(repo, "assets", "audio", "lines"),
          path.join(distAssets, "audio", "lines"),
        );
      },
    },
  };
}

/**
 * Which build this is: when it was built and from which commit. Shown in the app's
 * bottom-right corner and written to dist/version.json, which the app fetches past
 * every cache to tell whether a newer build is live.
 */
function buildInfo(): { time: string; sha: string } {
  let sha = "dev";
  try {
    sha = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { cwd: repo, encoding: "utf8" }).trim() || "dev";
  } catch {
    /* not a git checkout */
  }
  return { time: new Date().toISOString(), sha };
}

const BUILD = buildInfo();

/** Fields the content checks use but the app never reads. Kept out of the bundle. */
const LEX_BUILD_ONLY = ["audioSha256", "arpabet", "cmuLemma", "senseMismatch"];

/**
 * content/lexicon.json is split in two at build time (review finding 2):
 * - virtual:lexicon, bundled with the app: every card, with its first two examples;
 * - virtual:lexicon-extras, its own chunk, loaded when a word card opens 更多:
 *   the other examples and the mini-dialogue, about half of the file.
 * The JSON on disk is unchanged, so every content test still reads the whole card.
 */
function splitLexicon(): Plugin {
  const file = path.join(repo, "content", "lexicon.json");
  const ids: Record<string, string> = { "virtual:lexicon": "\0eq-lexicon", "virtual:lexicon-extras": "\0eq-lexicon-extras" };
  type Example = Record<string, unknown>;
  const lean = (rows: Example[] | undefined) => rows?.map(({ audioTextSha256: _drop, ...row }) => row);
  return {
    name: "eq-lexicon-split",
    resolveId(id) {
      return ids[id];
    },
    load(id) {
      if (id !== ids["virtual:lexicon"] && id !== ids["virtual:lexicon-extras"]) return null;
      this.addWatchFile(file);
      const lex = JSON.parse(fs.readFileSync(file, "utf8")) as { items: Record<string, unknown>[] };
      if (id === ids["virtual:lexicon-extras"]) {
        const extras: Record<string, unknown> = {};
        for (const item of lex.items) {
          const examples = (item.examples as Example[] | undefined)?.slice(2) || [];
          const miniDialogue = (item.miniDialogue as Example[] | undefined) || [];
          if (examples.length || miniDialogue.length) {
            extras[item.id as string] = { examples: lean(examples), miniDialogue: lean(miniDialogue) };
          }
        }
        return `export default JSON.parse(${JSON.stringify(JSON.stringify(extras))});`;
      }
      const items = lex.items.map((raw) => {
        const item: Record<string, unknown> = { ...raw };
        for (const key of LEX_BUILD_ONLY) delete item[key];
        const examples = raw.examples as Example[] | undefined;
        const miniDialogue = raw.miniDialogue as Example[] | undefined;
        if (examples) item.examples = lean(examples.slice(0, 2));
        delete item.miniDialogue;
        if ((examples?.length || 0) > 2 || (miniDialogue?.length || 0) > 0) item.hasExtras = true;
        return item;
      });
      return `export default JSON.parse(${JSON.stringify(JSON.stringify({ ...lex, items }))});`;
    },
  };
}

function writeVersion(): Plugin {
  return {
    name: "eq-version",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: `${JSON.stringify(BUILD)}\n` });
    },
  };
}

function stampSource(): Plugin {
  return {
    name: "eq-source-stamp",
    transformIndexHtml(html) {
      const hash = sourceHash();
      const meta = `<meta name="eq-source" content="${hash}" />`;
      return html.includes("eq-source") ? html : html.replace("</head>", `    ${meta}\n  </head>`);
    },
  };
}

export default defineConfig({
  root: path.join(repo, "web"),
  base: "/english-quest/",
  publicDir: path.join(repo, "public"),
  build: {
    outDir: path.join(repo, "dist"),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    fs: { allow: [repo] },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  define: {
    __EQ_BUILD__: JSON.stringify(BUILD),
  },
  plugins: [
    react(),
    splitLexicon(),
    materializeAssets(),
    stampSource(),
    writeVersion(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png", "icons/icon-192.png"],
      manifest: {
        name: "English Quest 情景英文",
        short_name: "情景英文",
        description: "畀廣東話使用者嘅實用情景英語：日常生活、旅行、餐廳、返工同珠寶店面。",
        lang: "zh-Hant",
        dir: "ltr",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#FFF8EF",
        theme_color: "#E8F6FF",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      injectManifest: {
        // Classic worker. A module worker does not install on older iOS.
        rollupFormat: "iife",
        // Stable mp3 and webp names must keep a revision or a pronunciation fix
        // stays cached. Only a top-level fingerprinted file may use null.
        dontCacheBustURLsMatching: /^assets\/[^/]+-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/,
        globPatterns: ["**/*.{js,css,html,svg,png,webp,mp3,webmanifest}"],
        globIgnores: [
          "**/index.html",
          "sw.js",
          "**/sw.js",
          "**/registerSW.js",
          "**/manifest.webmanifest",
          "**/workbox-*.js",
          "**/*.wav",
          "**/*.jpg",
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
