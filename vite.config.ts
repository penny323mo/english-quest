import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  plugins: [
    react(),
    materializeAssets(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png", "icons/icon-192.png"],
      manifest: {
        name: "English Quest 情景英文",
        short_name: "情景英文",
        description: "畀廣東話使用者嘅情景英語：珠寶櫃檯、登機、入座。",
        lang: "zh-Hant",
        dir: "ltr",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#1B1F3B",
        theme_color: "#1B1F3B",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Vite's default skips revisions for every assets/ URL. Stable mp3 and
        // webp names would then stay cached after a pronunciation fix. Only
        // top-level fingerprinted build files (index-AbCd1234.js) may use a
        // null revision. The hash class excludes "-" so names like det-slow.mp3
        // still get a content revision.
        dontCacheBustURLsMatching: /^assets\/[^/]+-[A-Za-z0-9_]{8}\.[a-z0-9]+$/,
        globPatterns: ["**/*.{js,css,html,svg,png,webp,mp3,webmanifest}"],
        globIgnores: ["**/*.wav", "**/*.jpg"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/\.mp3$/, /\.webp$/, /\.png$/, /\.svg$/],
      },
    }),
  ],
});
