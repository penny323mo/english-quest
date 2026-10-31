import { useEffect, useMemo, useState } from "react";
import { Rating, type Grade } from "ts-fsrs";
import { asset, decks, lexById } from "./data";
import { isDue } from "./fsrs";
import { learnerEyebrow } from "./labels";
import { playAsset } from "./media";
import { playSfx } from "./sfx";
import { useStore } from "./store";
import type { LexItem, StoredCard } from "./types";

function deckById(id: string) {
  return decks.decks.find((deck) => deck.id === id);
}

const NEW_CAP = 10;

function rankCard(id: string, cards: Record<string, StoredCard>) {
  const card = cards[id];
  if (card && isDue(card)) return 0;
  if (!card) return 1;
  return 2;
}

function dueFirst(lemmas: string[], cards: Record<string, StoredCard>) {
  return [...lemmas].sort((a, b) => {
    const delta = rankCard(a, cards) - rankCard(b, cards);
    if (delta) return delta;
    return (cards[a]?.due || "").localeCompare(cards[b]?.due || "");
  });
}

function sessionQueue(lemmas: string[], cards: Record<string, StoredCard>) {
  const ranked = dueFirst(lemmas, cards);
  const due = ranked.filter((id) => cards[id] && isDue(cards[id]));
  const fresh = ranked.filter((id) => !cards[id]);
  const queue = due.slice(0, NEW_CAP);
  if (queue.length < NEW_CAP) queue.push(...fresh.slice(0, NEW_CAP - queue.length));
  return queue;
}

function statsFor(lemmas: string[], cards: Record<string, StoredCard>) {
  let due = 0;
  let fresh = 0;
  let mastered = 0;
  for (const id of lemmas) {
    const card = cards[id];
    if (card && isDue(card)) due += 1;
    if (!card) fresh += 1;
    if (card && card.reps > 0 && !isDue(card)) mastered += 1;
  }
  const percent = lemmas.length ? Math.round((mastered / lemmas.length) * 100) : 0;
  return { due, fresh, mastered, percent };
}

const DECK_GLYPH: Record<string, string> = {
  jewellery: "gem",
  restaurant: "fork",
  travel: "plane",
  work: "meet",
  daily: "sun",
};

