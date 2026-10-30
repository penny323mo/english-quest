import { useEffect, useRef, useState } from "react";
import { Mouth, mouthsFor } from "./components/Mouth";
import { ArtImg, preloadArt } from "./art";
import { CAST_LABEL, asset, isLessonOpen, lessonById, lexById } from "./data";
import {
  absAsset,
  audioSnapshot,
  getRecognizer,
  keywordHits,
  playAsset,
  recorderMime,
  stopAudio,
  subscribeAudio,
} from "./media";
import { quizRecapLine } from "./persist.mjs";
import { playSfx } from "./sfx";
import { useStore } from "./store";
import type { BuildOrder, Lesson, QuizItem } from "./types";
import { BEAT_LABELS } from "./beats";

const BEATS = BEAT_LABELS;

function tipFor(id: string): string {
  if (id === "F1") return "短音收得快，長音先拉。about 第一個音係好輕嘅 /ə/。";
  if (id === "F2" || id === "J1") return "thank 嘅 th 用舌尖貼上牙，唔好讀成 s 或者 f。";
  if (id === "F3") return "five 尾音要收到 /v/，six 尾有 /ks/。唔好食咗尾音。";
  if (id === "F4") return "/l/ 舌尖抵上顎，氣由兩邊出。/n/ 氣由鼻出。";
  if (id === "J2") return "w 要圓唇，v 係上牙輕碰下唇。";
  if (id === "J3") return "this 尾係清 /s/，these 尾係有聲 /z/。pair 同 pearl 唔好撈。";
  if (id === "J4") return "authentic 中間係 /θ/。白金唔係鉑金。玉只講材料，唔好講醫療功效。";
  if (id === "J5") return "loose 開頭係 /l/，尾音 /s/。tight 係太緊，fit 係啱唔啱。";
  if (id === "J6") return "sale 尾音係 /l/。discount 名詞重音喺第一節。cost 讀 /ˈkɑst/。";
  if (id === "J7") return "contactless 有 /l/。receipt 重音喺第二節。wrap 開頭唔出聲。";
  if (id === "T1") return "sure、show 先係 /ʃ/。check-in 嘅 check 係 /tʃ/，前面有一粒塞音。";
  if (id === "T2") return "liquid、left、laptop 都有 /l/。straight 係 /eɪ/，唔好讀成 street。";
  if (id === "T3") return "floor 同 late 都有 /l/。wifi 讀 /waɪ faɪ/。password 第二節係 /ɝ/。";
  if (id === "R1") return "美式 /r/ 舌尖唔好掂到上顎。table 本身冇 /r/。";
  if (id === "R2") return "Can I 入面 can 好輕，讀 /kən/。can't 先至係 /kænt/，有個清楚嘅 /t/。";
  if (id === "R3") return "shellfish 有 /l/。allergic 重音喺中間。without 中間係清 /θ/。";
  return "跟住模範嘅口型，慢慢講。";
}

function roleTip(youId: string): string {
  const name = CAST_LABEL[youId];
  if (youId !== "ling" && name && name !== "你") {
    return `你扮 ${name}。等對方講完先答，中途唔會插嘴。`;
  }
  return "輪到你講。等對方講完先答，中途唔會插嘴。";
}

export function LessonView({ id }: { id: string }) {
  const lesson = lessonById[id];
  const profile = useStore((s) => s.profile);
  const progress = useStore((s) => s.progress);
  if (!lesson || !profile) {
    return (
      <section className="screen plain">
        <a className="back" href="#/">返路線</a>
        <h1>搵唔到呢課</h1>
        <p className="lede">路線上面未開放嘅課，唔會有連結。</p>
      </section>
    );
  }
  if (!isLessonOpen(lesson.id, profile.goal, progress)) {
    return (
      <section className="screen plain">
        <a className="back" href="#/">返路線</a>
        <h1>{lesson.titleYue}</h1>
        <p className="lede">先完成上一課，呢度就會開。如果你揀咗相關目標，該組第一課會提早開。</p>
        <a className="btn" href="#/">返路線</a>
      </section>
    );
  }
  return <Player key={lesson.id} lesson={lesson} />;
}

