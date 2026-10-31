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

function dueFirst(lemmas: string[], cards: Record<string, StoredCard>) {
  return [...lemmas].sort((a, b) => {
    const aDue = !cards[a] || isDue(cards[a]);
    const bDue = !cards[b] || isDue(cards[b]);
    if (aDue !== bDue) return aDue ? -1 : 1;
    return (cards[a]?.due || "").localeCompare(cards[b]?.due || "");
  });
}

function sessionCount(lemmas: string[], cards: Record<string, StoredCard>) {
  const due = lemmas.filter((id) => !cards[id] || isDue(cards[id])).length;
  const cap = Math.min(12, lemmas.length);
  const floor = Math.min(8, cap);
  if (due >= floor) return Math.min(cap, due);
  return floor;
}

function statsFor(lemmas: string[], cards: Record<string, StoredCard>) {
  let due = 0;
  let mastered = 0;
  for (const id of lemmas) {
    const card = cards[id];
    if (!card || isDue(card)) due += 1;
    if (card && card.reps > 0 && !isDue(card)) mastered += 1;
  }
  const percent = lemmas.length ? Math.round((mastered / lemmas.length) * 100) : 0;
  return { due, mastered, percent };
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

function storedDue(cards: Record<string, StoredCard>) {
  return Object.values(cards).filter((card) => isDue(card) && lexById[card.id]).length;
}

export function VocabHub() {
  const cards = useStore((s) => s.cards);
  const totalDue = storedDue(cards);
  return (
    <section className="screen stack">
      <div className="hub-hero">
        <img className="mascot" src={asset("assets/art/mascot-wave.webp")} alt="小燈" width={64} height={64} />
        <div>
          <h1 className="path-title">生字回顧</h1>
          <p className="lede">按情境溫常用字。記得同再嚟只係排期，唔會扣分。</p>
        </div>
      </div>
      <div className="due-cta">
        <div>
          <p className="due-n">{totalDue}</p>
          <p className="fine">今日到期要溫</p>
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
              <p className="fine">{deck.lemmas.length} 字 · 到期 {stats.due}</p>
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

function WordCard({ item, openMore }: { item: LexItem; openMore: boolean }) {
  const examples = item.examples?.length
    ? item.examples
    : [{ en: item.example, yue: item.exampleYue, audio: item.audio, audioSlow: item.audioSlow }];
  const shown = openMore ? examples : examples.slice(0, 2);
  const hasUsage = Boolean(item.register || item.usageNotes || item.collocations.length || item.pitfallsYue);
  return (
    <div className="stack">
      <p className="eyebrow">{learnerEyebrow(item)}</p>
      <h2 lang="en">{item.lemma}</h2>
      <p className="ipa">{item.ipa}</p>
      <div className="row-btns">
        <button className="btn" type="button" onClick={() => playAsset(item.audio)}>聽</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(item.audioSlow)}>慢速</button>
      </div>
      <p>{item.glossYue}</p>
      {hasUsage && (
        <details className="usage" open>
          <summary>用法</summary>
          {item.register && <p className="fine">場合：{item.register}</p>}
          {item.usageNotes && <p className="note">{item.usageNotes}</p>}
          {item.collocations.length > 0 && (
            <p className="fine" lang="en">搭配：{item.collocations.join(" · ")}</p>
          )}
          {item.pitfallsYue && <p className="note">{item.pitfallsYue}</p>}
        </details>
      )}
      {shown.map((example) => <ExampleRow key={example.en} example={example} />)}
      {openMore && item.related && item.related.length > 0 && (
        <p className="fine">
          相關：
          {item.related.map((id) => {
            const related = lexById[id];
            if (!related) return null;
            return (
              <a key={id} href={`#/word/${id}`} lang="en"> {related.lemma}</a>
            );
          })}
        </p>
      )}
      {openMore && item.miniDialogue?.map((turn) => (
        <p key={turn.en} className="lede">
          <span lang="en">{turn.en}</span>
          <span className="gloss"> {turn.yue}</span>
        </p>
      ))}
    </div>
  );
}

function ExampleRow({ example }: { example: { en: string; yue: string; audio: string; audioSlow: string } }) {
  return (
    <div className="stack">
      <p lang="en">{example.en}</p>
      <p className="gloss">{example.yue}</p>
      <div className="row-btns">
        <button className="btn quiet" type="button" onClick={() => playAsset(example.audio)}>聽例句</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(example.audioSlow)}>慢速</button>
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
    return deck ? dueFirst(deck.lemmas, cardsNow).slice(0, sessionCount(deck.lemmas, cardsNow)) : [];
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
    <section className="screen stack">
      <a className="back" href="#/vocab">返生字</a>
      <p className="eyebrow">{deck.titleYue}</p>
      <p className="kicker">{stats.percent}% · 到期 {stats.due}</p>
      {!item && <p className="note">今次 {session.length} 張溫完。到期嘅仍然會排喺前面。</p>}
      {item && (
        <>
          <p className="fine">{index + 1} / {session.length}</p>
          <WordCard item={item} openMore={more} />
          <button className="btn ghost block" type="button" onClick={() => setMore((open) => !open)}>
            {more ? "收起" : "更多"}
          </button>
          {markState === "good" && <p className="note">記住咗</p>}
          {markState === "again" && <p className="note">再排一次</p>}
          {markState ? (
            <button className="btn block" type="button" onClick={() => { setMarkState(null); setMore(false); setIndex((n) => n + 1); }}>下一張</button>
          ) : (
            <div className="row-btns">
              <button className="btn" type="button" onClick={() => mark(item.id, Rating.Good)}>記得</button>
              <button className="btn ghost" type="button" onClick={() => mark(item.id, Rating.Again)}>再嚟</button>
            </div>
          )}
        </>
      )}
      <a className="btn block" href={`#/vocab/${deck.id}/quiz`}>小測</a>
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
