import { useEffect, useState } from "react";
import { LessonView } from "./Lesson";
import { Attributions, Onboarding, PathHome, Profile, Review, Settings, WordDetail, Words } from "./pages";
import { hydrate, useStore } from "./store";
import type { Route } from "./types";

function parse(hash: string): Route {
  const path = (hash.replace(/^#/, "") || "/").split("?")[0];
  if (path === "/" || path === "") return { name: "path" };
  if (path === "/onboarding") return { name: "onboarding" };
  if (path === "/review") return { name: "review" };
  if (path === "/words") return { name: "words" };
  if (path === "/profile") return { name: "profile" };
  if (path === "/attributions") return { name: "attributions" };
  if (path === "/settings") return { name: "settings" };
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

function Tabs({ route }: { route: Route }) {
  const items = [
    ["/", "路線"],
    ["/review", "重溫"],
    ["/words", "詞庫"],
    ["/profile", "我"],
  ] as const;
  return (
    <nav className="tabs" aria-label="主要">
      {items.map(([href, label]) => {
        const current =
          (href === "/" && route.name === "path") ||
          (href === "/review" && route.name === "review") ||
          (href === "/words" && route.name === "words") ||
          (href === "/profile" && route.name === "profile");
        return (
          <a key={href} href={`#${href}`} aria-current={current ? "page" : undefined}>
            {label}
          </a>
        );
      })}
    </nav>
  );
}

export function App() {
  const ready = useStore((s) => s.ready);
  const profile = useStore((s) => s.profile);
  const route = useRoute();

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = {
      path: "路線",
      onboarding: "開始",
      lesson: "課堂",
      review: "重溫",
      words: "詞庫",
      word: "詞卡",
      profile: "我",
      attributions: "出處",
      settings: "設定",
    };
    document.title = `${titles[route.name]} · 情景英文`;
  }, [route]);

  if (!ready) {
    return (
      <div className="stage">
        <div className="phone splash">
          <p className="eyebrow">English Quest</p>
          <h1>情景英文</h1>
          <p className="lede">珠寶櫃檯、登機、入座。</p>
        </div>
      </div>
    );
  }

  const showOnboarding = !profile && route.name !== "attributions";
  const lesson = route.name === "lesson";
  const tabbed = !showOnboarding && (route.name === "path" || route.name === "review" || route.name === "words" || route.name === "profile");

  let body = <PathHome />;
  if (showOnboarding || route.name === "onboarding") body = <Onboarding />;
  else if (route.name === "path") body = <PathHome />;
  else if (route.name === "review") body = <Review />;
  else if (route.name === "words") body = <Words />;
  else if (route.name === "word") body = <WordDetail id={route.id} />;
  else if (route.name === "profile") body = <Profile />;
  else if (route.name === "settings") body = <Settings />;
  else if (route.name === "attributions") body = <Attributions />;
  else if (route.name === "lesson") body = <LessonView id={route.id} />;

  return (
    <div className="stage">
      <div className={lesson && profile ? "phone noscroll" : "phone"}>
        {body}
        {tabbed && <Tabs route={route} />}
      </div>
    </div>
  );
}