function Player({ lesson }: { lesson: Lesson }) {
  const cursor = useStore((s) => s.lessonCursor);
  const setLessonCursor = useStore((s) => s.setLessonCursor);
  const [start] = useState(() => {
    const state = useStore.getState();
    const savedCursor = state.lessonCursor;
    const match = Boolean(savedCursor && savedCursor.lessonId === lesson.id && !state.progress[lesson.id]);
    if (state.resumeArmed && match && savedCursor) {
      queueMicrotask(() => useStore.setState({ resumeArmed: false }));
      return {
        gate: "play" as const,
        beat: savedCursor.beat,
        sub: savedCursor.sub,
        quizScore: savedCursor.quizScore,
        quizAnswered: savedCursor.quizAnswered,
      };
    }
    if (state.resumeArmed) queueMicrotask(() => useStore.setState({ resumeArmed: false }));
    if (match) return { gate: "ask" as const, beat: 0, sub: 0, quizScore: 0, quizAnswered: 0 };
    return { gate: "play" as const, beat: 0, sub: 0, quizScore: 0, quizAnswered: 0 };
  });
  const [gate, setGate] = useState<"ask" | "play">(start.gate);
  const [beat, setBeat] = useState(start.beat);
  const [sub, setSub] = useState(start.sub);
  const [quizScore, setQuizScore] = useState(start.quizScore);
  const [quizAnswered, setQuizAnswered] = useState(start.quizAnswered);
  const enqueue = useStore((s) => s.enqueueLemmas);
  const complete = useStore((s) => s.completeLesson);
  const saved = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    preloadArt([
      asset(lesson.hero),
      ...lesson.cast.map((id) => asset(`assets/art/refs/${id}.webp`)),
    ]);
  }, [lesson]);

  useEffect(() => {
    stopAudio();
    sheetRef.current?.scrollTo(0, 0);
  }, [beat, sub]);

  useEffect(() => {
    if (gate !== "play") return;
    if (beat < 1 || beat > 9) return;
    setLessonCursor({
      lessonId: lesson.id,
      beat,
      sub,
      quizScore,
      quizAnswered,
    });
  }, [beat, gate, lesson.id, quizAnswered, quizScore, setLessonCursor, sub]);

  useEffect(() => {
    if (gate !== "play" || beat !== 10 || saved.current) return;
    saved.current = true;
    enqueue(lesson.lemmas);
    complete(lesson.id, 15 + quizScore * 3);
  }, [beat, complete, enqueue, gate, lesson, quizScore]);

  const advance = () => {
    stopAudio();
    setSub(0);
    setBeat((b) => Math.min(BEATS.length - 1, b + 1));
  };

  const shownBeat = gate === "ask" && cursor?.lessonId === lesson.id ? cursor.beat : beat;

  function resume() {
    if (!cursor || cursor.lessonId !== lesson.id) return;
    setBeat(cursor.beat);
    setSub(cursor.sub);
    setQuizScore(cursor.quizScore);
    setQuizAnswered(cursor.quizAnswered);
    setGate("play");
  }

  function restart() {
    setLessonCursor(null);
    setBeat(0);
    setSub(0);
    setQuizScore(0);
    setQuizAnswered(0);
    setGate("play");
  }

  const nxtForHero = lesson.next ? lessonById[lesson.next] : undefined;
  const heroPath = beat === 11 ? (nxtForHero?.hero || "") : lesson.hero;

  return (
    <div className="lesson">
      <div className={heroPath ? "hero" : "hero plain"} data-beat={beat}>
        {heroPath ? <ArtImg src={asset(heroPath)} alt="" width={900} height={1200} fill /> : null}
      </div>
      <div className="lesson-top">
        <a href="#/">關閉</a>
        <div className="beats" aria-label={`進度 ${shownBeat + 1} / ${BEATS.length}`}>
          {BEATS.map((label, i) => (
            <span key={label} className={i <= shownBeat ? "on" : ""} />
          ))}
        </div>
        <span className="beat-name">{BEATS[shownBeat]}</span>
      </div>
      <div className="sheet" data-beat={beat} ref={sheetRef}>
        {gate === "ask" && cursor?.lessonId === lesson.id ? (
          <>
            <p className="who">未完成</p>
            <h2>繼續呢課？</h2>
            <p className="lede">你上次停喺{BEATS[cursor.beat]}。</p>
            <button className="btn block" type="button" onClick={resume}>繼續</button>
            <button className="btn ghost block" type="button" onClick={restart}>重新開始</button>
          </>
        ) : null}
        {gate === "play" && beat === 0 && <Hook lesson={lesson} onNext={advance} />}
        {gate === "play" && beat === 1 && <Goal lesson={lesson} onNext={advance} />}
        {gate === "play" && beat === 2 && <Hear lesson={lesson} onNext={advance} />}
        {gate === "play" && beat === 3 && lesson.understand[sub] && (
          <Choices
            key={`u-${sub}`}
            prompt={lesson.understand[sub].prompt}
            choices={lesson.understand[sub].choices}
            answer={lesson.understand[sub].answer}
            explain={lesson.understand[sub].explain}
            onNext={() => (sub + 1 < lesson.understand.length ? setSub(sub + 1) : advance())}
          />
        )}
        {gate === "play" && beat === 4 && lesson.chunks[sub] && (
          <ChunkStep
            key={`c-${sub}`}
            pattern={lesson.chunks[sub].pattern}
            gloss={lesson.chunks[sub].glossYue}
            choices={lesson.chunks[sub].choices}
            answer={lesson.chunks[sub].answer}
            onNext={() => (sub + 1 < lesson.chunks.length ? setSub(sub + 1) : advance())}
          />
        )}
        {gate === "play" && beat === 5 && <Shadow lesson={lesson} onNext={advance} />}
        {gate === "play" && beat === 6 && <BuildStep lesson={lesson} sub={sub} setSub={setSub} onDone={advance} />}
        {gate === "play" && beat === 7 && <RoleBeat lesson={lesson} sub={sub} setSub={setSub} onDone={advance} />}
        {gate === "play" && beat === 8 && lesson.quiz[sub] && (
          <QuizStep
            item={lesson.quiz[sub]}
            index={sub}
            onScore={() => setQuizScore((n) => n + 1)}
            onAnswered={() => setQuizAnswered((n) => n + 1)}
            onSkip={() => (sub + 1 < lesson.quiz.length ? setSub(sub + 1) : advance())}
            onNext={() => (sub + 1 < lesson.quiz.length ? setSub(sub + 1) : advance())}
          />
        )}
        {gate === "play" && beat === 9 && <Sound lesson={lesson} onNext={advance} />}
        {gate === "play" && beat === 10 && <Recap lesson={lesson} score={quizScore} answered={quizAnswered} onNext={advance} />}
        {gate === "play" && beat === 11 && <NextBeat lesson={lesson} />}
      </div>
    </div>
  );
}

