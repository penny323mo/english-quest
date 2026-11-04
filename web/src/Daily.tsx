import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import wordAudioFile from "../../content/word-audio.json";
import cardArtFile from "../../content/card-art.json";
import { DAILY_XP, drawDaily, macauDate } from "./daily.mjs";
import { SHIPPED, asset, isLessonOpen, lessonById, lexById, lexicon } from "./data";
import { fillLearner } from "./learner";
import { playAsset, stopAudio } from "./media";
import { preloadArt } from "./art";
import { playSfx } from "./sfx";
import { useStore } from "./store";
import type { LexItem } from "./types";

type WordClip = { audio: string; audioSlow: string; say: string };
const wordAudio = (wordAudioFile as { items: Record<string, WordClip> }).items;
const cardArt = (cardArtFile as { cards: Record<string, string> }).cards;

/** How long the pack shakes, then the gap between each card's reveal. About 1s in all. */
const SHAKE_MS = 400;
const REVEAL_MS = 200;

function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cards from lessons the learner has open or has finished, then the whole deck. */
function drawToday(date: string): string[] {
  const s = useStore.getState();
  const goal = s.profile?.goal ?? "foundation";
  const started = s.lessonCursor?.lessonId ?? null;
  const preferred: string[] = [];
  for (const id of SHIPPED) {
    if (s.progress[id] || isLessonOpen(id, goal, s.progress, started)) preferred.push(...(lessonById[id]?.lemmas || []));
  }
  const pool = lexicon.items.filter((item) => wordAudio[item.id]).map((item) => item.id);
  const history = s.daily ? [{ date: s.daily.date, ids: s.daily.ids }, ...s.daily.history] : [];
  return drawDaily({ date, preferred: preferred.filter((id) => wordAudio[id]), pool, history });
}

const WASHES = ["#FFE3D9", "#FCEFC4", "#D8F0EC", "#DCEFFA"];

function CardArt({ item }: { item: LexItem }) {
  const src = cardArt[item.id];
  if (src) return <img className="draw-art" src={asset(src)} alt="" width={160} height={160} />;
  // Placeholder until the picture is added to content/card-art.json.
  const wash = WASHES[[...item.id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % WASHES.length];
  return (
    <svg className="draw-art placeholder" viewBox="0 0 120 120" width={160} height={160} aria-hidden="true" data-placeholder="true">
      <circle cx="60" cy="62" r="50" fill={wash} />
      <circle cx="60" cy="62" r="50" fill="none" stroke="#E0A820" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" opacity=".5" />
      <path d="M98 22l2 5l5 2l-5 2l-2 5l-2-5l-5-2l5-2z" fill="#F5C84C" />
      <text x="60" y="78" textAnchor="middle" fontSize="46" fontWeight="800" fill="#1F2A37" fontFamily="Nunito, sans-serif">
        {item.lemma.charAt(0).toUpperCase()}
      </text>
    </svg>
  );
}

function stop(e: MouseEvent) {
  e.stopPropagation();
}

/** Hide the face that is turned away from screen readers and the keyboard. */
function useInert<T extends HTMLElement>(hidden: boolean) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (hidden) ref.current.setAttribute("inert", "");
    else ref.current.removeAttribute("inert");
  }, [hidden]);
  return ref;
}

function DrawCard({ item, index, flipped, onFlip }: { item: LexItem; index: number; flipped: boolean; onFlip: () => void }) {
  const [hint, setHint] = useState(false);
  const name = useStore((s) => s.profile?.name);
  const clip = wordAudio[item.id];
  const front = useInert<HTMLDivElement>(flipped);
  const back = useInert<HTMLDivElement>(!flipped);
  return (
    <div className={flipped ? "draw-card flipped" : "draw-card"} data-card={item.id} onClick={onFlip}>
      <div className="draw-inner">
        <div className="draw-face front" ref={front} aria-hidden={flipped}>
          <span className="draw-count">{index + 1} / 3</span>
          <CardArt item={item} />
          <h2 lang="en" className="draw-word">{item.lemma}</h2>
          <div className="draw-btns">
            <button className="btn" type="button" aria-label={`聽 ${item.lemma}`} onClick={(e) => { stop(e); playAsset(clip.audio); }}>
              🔊
            </button>
            <button className="btn ghost" type="button" aria-expanded={hint} onClick={(e) => { stop(e); setHint((on) => !on); }}>
              提示
            </button>
          </div>
          <p className="draw-hint" aria-live="polite">{hint ? item.glossYue : " "}</p>
          <button className="draw-flip" type="button" onClick={(e) => { stop(e); onFlip(); }}>撳卡翻轉</button>
        </div>
        <div className="draw-face back" ref={back} aria-hidden={!flipped}>
          <span className="draw-count">{index + 1} / 3 · <span lang="en">{item.lemma}</span></span>
          <p lang="en" className="draw-example">{fillLearner(item.example, name)}</p>
          <p className="gloss draw-gloss">{fillLearner(item.exampleYue, name)}</p>
          <button className="btn" type="button" aria-label="聽例句" onClick={(e) => { stop(e); playAsset(item.audio); }}>
            🔊 例句
          </button>
          <button className="draw-flip" type="button" onClick={(e) => { stop(e); onFlip(); }}>翻返正面</button>
        </div>
      </div>
    </div>
  );
}

