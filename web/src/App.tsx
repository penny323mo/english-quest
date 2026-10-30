import { lazy, Suspense, useEffect, useState } from "react";
import { Onboarding } from "./Onboarding";
import { unlockSfx } from "./sfx";
import { hydrate, retryHydrate, useStore } from "./store";
import type { Route } from "./types";

const Shell = lazy(() => import("./shell"));

function parse(hash: string): Route {
  const path = (hash.replace(/^#/, "") || "/").split("?")[0];
  if (path === "/" || path === "") return { name: "path" };
  if (path === "/onboarding") return { name: "onboarding" };
  if (path === "/review") return { name: "review" };
  if (path === "/words") return { name: "words" };
  if (path === "/profile") return { name: "profile" };
  if (path === "/attributions") return { name: "attributions" };
  if (path === "/settings") return { name: "settings" };
  if (path === "/vocab") return { name: "vocab" };
  const vocab = path.match(/^\/vocab\/([^/]+)(\/quiz)?$/);
  if (vocab) return { name: "vocab", deckId: decodeURIComponent(vocab[1]), quiz: Boolean(vocab[2]) };
  if (path.startsWith("/lesson/")) return { name: "lesson", id: decodeURIComponent(path.slice("/lesson/".length)) };
  if (path.startsWith("/word/")) return { name: "word", id: decodeURIComponent(path.slice("/word/".length)) };
  return { name: "path" };
}

function useRoute(): Route {
  const [hash, setHash] = useState(() => location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return parse(hash);
}

function Splash() {
  return (
    <div className="phone splash">
      <p className="eyebrow">English Quest</p>
      <h1>情景英文</h1>
      <p className="lede">珠寶櫃檯、登機、入座。</p>
    </div>
  );
}

export function App() {
  const ready = useStore((s) => s.ready);
  const profile = useStore((s) => s.profile);
  const saveStatus = useStore((s) => s.saveStatus);
  const route = useRoute();

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    const unlock = () => unlockSfx();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = {
      path: "路徑",
      onboarding: "開始",
      lesson: "課堂",
      review: "練習",
      words: "生字",
      word: "詞卡",
      profile: "我",
      attributions: "出處",
      settings: "設定",
      vocab: "生字",
    };
    document.title = `${titles[route.name]} · 情景英文`;
  }, [route]);

  if (!ready) return <div className="stage"><Splash /></div>;

  if (saveStatus.kind === "readonly") {
    return (
      <div className="stage">
        <div className="phone">
          <section className="screen stack">
            <p className="eyebrow">進度</p>
            <h1>讀唔到進度</h1>
            <p className="lede">{saveStatus.reason}</p>
            <p className="note">為咗唔好覆蓋舊紀錄，而家暫停寫入。</p>
            <button className="btn block" type="button" onClick={() => void retryHydrate()}>再試</button>
          </section>
        </div>
      </div>
    );
  }

  const showOnboarding = (!profile && route.name !== "attributions") || route.name === "onboarding";
  if (showOnboarding) {
    return (
      <div className="stage">
        <div className="phone">
          <Onboarding />
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      <Suspense fallback={<Splash />}>
        <Shell route={route} />
      </Suspense>
    </div>
  );
}