function Hook({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  return (
    <>
      <p className="who">{lesson.minutes} 分鐘 · {BEATS[0]}</p>
      <h2>{lesson.titleYue}</h2>
      <p className="kicker" lang="en">{lesson.titleEn}</p>
      <div className="cast">
        {lesson.cast.map((id) => (
          <ArtImg key={id} src={asset(`assets/art/refs/${id}.webp`)} alt={CAST_LABEL[id] || id} width={44} height={44} />
        ))}
      </div>
      <button className="btn block" type="button" onClick={onNext}>入去場景</button>
    </>
  );
}

function Goal({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  return (
    <>
      <p className="who">呢課之後你可以</p>
      <h2>{lesson.canDoYue}</h2>
      <p className="lede" lang="en">{lesson.canDoEn}</p>
      <button className="btn block" type="button" onClick={onNext}>去聽</button>
    </>
  );
}

function GlossLine({ text, hidden }: { text: string; hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;
  if (hidden && !open) {
    return (
      <button className="btn quiet gloss-reveal" type="button" onClick={() => setOpen(true)}>
        顯示中文
      </button>
    );
  }
  return <span className="gloss">{text}</span>;
}

function Hear({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  const [slow, setSlow] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => subscribeAudio(() => setTick((n) => n + 1)), []);
  const snap = audioSnapshot();
  return (
    <>
      <p className="who">聽完先。撳一句先會出聲。</p>
      <label className="toggle">
        <span>慢速</span>
        <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
      </label>
      {lesson.dialogue.map((line) => {
        const path = slow ? line.audioSlow : line.audio;
        const playing = snap.src === absAsset(path) && !snap.paused;
        const parts = line.text.split(/(\s+)/);
        const total = parts.filter((w) => w.trim()).length || 1;
        const idx = playing && snap.duration
          ? Math.min(total - 1, Math.floor((snap.time / snap.duration) * total))
          : -1;
        let seen = 0;
        return (
          <div key={line.id} className="choice hear-line">
            <button className="hear-play" type="button" onClick={() => playAsset(path)}>
              <span className="who">{line.speakerLabel}</span>
              <span className="line" lang="en">
                {parts.map((part, i) => {
                  if (!part.trim()) return <span key={`${line.id}-${i}`}>{part}</span>;
                  const mine = seen;
                  seen += 1;
                  return (
                    <span key={`${line.id}-${i}`} className={mine === idx ? "kword on" : "kword"}>
                      {part}
                    </span>
                  );
                })}
              </span>
            </button>
            <GlossLine text={line.glossYue} hidden={line.hideGloss} />
          </div>
        );
      })}
      <button className="btn block" type="button" onClick={onNext}>聽完，繼續</button>
    </>
  );
}

function Choices({
  prompt,
  choices,
  answer,
  explain,
  onResult,
  onNext,
  onSkip,
}: {
  prompt: string;
  choices: string[];
  answer: number;
  explain?: string;
  onResult?: (ok: boolean) => void;
  onNext: () => void;
  onSkip?: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const mark = prompt.includes("即係問緊咩？") ? "即係問緊咩？" : prompt.includes("呢句即係點？") ? "呢句即係點？" : "";
  const english = mark ? prompt.replace(mark, "").trim() : "";
  return (
    <>
      {mark ? (
        <div className="stem">
          <p className="stem-yue">{mark}</p>
          <h2 lang="en">{english}</h2>
        </div>
      ) : (
        <h2>{prompt}</h2>
      )}
      <div className="stack">
        {choices.map((choice, i) => {
          let cls = "choice";
          if (done && i === answer) cls += " good";
          else if (done && picked === i && i !== answer) cls += " miss";
          else if (picked === i) cls += " picked";
          return (
            <button
              key={`${choice}-${i}`}
              className={cls}
              type="button"
              onClick={() => {
                if (done) return;
                setPicked(i);
                setDone(true);
                onResult?.(i === answer);
                playSfx(i === answer ? "correct" : "wrong");
              }}
            >
              <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
              <span>{choice}</span>
            </button>
          );
        })}
      </div>
      {!done ? (
        <button className="btn ghost block" type="button" onClick={onSkip || onNext}>跳過呢題</button>
      ) : (
        <div className={`result-sheet ${picked === answer ? "good" : "miss"}`} role="status">
          <strong>{picked === answer ? "啱晒" : "差少少"}</strong>
          <p>{explain || (picked === answer ? "啱。" : "記住呢個就得，唔使重來。")}</p>
          <button className="btn block" type="button" onClick={onNext}>繼續</button>
        </div>
      )}
    </>
  );
}

function ChunkStep({
  pattern,
  gloss,
  choices,
  answer,
  onNext,
}: {
  pattern: string;
  gloss: string;
  choices: string[];
  answer: string;
  onNext: () => void;
}) {
  const answerIndex = Math.max(0, choices.indexOf(answer));
  return (
    <Choices
      prompt={pattern}
      choices={choices}
      answer={answerIndex}
      explain={gloss}
      onNext={onNext}
    />
  );
}

function BuildStep({
  lesson,
  sub,
  setSub,
  onDone,
}: {
  lesson: Lesson;
  sub: number;
  setSub: (n: number) => void;
  onDone: () => void;
}) {
  const item = lesson.build[sub];
  const next = () => (sub + 1 < lesson.build.length ? setSub(sub + 1) : onDone());
  if (!item) return null;
  if (item.type === "order") return <OrderBuild key={sub} item={item} onNext={next} />;
  return (
    <Choices
      key={sub}
      prompt={item.promptYue}
      choices={item.choices}
      answer={item.answer}
      explain={item.explain}
      onNext={next}
    />
  );
}

function OrderBuild({ item, onNext }: { item: BuildOrder; onNext: () => void }) {
  const [used, setUsed] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const built = used.map((i) => item.tokens[i] || "");
  const ok = built.join(" ") === item.answer.join(" ");
  return (
    <>
      <h2>{item.promptYue}</h2>
      <div className="built">
        {built.map((token, i) => (
          <button
            key={`${token}-${i}`}
            className="token"
            type="button"
            onClick={() => { if (!done) setUsed(used.filter((_, j) => j !== i)); }}
          >
            {token}
          </button>
        ))}
      </div>
      <div className="tokens">
        {item.tokens.map((token, i) => (
          used.includes(i) ? null : (
            <button key={i} className="token" type="button" disabled={done} onClick={() => setUsed([...used, i])}>
              {token}
            </button>
          )
        ))}
      </div>
      {done && (
        <div className={`result-sheet ${ok ? "good" : "miss"}`} role="status">
          <strong>{ok ? "啱晒" : "差少少"}</strong>
          <p lang="en">{ok ? "順序啱。" : item.answer.join(" ")}</p>
          <button className="btn block" type="button" onClick={onNext}>繼續</button>
        </div>
      )}
      {!done ? (
        <div className="stack">
          <button
            className="btn block"
            type="button"
            disabled={built.length !== item.answer.length}
            onClick={() => {
              setDone(true);
              playSfx(built.join(" ") === item.answer.join(" ") ? "correct" : "wrong");
            }}
          >
            對一對
          </button>
          <button className="btn ghost block" type="button" onClick={onNext}>跳過呢題</button>
        </div>
      ) : null}
    </>
  );
}

function Shadow({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  const line = lesson.dialogue.find((row) => row.id === lesson.shadow.lineId) || lesson.dialogue[0];
  const keywords = lesson.shadow.hint.split(/[^A-Za-z']+/).filter((w) => w.length > 3).slice(0, 4);
  return (
    <>
      <p className="who">跟住讀</p>
      <p className="line" lang="en">{line.text}</p>
      <GlossLine text={line.glossYue} hidden={line.hideGloss} />
      <div className="row-btns">
        <button className="btn quiet" type="button" onClick={() => playAsset(line.audio)}>聽</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(line.audioSlow)}>慢速</button>
      </div>
      <SpeakBox
        expect={lesson.shadow.hint}
        keywords={keywords}
        modelAudio={line.audio}
        modelSlow={line.audioSlow}
        tip={tipFor(lesson.id)}
      />
      <button className="btn block" type="button" onClick={onNext}>跟完，去砌句</button>
    </>
  );
}

function RoleBeat({
  lesson,
  sub,
  setSub,
  onDone,
}: {
  lesson: Lesson;
  sub: number;
  setSub: (n: number) => void;
  onDone: () => void;
}) {
  const turn = lesson.roleplay.turns[sub];
  if (!turn) return null;
  return (
    <>
      <p className="fine">{lesson.roleplay.intro}</p>
      <p className="who">{turn.partner} · {sub + 1} / 3</p>
      <p className="line" lang="en">{turn.line}</p>
      <div className="row-btns">
        <button className="btn quiet" type="button" onClick={() => playAsset(turn.audio)}>聽 {turn.partner}</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(turn.audioSlow)}>慢速</button>
      </div>
      <SpeakBox
        key={sub}
        expect={turn.expect}
        keywords={turn.keywords}
        modelAudio={turn.modelAudio}
        modelSlow={turn.modelSlow}
        tip={roleTip(lesson.roleplay.you)}
      />
      <button
        className="btn block"
        type="button"
        onClick={() => {
          stopAudio();
          if (sub < lesson.roleplay.turns.length - 1) setSub(sub + 1);
          else onDone();
        }}
      >
        {sub < lesson.roleplay.turns.length - 1 ? "下一句" : "去小測"}
      </button>
    </>
  );
}

function QuizStep({
  item,
  index,
  onScore,
  onAnswered,
  onNext,
  onSkip,
}: {
  item: QuizItem;
  index: number;
  onScore: () => void;
  onAnswered: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const lemma = item.lemma ? lexById[item.lemma] : undefined;
  return (
    <>
      {item.type === "listen" && lemma && (
        <button className="btn quiet block" type="button" onClick={() => playAsset(lemma.audio)}>
          播放 {lemma.lemma}
        </button>
      )}
      <Choices
        key={index}
        prompt={item.prompt}
        choices={item.choices}
        answer={item.answer}
        explain={item.explain}
        onResult={(ok) => {
          onAnswered();
          if (ok) onScore();
        }}
        onSkip={onSkip}
        onNext={onNext}
      />
    </>
  );
}

function Sound({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  return (
    <>
      <p className="ipa">{lesson.sound.ipa}</p>
      <h2>{lesson.sound.title}</h2>
      <div className="mouths">
        {mouthsFor(lesson.sound.ipa).map((kind) => (
          <Mouth key={kind} kind={kind} />
        ))}
      </div>
      <p className="note">{lesson.sound.note}</p>
      {lesson.sound.pairs.map((pair) => {
        const a = lexById[pair.a];
        const b = lexById[pair.b];
        if (!a || !b) return null;
        return (
          <div className="pair" key={`${pair.a}-${pair.b}`}>
            <button className="choice" type="button" onClick={() => playAsset(a.audio)}>
              <span lang="en">{a.lemma}</span>
              <span className="ipa">{a.ipa}</span>
            </button>
            <button className="choice" type="button" onClick={() => playAsset(b.audio)}>
              <span lang="en">{b.lemma}</span>
              <span className="ipa">{b.ipa}</span>
            </button>
          </div>
        );
      })}
      <div className="tokens">
        {lesson.sound.drill.map((id) => {
          const item = lexById[id];
          if (!item) return null;
          return (
            <button key={id} className="token" type="button" onClick={() => playAsset(item.audioSlow)} lang="en">
              {item.lemma}
            </button>
          );
        })}
      </div>
      <button className="btn block" type="button" onClick={onNext}>去溫習</button>
    </>
  );
}

function Recap({ lesson, score, answered, onNext }: { lesson: Lesson; score: number; answered: number; onNext: () => void }) {
  const profile = useStore((s) => s.profile);
  useEffect(() => {
    playSfx("complete");
  }, []);
  const tally = quizRecapLine(score, lesson.quiz.length, answered);
  return (
    <>
      <div className="confetti" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
      <img className="mascot cheer" src={asset("assets/art/mascot-cheer.webp")} alt="小燈" width={96} height={96} />
      <p className="who">搞掂</p>
      <h2>{lesson.canDoYue}</h2>
      <p className="lede">{tally}。答錯唔會扣任何嘢，生字已經排咗入練習。</p>
      <div className="pills recap-pills">
        <span className="pill">{tally}</span>
        {profile && <span className="pill">{profile.xp} XP</span>}
        {profile && <span className="pill">連續 {profile.streak} 日</span>}
      </div>
      <div className="card-list">
        {lesson.lemmas.slice(0, 6).map((id) => {
          const item = lexById[id];
          if (!item) return null;
          return (
            <a key={id} className="word-row" href={`#/word/${id}`}>
              <span lang="en">{item.lemma}</span>
              <span className="ipa">{item.ipa}</span>
            </a>
          );
        })}
      </div>
      <button className="btn block" type="button" onClick={onNext}>下一課</button>
    </>
  );
}

function NextBeat({ lesson }: { lesson: Lesson }) {
  const profile = useStore((s) => s.profile);
  const progress = useStore((s) => s.progress);
  const nxt = lesson.next ? lessonById[lesson.next] : undefined;
  if (!nxt || !profile) {
    return (
      <>
        <h2>今晚就到呢度</h2>
        <p className="lede">呢輪五十一課你行完啦。到期嘅卡會喺練習等你。</p>
        <a className="btn block" href="#/">返路線</a>
      </>
    );
  }
  const open = isLessonOpen(nxt.id, profile.goal, progress);
  return (
    <>
      <p className="who">下一課</p>
      <h2>{nxt.titleYue}</h2>
      <p className="lede">{nxt.canDoYue}</p>
      {open ? (
        <a className="btn block" href={`#/lesson/${nxt.id}`}>開始</a>
      ) : (
        <p className="note">下一課未開。返路線就見到鎖。</p>
      )}
      <a className="btn ghost block" href="#/">返路線</a>
    </>
  );
}

function SpeakBox({
  expect,
  keywords,
  modelAudio,
  modelSlow,
  tip,
}: {
  expect: string;
  keywords: string[];
  modelAudio: string;
  modelSlow: string;
  tip: string;
}) {
  const [mode, setMode] = useState<"speech" | "record">(() => (getRecognizer() ? "speech" : "record"));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [userUrl, setUserUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const speechRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => {
      try { speechRef.current?.stop(); } catch { /* already stopped */ }
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      if (userUrl) URL.revokeObjectURL(userUrl);
    };
  }, [userUrl]);

  function stopSpeech() {
    try { speechRef.current?.stop(); } catch { /* already stopped */ }
    speechRef.current = null;
    setListening(false);
  }

  function stopRecord() {
    if (recording && recorderRef.current) recorderRef.current.stop();
    setRecording(false);
  }

  function startSpeech() {
    const Ctor = getRecognizer();
    if (!Ctor) {
      setMode("record");
      return;
    }
    try {
      const rec = new Ctor();
      speechRef.current = rec;
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (ev) => {
        const result = ev as unknown as { results: ArrayLike<{ 0: { transcript: string } }> };
        let text = "";
        for (let i = 0; i < result.results.length; i += 1) text += `${result.results[i][0].transcript} `;
        setTranscript(text.trim());
      };
      rec.onerror = () => {
        setListening(false);
        setMode("record");
      };
      rec.onend = () => setListening(false);
      rec.start();
      setListening(true);
    } catch {
      setMode("record");
    }
  }

  async function toggleRecord() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    setMicError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = recorderMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/mp4" });
        setUserUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setMicError(true);
    }
  }

  const hits = keywordHits(transcript, keywords);
  const canSpeak = Boolean(getRecognizer());
  return (
    <div className="stack">
      <p className="who">你可以講</p>
      <p className="line" lang="en">{expect}</p>
      {mode === "record" && (
        <p className="note">錄一次就得。撳「聽我」，再撳「聽模範」，輪流聽。部機唔使識即時辨認。</p>
      )}
      {mode === "speech" ? (
        <button className="btn teal block" type="button" onClick={startSpeech} disabled={listening}>
          {listening ? "聽緊你講…" : "開始講"}
        </button>
      ) : (
        <button className="btn teal block" type="button" onClick={() => void toggleRecord()}>
          {recording ? "停錄音" : "錄音，同模範比較"}
        </button>
      )}
      {recording && (
        <div className="wave" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
      )}
      {mode === "speech" ? (
        <button className="btn ghost block" type="button" onClick={() => { stopSpeech(); setMode("record"); }}>
          改為錄音比較
        </button>
      ) : canSpeak ? (
        <button className="btn ghost block" type="button" onClick={() => { stopRecord(); setMode("speech"); }}>
          改為即時講
        </button>
      ) : null}
      {transcript && (
        <p className="fine" lang="en">
          聽到：{transcript}
          {keywords.length ? ` · 關鍵 ${hits.length}/${keywords.length}` : ""}
        </p>
      )}
      <div className="row-btns">
        {userUrl && (
          <button className="btn quiet" type="button" onClick={() => void new Audio(userUrl).play()}>聽我</button>
        )}
        <button className="btn quiet" type="button" onClick={() => playAsset(modelAudio)}>聽模範</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(modelSlow)}>慢速模範</button>
      </div>
      {micError && <p className="note">咪未開。你可以聽模範，然後繼續。呢課唔會卡住。</p>}
      <p className="fine">{tip}</p>
    </div>
  );
}
