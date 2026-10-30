import { useEffect } from "react";
import { preloadArt } from "./art";
import { lessons, asset } from "./data";
import { LessonView } from "./Lesson";
import { Attributions, PathHome, Profile, Review, Settings, WordDetail, Words } from "./pages";
import { VocabDeck, VocabHub, VocabQuiz } from "./Vocab";
import { useStore } from "./store";
import type { Route } from "./types";

export default function Shell({ route }: { route: Route }) {
  const profile = useStore((s) => s.profile);

  useEffect(() => {
    const cast = ["mei", "tom", "ana", "kai"];
    preloadArt([
      asset("assets/art/cover.webp"),
      ...lessons.map((lesson) => asset(lesson.hero)),
      ...cast.map((id) => asset(`assets/art/refs/${id}.webp`)),
    ]);
  }, []);

  const lesson = route.name === "lesson";
  const tabbed = route.name === "path" || route.name === "review" || route.name === "words" || route.name === "profile" || route.name === "vocab";

  let body = <PathHome />;
  if (route.name === "path") body = <PathHome />;
  else if (route.name === "review") body = <Review />;
  else if (route.name === "words") body = <Words />;
  else if (route.name === "word") body = <WordDetail id={route.id} />;
  else if (route.name === "profile") body = <Profile />;
  else if (route.name === "settings") body = <Settings />;
  else if (route.name === "attributions") body = <Attributions />;
  else if (route.name === "lesson") body = <LessonView id={route.id} />;
  else if (route.name === "vocab" && route.quiz && route.deckId) body = <VocabQuiz deckId={route.deckId} />;
  else if (route.name === "vocab" && route.deckId) body = <VocabDeck deckId={route.deckId} />;
  else if (route.name === "vocab") body = <VocabHub />;

  return (
    <div className={lesson && profile ? "phone noscroll" : "phone"}>
      <SaveBanner />
      {body}
      {tabbed && profile && <Tabs route={route} />}
    </div>
  );
}

function SaveBanner() {
  const status = useStore((s) => s.saveStatus);
  const retrySave = useStore((s) => s.retrySave);
  if (status.kind !== "unsaved") return null;
  return (
    <div className="save-banner" role="status">
      <p><strong>未儲存</strong> {status.reason}</p>
      <button className="btn quiet" type="button" onClick={() => retrySave()}>再試</button>
    </div>
  );
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
