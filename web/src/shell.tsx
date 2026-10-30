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
    const cast = ["mei", "tom", "ana", "kai", "jo", "sam", "kim", "ray", "noa", "may", "pat", "nia", "ada", "owen", "wen", "ben", "lea", "ren", "mina", "cole", "ling"];
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

function TabIcon({ kind }: { kind: "path" | "words" | "practice" | "me" }) {
  const props = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "path") {
    return <svg {...props}><path d="M5 17c3-6 5-2 8-8s4-2 6 1" /><circle cx="5" cy="17" r="1.7" fill="currentColor" stroke="none" /><circle cx="19" cy="10" r="1.7" fill="currentColor" stroke="none" /></svg>;
  }
  if (kind === "words") {
    return <svg {...props}><path d="M6 5h9a3 3 0 0 1 3 3v11H9a3 3 0 0 0-3 3z" /><path d="M6 5v14" /></svg>;
  }
  if (kind === "practice") {
    return <svg {...props}><path d="M8 6h8v12H8z" /><path d="M10 10h4M10 14h4" /></svg>;
  }
  return <svg {...props}><circle cx="12" cy="9" r="3" /><path d="M6 18c1.4-2.4 3.2-3.4 6-3.4S16.6 15.6 18 18" /></svg>;
}

function Tabs({ route }: { route: Route }) {
  const items = [
    ["/", "路徑", "path"],
    ["/vocab", "生字", "words"],
    ["/review", "練習", "practice"],
    ["/profile", "我", "me"],
  ] as const;
  return (
    <nav className="tabs" aria-label="主要">
      {items.map(([href, label, kind]) => {
        const current =
          (href === "/" && route.name === "path") ||
          (href === "/vocab" && (route.name === "vocab" || route.name === "word")) ||
          (href === "/review" && route.name === "review") ||
          (href === "/profile" && route.name === "profile");
        return (
          <a key={href} href={`#${href}`} aria-current={current ? "page" : undefined}>
            <TabIcon kind={kind} />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
