import { useEffect, useRef, useState } from "react";
import { Mouth, mouthsFor } from "./components/Mouth";
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
import { useStore } from "./store";
import type { BuildOrder, Lesson, QuizItem } from "./types";

const BEATS = ["場景", "目標", "聽", "理解", "句式", "跟讀", "砌句", "角色", "小測", "發音", "溫習", "下一課"];

function tipFor(id: string): string {
  if (id === "F1") return "短音收得快，長音先拉。about 第一個音係好輕嘅 /ə/。";
  if (id === "F2" || id === "J1") return "thank 嘅 th 用舌尖貼上牙，唔好讀成 s 或者 f。";
  if (id === "J2") return "w 要圓唇，v 係上牙輕碰下唇。";
  if (id === "T1") return "sure、show 先係 /ʃ/。check-in 嘅 check 係 /tʃ/，前面有一粒塞音。";
  return "美式 /r/ 舌尖唔好掂到上顎。table 本身冇 /r/。";
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
  const [beat, setBeat] = useState(0);
  const [sub, setSub] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const enqueue = useStore((s) => s.enqueueLemmas);
  const complete = useStore((s) => s.completeLesson);
  const saved = useRef(false);

  useEffect(() => {
    stopAudio();
  }, [beat]);

  useEffect(() => {
    if (beat !== 10 || saved.current) return;
    saved.current = true;
    enqueue(lesson.lemmas);
    complete(lesson.id, 15 + quizScore * 3);
  }, [beat, complete, enqueue, lesson, quizScore]);

  const advance = () => {
    stopAudio();
    setSub(0);
    setBeat((b) => Math.min(BEATS.length - 1, b + 1));
  };

  return (
    <div className="lesson">
      <div className="hero">
        <img src={asset(lesson.hero)} alt="" />
      </div>
      <div className="lesson-top">
        <a href="#/">關閉</a>
        <div className="beats" aria-label={`進度 ${beat + 1} / ${BEATS.length}`}>
          {BEATS.map((label, i) => (
            <span key={label} className={i <= beat ? "on" : ""} />
          ))}
        </div>
        <span className="beat-name">{BEATS[beat]}</span>
      </div>
      <div className="sheet">
        {beat === 0 && <Hook lesson={lesson} onNext={advance} />}
        {beat === 1 && <Goal lesson={lesson} onNext={advance} />}
        {beat === 2 && <Hear lesson={lesson} onNext={advance} />}
        {beat === 3 && lesson.understand[sub] && (
          <Choices
            key={`u-${sub}`}
            prompt={lesson.understand[sub].prompt}
            choices={lesson.understand[sub].choices}
            answer={lesson.understand[sub].answer}
            explain={lesson.understand[sub].explain}
            nextLabel={sub + 1 < lesson.understand.length ? "下一題" : "去句式"}
            onNext={() => (sub + 1 < lesson.understand.length ? setSub(sub + 1) : advance())}
          />
        )}
        {beat === 4 && lesson.chunks[sub] && (
          <ChunkStep
            key={`c-${sub}`}
            pattern={lesson.chunks[sub].pattern}
            gloss={lesson.chunks[sub].glossYue}
            choices={lesson.chunks[sub].choices}
            answer={lesson.chunks[sub].answer}
            nextLabel={sub + 1 < lesson.chunks.length ? "下一句" : "去跟讀"}
            onNext={() => (sub + 1 < lesson.chunks.length ? setSub(sub + 1) : advance())}
          />
        )}
        {beat === 5 && <Shadow lesson={lesson} onNext={advance} />}
        {beat === 6 && <BuildStep lesson={lesson} sub={sub} setSub={setSub} onDone={advance} />}
        {beat === 7 && <RoleBeat lesson={lesson} sub={sub} setSub={setSub} onDone={advance} />}
        {beat === 8 && lesson.quiz[sub] && (
          <QuizStep
            item={lesson.quiz[sub]}
            index={sub}
            total={lesson.quiz.length}
            onScore={() => setQuizScore((n) => n + 1)}
            onNext={() => (sub + 1 < lesson.quiz.length ? setSub(sub + 1) : advance())}
          />
        )}
        {beat === 9 && <Sound lesson={lesson} onNext={advance} />}
        {beat === 10 && <Recap lesson={lesson} score={quizScore} onNext={advance} />}
        {beat === 11 && <NextBeat lesson={lesson} />}
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
          <img key={id} src={asset(`assets/art/refs/${id}.webp`)} alt={CAST_LABEL[id] || id} />
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
          <button key={line.id} className="choice" type="button" onClick={() => playAsset(path)}>
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
            <span className="gloss">{line.glossYue}</span>
          </button>
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
  nextLabel,
}: {
  prompt: string;
  choices: string[];
  answer: number;
  explain?: string;
  onResult?: (ok: boolean) => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  return (
    <>
      <h2>{prompt}</h2>
      <div className="stack">
        {choices.map((choice, i) => {
          let cls = "choice";
          if (done && i === answer) cls += " good";
          else if (done && picked === i && i !== answer) cls += " miss";
          else if (picked === i) cls += " picked";
          return (
            <button key={`${choice}-${i}`} className={cls} type="button" onClick={() => { if (!done) setPicked(i); }}>
              {choice}
            </button>
          );
        })}
      </div>
      {done && explain && <p className="note">{explain}</p>}
      {done && !explain && <p className="note">{picked === answer ? "啱。" : "記住呢個就得，唔使重來。"}</p>}
      {!done ? (
        <div className="stack">
          <button
            className="btn block"
            type="button"
            disabled={picked === null}
            onClick={() => {
              setDone(true);
              onResult?.(picked === answer);
            }}
          >
            對一對
          </button>
          <button className="btn ghost block" type="button" onClick={onNext}>跳過呢題</button>
        </div>
      ) : (
        <button className="btn block" type="button" onClick={onNext}>{nextLabel}</button>
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
  nextLabel,
}: {
  pattern: string;
  gloss: string;
  choices: string[];
  answer: string;
  onNext: () => void;
  nextLabel: string;
}) {
  const answerIndex = Math.max(0, choices.indexOf(answer));
  return (
    <Choices
      prompt={pattern}
      choices={choices}
      answer={answerIndex}
      explain={gloss}
      onNext={onNext}
      nextLabel={nextLabel}
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
      nextLabel={sub + 1 < lesson.build.length ? "下一題" : "去角色"}
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
      {done && <p className="note" lang="en">{ok ? "順序啱。" : item.answer.join(" ")}</p>}
      {!done ? (
        <div className="stack">
          <button
            className="btn block"
            type="button"
            disabled={built.length !== item.answer.length}
            onClick={() => setDone(true)}
          >
            對一對
          </button>
          <button className="btn ghost block" type="button" onClick={onNext}>跳過呢題</button>
        </div>
      ) : (
        <button className="btn block" type="button" onClick={onNext}>繼續</button>
      )}
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
      <p className="gloss">{line.glossYue}</p>
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
  const you = CAST_LABEL[lesson.roleplay.you] || "你";
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
        tip={`你而家係 ${you}。等對方講完先答，中途唔會插嘴。`}
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
  total,
  onScore,
  onNext,
}: {
  item: QuizItem;
  index: number;
  total: number;
  onScore: () => void;
  onNext: () => void;
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
        onResult={(ok) => { if (ok) onScore(); }}
        onNext={onNext}
        nextLabel={index + 1 < total ? "下一題" : "去發音"}
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

function Recap({ lesson, score, onNext }: { lesson: Lesson; score: number; onNext: () => void }) {
  const profile = useStore((s) => s.profile);
  return (
    <>
      <p className="who">放低今日</p>
      <h2>{lesson.canDoYue}</h2>
      <p className="lede">小測 {score} / {lesson.quiz.length}。答錯唔會扣任何嘢，生字已經排咗入重溫。</p>
      {profile && <p className="kicker">連續 {profile.streak} 日 · {profile.xp} XP</p>}
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
      <button className="btn block" type="button" onClick={onNext}>睇下一課</button>
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
        <p className="lede">呢輪六課你行完啦。到期嘅卡會喺重溫等你。</p>
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
  return (
    <div className="stack">
      <p className="who">你可以講</p>
      <p className="line" lang="en">{expect}</p>
      {mode === "speech" ? (
        <button className="btn teal block" type="button" onClick={startSpeech} disabled={listening}>
          {listening ? "聽緊你講…" : "開始講"}
        </button>
      ) : (
        <button className="btn teal block" type="button" onClick={() => void toggleRecord()}>
          {recording ? "停錄音" : "錄音，同模範比較"}
        </button>
      )}
      {mode === "speech" && (
        <button className="btn ghost block" type="button" onClick={() => setMode("record")}>
          改為錄音比較
        </button>
      )}
      {transcript && (
        <p className="fine" lang="en">
          聽到：{transcript}
          {keywords.length ? ` · 關鍵 ${hits.length}/${keywords.length}` : ""}
        </p>
      )}
      {userUrl && (
        <button className="btn quiet block" type="button" onClick={() => void new Audio(userUrl).play()}>
          播我嘅錄音
        </button>
      )}
      <div className="row-btns">
        <button className="btn quiet" type="button" onClick={() => playAsset(modelAudio)}>聽模範</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(modelSlow)}>慢速模範</button>
      </div>
      {micError && <p className="note">部機用唔到咪。你可以聽模範，然後繼續。呢課唔會卡住。</p>}
      <p className="fine">{tip}</p>
    </div>
  );
}
