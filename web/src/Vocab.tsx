import { useEffect, useMemo, useState } from "react";
import { Rating, type Grade } from "ts-fsrs";
import { decks, lexById } from "./data";
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

export function VocabHub() {
  const cards = useStore((s) => s.cards);
  return (
    <section className="screen stack">
      <a className="back" href="#/">返路線</a>
      <p className="eyebrow">生字</p>
      <h1>生字回顧</h1>
      <p className="lede">到期嘅先溫。記得同再嚟只係排期，唔會扣分，亦冇紅心。</p>
      {decks.decks.map((deck) => {
        const stats = statsFor(deck.lemmas, cards);
        return (
          <a key={deck.id} className="lesson-row" href={`#/vocab/${deck.id}`}>
            <span className="orb-fallback">{deck.level}</span>
            <span>
              <strong>{deck.titleYue}</strong>
              <em>{stats.percent}% · 到期 {stats.due}</em>
            </span>
            <span className="meta">生字</span>
          </a>
        );
      })}
      {decks.decks.length === 0 && <p className="note">未有呢疊生字。</p>}
    </section>
  );
}

function WordCard({ item, openMore }: { item: LexItem; openMore: boolean }) {
  const examples = item.examples?.length
    ? item.examples
    : [{ en: item.example, yue: item.exampleYue, audio: item.audio, audioSlow: item.audioSlow }];
  const rest = openMore ? examples.slice(1) : [];
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
      {item.register && <p className="fine">場合：{item.register}</p>}
      {item.usageNotes && <p className="note">{item.usageNotes}</p>}
      {item.collocations.length > 0 && (
        <p className="fine" lang="en">搭配：{item.collocations.join(" · ")}</p>
      )}
      {item.pitfallsYue && <p className="note">{item.pitfallsYue}</p>}
      <ExampleRow example={examples[0]} />
      {openMore && rest.map((example) => <ExampleRow key={example.en} example={example} />)}
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
  const [session] = useState(() => (deck ? dueFirst(deck.lemmas, useStore.getState().cards).slice(0, 8) : []));
  const [index, setIndex] = useState(0);
  const [more, setMore] = useState(false);
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
    enqueue([id]);
    gradeCard(id, rating);
    playSfx(rating === Rating.Good ? "xp" : "streak");
    setMore(false);
    setIndex((n) => n + 1);
  }

  return (
    <section className="screen stack">
      <a className="back" href="#/vocab">返生字</a>
      <p className="eyebrow">{deck.titleYue}</p>
      <p className="kicker">{stats.percent}% · 到期 {stats.due}</p>
      {!item && <p className="note">今次八張溫完。到期嘅仍然會排喺前面。</p>}
      {item && (
        <>
          <p className="fine">{index + 1} / {session.length}</p>
          <WordCard item={item} openMore={more} />
          <button className="btn ghost block" type="button" onClick={() => setMore((open) => !open)}>
            {more ? "收起" : "更多"}
          </button>
          <div className="row-btns">
            <button className="btn" type="button" onClick={() => mark(item.id, Rating.Good)}>記得</button>
            <button className="btn ghost" type="button" onClick={() => mark(item.id, Rating.Again)}>再嚟</button>
          </div>
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