function DeckGlyph({ kind }: { kind: string }) {
  const props = {
    viewBox: "0 0 24 24",
    width: 28,
    height: 28,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (kind === "gem") return <svg {...props}><path d="M7 9l5-4 5 4-5 10z" /><path d="M7 9h10" /></svg>;
  if (kind === "fork") return <svg {...props}><path d="M8 3v7a3 3 0 0 0 3 3v8M8 3v5M11 3v5" /></svg>;
  if (kind === "plane") return <svg {...props}><path d="M3 13l18-6-6 14-2-6-6-2z" /></svg>;
  if (kind === "meet") return <svg {...props}><circle cx="8" cy="9" r="2.2" /><circle cx="16" cy="9" r="2.2" /><path d="M4 17c.8-2 2.2-3 4-3s3.2 1 4 3M12 17c.8-2 2.2-3 4-3s3.2 1 4 3" /></svg>;
  return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></svg>;
}

function hubDue(cards: Record<string, StoredCard>) {
  const inDeck = new Set<string>();
  let tileDue = 0;
  for (const deck of decks.decks) {
    tileDue += statsFor(deck.lemmas, cards).due;
    for (const id of deck.lemmas) inDeck.add(id);
  }
  let outside = 0;
  for (const card of Object.values(cards)) {
    if (isDue(card) && lexById[card.id] && !inDeck.has(card.id)) outside += 1;
  }
  return { tileDue, outside };
}

export function VocabHub() {
  const cards = useStore((s) => s.cards);
  const { tileDue, outside } = hubDue(cards);
  return (
    <section className="screen stack">
      <div className="hub-hero">
        <img className="mascot" src={asset("assets/art/mascot-wave.webp")} alt="小燈" width={64} height={64} />
        <div>
          <h1 className="path-title">生字回顧</h1>
          <p className="lede">按情境溫常用字。仲未熟同識咗只係排期，唔會扣分。</p>
        </div>
      </div>
      <div className="due-cta">
        <div>
          <p className="due-n">{tileDue}</p>
          <p className="fine">今日到期要溫</p>
          {outside > 0 && <p className="fine">另有 {outside} 張未入牌組</p>}
        </div>
        <a className="btn" href="#/review">開始溫習</a>
      </div>
      <p className="sec">情境牌組</p>
      <div className="deck-grid">
        {decks.decks.map((deck) => {
          const stats = statsFor(deck.lemmas, cards);
          return (
            <a key={deck.id} className="deck-card" href={`#/vocab/${deck.id}`}>
              <span className="deck-ico"><DeckGlyph kind={DECK_GLYPH[deck.id] || "sun"} /></span>
              <h2>{deck.titleYue}</h2>
              <p className="fine">{deck.lemmas.length} 字 · 到期 {stats.due} · 新字 {stats.fresh}</p>
              <span className="ring" aria-hidden="true"><i style={{ width: `${stats.percent}%` }} /></span>
            </a>
          );
        })}
      </div>
      <p className="sec">練習</p>
      <a className="mode-row" href="#/review">
        <span className="deck-ico"><DeckGlyph kind="meet" /></span>
        <span>
          <strong>到期練習</strong>
          <p className="fine">FSRS 排期，冇紅心</p>
        </span>
      </a>
      <a className="mode-row" href="#/words">
        <span className="deck-ico"><DeckGlyph kind="gem" /></span>
        <span>
          <strong>搜尋全部生字</strong>
          <p className="fine">英文、粵語、音標</p>
        </span>
      </a>
      {decks.decks.length === 0 && <p className="note">未有呢疊生字。</p>}
    </section>
  );
}

function WordCard({
  item,
  openMore,
  onToggleMore,
}: {
  item: LexItem;
  openMore: boolean;
  onToggleMore: () => void;
}) {
  const examples = item.examples?.length
    ? item.examples
    : [{ en: item.example, yue: item.exampleYue, audio: item.audio, audioSlow: item.audioSlow }];
  const shown = examples.slice(0, 2);
  const extra = examples.slice(2);
  const hasUsage = Boolean(item.register || item.usageNotes || item.collocations.length || item.pitfallsYue);
  const hasMore = extra.length > 0 || Boolean(item.related?.length) || Boolean(item.miniDialogue?.length);
  return (
    <article className="word-card">
      <div className="word-head">
        <div className="word-tile" aria-hidden="true">{item.lemma.slice(0, 1).toUpperCase()}</div>
        <div className="word-id">
          <h2 lang="en">{item.lemma}</h2>
          <div className="word-meta">
            <span className="word-pos">{learnerEyebrow(item)}</span>
            <span className="ipa">{item.ipa}</span>
            <button className="word-play" type="button" aria-label="播放" onClick={() => playAsset(item.audio)}>▶</button>
            <button className="word-play slow" type="button" aria-label="慢速" onClick={() => playAsset(item.audioSlow)}>▶ 慢速</button>
          </div>
        </div>
      </div>
      <div className="word-gloss">
        <div>
          <p className="k">廣東話意思</p>
          <p className="v">{item.glossYue}</p>
        </div>
      </div>
      {hasUsage && (
        <div className="usage">
          <h3 className="word-label">用法 USAGE</h3>
          {item.register && <p>語域：{item.register}</p>}
          {item.usageNotes && <p>{item.usageNotes}</p>}
          {item.collocations.length > 0 && (
            <ul>
              {item.collocations.map((phrase) => <li key={phrase} lang="en">{phrase}</li>)}
            </ul>
          )}
          {item.pitfallsYue && <p className="pit">⚠ 港式易錯：{item.pitfallsYue}</p>}
        </div>
      )}
      <div className="word-examples">
        <h3 className="word-label">例句 EXAMPLES</h3>
        {shown.map((example) => <ExampleRow key={example.en} example={example} />)}
      </div>
      {hasMore && (
        <div className="word-more">
          <button className="word-more-toggle" type="button" onClick={onToggleMore}>{openMore ? "收起" : "更多"}</button>
          {openMore && (
            <>
              {extra.map((example) => <ExampleRow key={example.en} example={example} />)}
              {item.related && item.related.length > 0 && (
                <div className="word-related">
                  {item.related.map((id) => {
                    const related = lexById[id];
                    if (!related) return null;
                    return <a key={id} className="word-chip" href={`#/word/${id}`} lang="en">{related.lemma}</a>;
                  })}
                </div>
              )}
              {item.miniDialogue && item.miniDialogue.length > 0 && (
                <div className="word-mini">
                  {item.miniDialogue.map((turn, index) => (
                    <p key={turn.en}>
                      <span className="who">{index % 2 === 0 ? "甲" : "乙"}：</span>
                      <span lang="en">{turn.en}</span>
                      <span className="gloss"> {turn.yue}</span>
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}

function ExampleRow({ example }: { example: { en: string; yue: string; audio: string; audioSlow: string } }) {
  return (
    <div className="word-ex">
      <div>
        <p className="en" lang="en">{example.en}</p>
        <p className="yue">{example.yue}</p>
      </div>
      <div className="word-ex-play">
        <button className="word-play" type="button" aria-label="播放" onClick={() => playAsset(example.audio)}>▶</button>
        <button className="word-play slow" type="button" aria-label="慢速" onClick={() => playAsset(example.audioSlow)}>▶ 慢速</button>
      </div>
    </div>
  );
}

export function VocabDeck({ deckId }: { deckId: string }) {
  const deck = deckById(deckId);
  const cards = useStore((s) => s.cards);
  const enqueue = useStore((s) => s.enqueueLemmas);
  const gradeCard = useStore((s) => s.gradeCard);
  const [session] = useState(() => {
    const cardsNow = useStore.getState().cards;
    return deck ? sessionQueue(deck.lemmas, cardsNow) : [];
  });
  const [index, setIndex] = useState(0);
  const [more, setMore] = useState(false);
  const [markState, setMarkState] = useState<null | "good" | "again">(null);
  const item = lexById[session[index] || ""];
  const stats = useMemo(() => (deck ? statsFor(deck.lemmas, cards) : null), [deck, cards]);

  useEffect(() => {
    if (session.length) enqueue(session);
  }, [enqueue, session]);

  if (!deck || !stats) {
    return (
      <section className="screen plain stack">
        <a className="back" href="#/vocab">返生字</a>
        <h1>未有呢疊生字。</h1>
      </section>
    );
  }

  function mark(id: string, rating: Grade) {
    if (markState) return;
    enqueue([id]);
    gradeCard(id, rating);
    playSfx(rating === Rating.Good ? "xp" : "streak");
    setMarkState(rating === Rating.Good ? "good" : "again");
  }

  return (
    <section className="screen stack deck-screen">
      <a className="back" href="#/vocab">返生字</a>
      <p className="eyebrow">{deck.titleYue}</p>
      <p className="kicker">{stats.percent}% · 到期 {stats.due} · 新字 {stats.fresh}</p>
      <div className="deck-body">
        {!item && <p className="note">今次 {session.length} 張溫完。到期嘅仍然會排喺前面。</p>}
        {item && (
          <>
            <p className="fine">{index + 1} / {session.length}</p>
            <WordCard item={item} openMore={more} onToggleMore={() => setMore((open) => !open)} />
            {markState === "good" && <p className="note">記住咗</p>}
            {markState === "again" && <p className="note">再排一次</p>}
          </>
        )}
        <a className="btn block" href={`#/vocab/${deck.id}/quiz`}>小測</a>
      </div>
      {item && (markState ? (
        <div className="word-foot">
          <button className="btn block" type="button" onClick={() => { setMarkState(null); setMore(false); setIndex((n) => n + 1); }}>下一張</button>
        </div>
      ) : (
        <div className="row-btns word-foot">
          <button className="btn ghost" type="button" onClick={() => mark(item.id, Rating.Again)}>仲未熟</button>
          <button className="btn" type="button" onClick={() => mark(item.id, Rating.Good)}>識咗 ✓</button>
        </div>
      ))}
    </section>
  );
}

type QuizQ = {
  kind: "listen" | "meaning";
  item: LexItem;
  choices: string[];
  answer: number;
};

function buildQuiz(lemmas: string[], cards: Record<string, StoredCard>): QuizQ[] {
  const ids = dueFirst(lemmas, cards).slice(0, 4);
  const pool = lemmas.map((id) => lexById[id]).filter((item): item is LexItem => Boolean(item));
  const out: QuizQ[] = [];
  ids.forEach((id, index) => {
    const item = lexById[id];
    if (!item) return;
    out.push(choiceQuestion("listen", item, pool, index, (row) => row.glossYue));
    out.push(choiceQuestion("meaning", item, pool, index + 1, (row) => row.lemma));
  });
  return out;
}

function choiceQuestion(
  kind: "listen" | "meaning",
  item: LexItem,
  pool: LexItem[],
  salt: number,
  label: (row: LexItem) => string,
): QuizQ {
  const distractors = pool.filter((row) => row.id !== item.id && label(row) !== label(item));
  const picked: LexItem[] = [];
  for (let n = 0; n < distractors.length && picked.length < 2; n += 1) {
    const row = distractors[(salt + n) % distractors.length];
    if (row && !picked.includes(row)) picked.push(row);
  }
  const labels = [label(item), ...picked.map(label)].slice(0, 3);
  const answer = salt % labels.length;
  const choices = labels.filter((text) => text !== label(item));
  choices.splice(answer, 0, label(item));
  return { kind, item, choices, answer: choices.indexOf(label(item)) };
}

export function VocabQuiz({ deckId }: { deckId: string }) {
  const deck = deckById(deckId);
  const cards = useStore((s) => s.cards);
  const enqueue = useStore((s) => s.enqueueLemmas);
  const gradeCard = useStore((s) => s.gradeCard);
  const [questions] = useState(() => (deck ? buildQuiz(deck.lemmas, useStore.getState().cards) : []));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const question = questions[index];
  const stats = deck ? statsFor(deck.lemmas, cards) : null;

  useEffect(() => {
    const ids = questions.map((row) => row.item.id);
    if (ids.length) enqueue(ids);
  }, [enqueue, questions]);

  if (!deck || !stats) {
    return (
      <section className="screen plain stack">
        <a className="back" href="#/vocab">返生字</a>
        <h1>未有呢疊生字。</h1>
      </section>
    );
  }

  function choose(i: number) {
    if (!question || picked !== null) return;
    setPicked(i);
    enqueue([question.item.id]);
    const ok = i === question.answer;
    gradeCard(question.item.id, ok ? Rating.Good : Rating.Again);
    playSfx(ok ? "correct" : "wrong");
  }

  return (
    <section className="screen stack">
      <a className="back" href={`#/vocab/${deck.id}`}>返生字</a>
      <p className="eyebrow">生字小測</p>
      <p className="kicker">{deck.titleYue} · {stats.percent}% · 到期 {stats.due}</p>
      {!question && <p className="note">小測做完。聽選同意思選都會計入排期。</p>}
      {question && (
        <>
          <p className="fine">{index + 1} / {questions.length} · {question.kind === "listen" ? "聽選" : "意思選"}</p>
          {question.kind === "listen" ? (
            <button className="btn block" type="button" onClick={() => playAsset(question.item.audio)}>聽問題</button>
          ) : (
            <h2>{question.item.glossYue}</h2>
          )}
          <div className="stack">
            {question.choices.map((choice, i) => {
              let cls = "choice";
              if (picked !== null && i === question.answer) cls += " good";
              else if (picked === i) cls += " miss";
              return (
                <button key={`${choice}-${i}`} className={cls} type="button" lang={question.kind === "meaning" ? "en" : undefined} onClick={() => choose(i)}>
                  {choice}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <button className="btn block" type="button" onClick={() => { setPicked(null); setIndex((n) => n + 1); }}>
              下一題
            </button>
          )}
        </>
      )}
      <div className="row-btns">
        <button className="btn ghost" type="button" disabled>跟讀（下一輪）</button>
        <button className="btn ghost" type="button" disabled>填空（下一輪）</button>
      </div>
    </section>
  );
}
