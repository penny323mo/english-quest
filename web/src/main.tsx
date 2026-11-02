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
  // Ignore the claim that follows this load. A later update still reloads once.
  let skipUntil = 0;
  try {
    if (sessionStorage.getItem("eq-skip-claim") === "1") skipUntil = Date.now() + 2000;
    sessionStorage.removeItem("eq-skip-claim");
  } catch {
    skipUntil = 0;
  }
  if ("serviceWorker" in navigator) {
    let refreshing = false;
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (Date.now() < skipUntil) return;
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
  document.documentElement.classList.add("eq-ready");
});