function Pack({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (reducedMotion()) {
      done.current();
      return;
    }
    const timers = ids.map((_, i) => window.setTimeout(() => setShown(i + 1), SHAKE_MS + i * REVEAL_MS));
    timers.push(window.setTimeout(() => done.current(), SHAKE_MS + ids.length * REVEAL_MS + 150));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [ids]);
  return (
    <button className={shown ? "draw-pack open" : "draw-pack"} type="button" onClick={onDone} aria-label="跳過動畫">
      <span className="pack-body" aria-hidden="true">
        <span className="pack-ribbon" />
        <span className="pack-label">每日抽卡</span>
      </span>
      <span className="pack-row" aria-hidden="true">
        {ids.map((id, i) => (
          <span key={id} className={i < shown ? "pack-card in" : "pack-card"}>
            <span lang="en">{lexById[id]?.lemma}</span>
          </span>
        ))}
      </span>
      <span className="fine">撳一下跳過</span>
    </button>
  );
}

export default function Daily() {
  const profile = useStore((s) => s.profile);
  const daily = useStore((s) => s.daily);
  const startDaily = useStore((s) => s.startDaily);
  const finishDaily = useStore((s) => s.finishDaily);
  const [today] = useState(() => macauDate());
  const current = daily && daily.date === today ? daily : null;
  const [phase, setPhase] = useState<"pack" | "cards">(() => (current?.done ? "cards" : "pack"));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState<boolean[]>(() => [false, false, false]);
  const [seen, setSeen] = useState<boolean[]>(() => (current?.done ? [true, true, true] : [false, false, false]));
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    if (profile && !current) startDaily(today, drawToday(today));
  }, [profile, current, startDaily, today]);

  useEffect(() => () => stopAudio(), []);

  // Fetch the day's three pictures while the pack is still shaking.
  const ids = current?.ids;
  useEffect(() => {
    if (ids) preloadArt(ids.map((id) => cardArt[id]).filter(Boolean).map((rel) => asset(rel)));
  }, [ids]);

  if (!profile) return null;
  if (!current) return <section className="screen plain"><p className="lede">抽緊卡…</p></section>;
  const items = current.ids.map((id) => lexById[id]).filter(Boolean) as LexItem[];
  const item = items[index];
  const allSeen = seen.every(Boolean);

  function flip(i: number) {
    playSfx("tap");
    setFlipped((list) => list.map((on, k) => (k === i ? !on : on)));
    setSeen((list) => list.map((on, k) => (k === i ? true : on)));
  }

  function finish() {
    finishDaily(today);
    setFresh(true);
    playSfx("complete");
  }

  return (
    <section className="screen plain daily">
      <a className="back" href="#/">返路徑</a>
      <p className="eyebrow">每日任務</p>
      <h1>每日抽卡</h1>
      {phase === "pack" ? (
        <Pack ids={current.ids} onDone={() => setPhase("cards")} />
      ) : (
        <>
          <div className="draw-dots" role="tablist" aria-label="三張卡">
            {items.map((card, i) => (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`draw-dot${i === index ? " on" : ""}${seen[i] ? " seen" : ""}`}
                onClick={() => setIndex(i)}
              >
                <span lang="en">{card.lemma}</span>
              </button>
            ))}
          </div>
          {item ? <DrawCard key={item.id} item={item} index={index} flipped={flipped[index]} onFlip={() => flip(index)} /> : null}
          {current.done ? (
            <div className="result-banner draw-done" role="status">
              <strong>{fresh ? `今日抽卡完成 +${DAILY_XP} XP` : "今日抽卡已完成"}</strong>
              <span>三張卡已經加入生字回顧。聽日再抽三張。</span>
              <a className="btn block" href="#/vocab">去生字回顧</a>
            </div>
          ) : index < items.length - 1 ? (
            <button className="btn block" type="button" disabled={!seen[index]} onClick={() => setIndex(index + 1)}>
              {seen[index] ? "下一張" : "先翻卡睇例句"}
            </button>
          ) : (
            <button className="btn block" type="button" disabled={!allSeen} onClick={finish}>
              {allSeen ? "完成今日抽卡" : "三張都翻過先完成"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
