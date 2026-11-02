import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

declare global {
  interface Window {
    __eqKill?: Promise<void>;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("missing root");

const ready = window.__eqKill ?? Promise.resolve();
void ready.then(() => {
  // Reload once when a newer worker takes over a page that already had one.
  // The first install (no previous controller) must not reload in a loop.
  if ("serviceWorker" in navigator) {
    let refreshing = false;
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing || !hadController) return;
      refreshing = true;
      window.location.reload();
    });
    window.addEventListener("load", () => {
      const base = import.meta.env.BASE_URL || "/";
      void navigator.serviceWorker.register(`${base}sw.js`, {
        scope: base,
        updateViaCache: "none",
      });
    });
  }
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
