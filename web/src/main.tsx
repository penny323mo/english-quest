import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// PWA: vite-plugin-pwa injectRegister=script-defer only registers; it does not
// reload on a new SW. skipWaiting+clientsClaim alone leave the old document in
// memory (Penny's iPhone kept the pre-redesign dark shell). Reload once when
// the new worker takes control so light chrome actually appears.
if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

const root = document.getElementById("root");
if (!root) throw new Error("missing root");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
