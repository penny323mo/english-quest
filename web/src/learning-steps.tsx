import { createMic } from "./recorder.mjs";
import { useEffect, useRef, useState } from "react";
import { lessonById, lexById } from "./data";
import { playAsset, playUrl, recorderMime, stopAudio } from "./media";
import { useStore } from "./store";
import { wordAudio } from "./word-audio";

const starter: Record<string, string[]> = {
  F1: ["ship-noun", "sheep-noun"],
  F2: ["good-morning-phrase", "thank-you-phrase", "hello-intj"],
  F3: ["three-num", "five-num", "ten-num"],
};

export function StarterListening({ id }: { id: string }) {
  const items = starter[id];
  const [target, setTarget] = useState("");
  const [picked, setPicked] = useState("");
  const [mode, setMode] = useState<"listen" | "read">("listen");
  const scores = useStore(s => s.profile?.starterScores?.[id]);
  const record = useStore(s => s.recordStarter);
  if (!items) return null;
  function tryAnother(nextMode: "listen" | "read") {
    setMode(nextMode);
    const choices = items.filter(word => word !== target);
    const next = choices[Math.floor(Math.random() * choices.length)];
    setTarget(next);
    setPicked("");
    stopAudio();
    if (nextMode === "listen") playAsset(wordAudio[next].audio);
  }
  return <section className="stack" aria-label="起步聆聽">
    <h3>先聽呢{items.length === 2 ? "兩" : "三"}個詞</h3>
    <div className="row-btns">{items.map(word => <button key={word} className="btn quiet" type="button" onClick={() => playAsset(wordAudio[word].audio)}>
      <span lang="en">{lexById[word].lemma}</span> · {lexById[word].glossYue}
    </button>)}</div>
    {id === "F2" && <button type="button" className="btn quiet" onClick={() => playAsset("assets/audio/lines/f2-repeat.mp3")}>聽唔清可以講 · Could you say that again, please?</button>}
    {(!target || target === picked) && <div className="row-btns">
      <button className="btn ghost" type="button" onClick={() => tryAnother("listen")}>{target ? "再試另一個" : "只聽聲揀意思"}</button>
      <button className="btn quiet" type="button" onClick={() => tryAnother("read")}>只睇字揀意思</button>
    </div>}
    {target && target !== picked && <>
      {mode === "listen" ? <div className="row-btns">
        <button className="btn quiet" type="button" onClick={() => playAsset(wordAudio[target].audio)}>再聽一次</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(wordAudio[target].audioSlow)}>慢速重播</button>
      </div> : <p lang="en">{lexById[target].lemma}</p>}
      <p>{mode === "listen" ? "你聽到邊個意思？" : "呢個字係咩意思？"}</p>
      <div className="row-btns">{items.map(word => <button key={word} className="choice" type="button" onClick={() => { if (!picked) record(id, mode, word === target); setPicked(word); }}>{lexById[word].glossYue}</button>)}</div>
    </>}
    {scores && <p className="fine">第一次揀啱 · 聽聲 {scores.listen[0]} / {scores.listen[1]} · 認字 {scores.read[0]} / {scores.read[1]}</p>}
    {picked && <p role="status">{picked === target ? "聽啱咗。" : "再聽一次，再揀過。"}</p>}
  </section>;
}

// Each follow-up changes a fact after the learner's first response.
const transfer: Record<string, [string, string, string]> = {
  F1: ["你想講「船」。先自己講一次，再對住示範聽個元音。", "而家改講「羊」。", "ship 嘅舌位較低，sheep 嘅舌位較高。"],
  F2: ["朝早第一次見新同事。打個招呼，介紹自己。", "對方講個名講得太快。開口請佢再講一次。", "有回應招呼、講自己個名，同埋提出清楚要求。"],
  F3: ["朋友問你幾點見面。約佢四點。", "對方話四點唔得。改約五點，再確認一次。", "用到兩個唔同嘅時間，對方知道最後約幾點。"],
  T1: ["你準備去東京。喺櫃檯講目的地，要求靠窗位。", "靠窗位已經坐滿。問有冇走廊位。", "講到目的地、首選同另一個可以接受嘅選擇。"],
  R3: ["你對花生敏感。點菜前講清楚，請職員核對材料。", "職員話未肯定。請佢問廚房，再介紹一個選擇。", "清楚講出敏感原，等職員確認之後先決定。"],
  W1: ["你替同事接電話。對方想改聽日嘅約。請佢留低姓名同回電方法。", "個電話號碼有一個數字聽唔清。問清楚，再讀返畀佢確認。", "有問回電資料、要求重複同核對。"],
  D9: ["櫃員機收咗你張卡。講事發經過，要求銀行先停卡。", "新卡要下星期先到。解釋你今日要現金，追問櫃面有咩辦法。", "講到問題、即時要求同原因，再向職員確認做法。"],
  T21: ["你得四十分鐘轉機，帶住一件手提行李，另外寄艙一件。向職員講清限制，問下一步。", "職員話大袋未必趕得切。比較改搭下一班同先追查行李，解釋你揀邊個。", "有覆述時間限制、問清兩個選擇、講理由同確認安排。"],
  J11: ["客人想十日內收到訂製戒指。先問預算同最重要嘅設計要求。", "工場話訂製要三星期。提供現貨同延期兩個方案，問客人邊樣可以讓步。", "有釐清需要、講出取捨、回應疑慮同確認下一步。"],
  W6: ["面試官想聽一次你處理客人投訴嘅經歷。講情況、做法同結果。", "佢追問，如果當時只得你一個人，你會改邊一步？解釋理由。", "有具體例子，識用假設情況解釋另一個可行做法。"],
  T9: ["班機取消咗。你聽朝有個重要約會。向職員查詢今晚改飛同退款。", "今晚嗰班要轉機，直航就聽日先有。比較兩者，再確認你要嘅安排。", "講到時間限制、兩個方案各自嘅影響，同最後要求。"],
  J13: ["你要訂五十份公司禮品，下星期五要交貨。問數量折扣同刻字時間。", "供應商話只夠時間刻二十份。提出分批交貨或者更改設計，再要求書面確認。", "有講期限、回應新限制、提出可行方案同確認交付條款。"],
};

const revisit: Record<string, [string, string, string]> = {
  F1: ["同朋友講你想要一個座位：seat。", "而家請朋友坐低，用 sit。兩個元音有咩分別？", "seat 個舌位較高，sit 個舌位稍低、嘴唇比較放鬆。"],
  F2: ["夜晚去到酒店，向接待員打個招呼，介紹自己。", "接待員聽唔清你個名。試吓慢慢講多一次。", "招呼適合時間，能夠講自己個名，同埋喺對方聽唔清時重複。"],
  F3: ["同事想知早餐幾錢。話畀佢知要八蚊。", "佢再問餐廳幾點開門。答佢七點。", "兩次都答啱問題，價錢用 dollars，鐘點用 o’clock。"],
};

export function PracticeAgain() {
  const progress = useStore(s => s.progress);
  const ids = Object.keys(transfer).filter(id => progress[id]);
  const [choice, setChoice] = useState("");
  if (!ids.length) return null;
  return <section className="stack">
    <label className="stack">重練已完成課堂嘅口語任務
      <select className="field" value={choice} onChange={event => setChoice(event.target.value)}>
        <option value="">揀一課</option>
        {ids.map(id => <option key={id} value={id}>{id} · {lessonById[id].titleYue}</option>)}
      </select>
    </label>
    {choice && <TransferPractice key={choice} id={choice} repeat />}
  </section>;
}

function OralRecording() {
  const [state, setState] = useState("idle");
  const [take, setTake] = useState("");
  const mic = useRef<ReturnType<typeof createMic>>();
  useEffect(() => {
    const recorder = createMic({
      getStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      makeRecorder: stream => {
        const mime = recorderMime();
        return mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      },
      onStart: () => setState("recording"),
      onTake: blob => { setTake(URL.createObjectURL(blob)); setState("idle"); },
      onError: () => setState("failed"),
    });
    mic.current = recorder;
    return () => recorder.dispose();
  }, []);
  useEffect(() => () => { if (take) URL.revokeObjectURL(take); }, [take]);
  return <div className="stack">
    <div className="row-btns">
      <button type="button" className="btn quiet" disabled={state === "pending"} onClick={() => {
        if (state === "recording") { mic.current?.stop(); return; }
        stopAudio();
        setState("pending");
        void mic.current?.start();
      }}>{state === "recording" ? "停止錄音" : state === "pending" ? "等緊咪高峰" : "錄低自己嘅回答"}</button>
      {take && <button type="button" className="btn quiet" onClick={() => playUrl(take)}>重聽自己嘅回答</button>}
    </div>
    {state === "failed" && <p role="status">開唔到咪高峰。可以直接講，再用下面嘅準則自評。</p>}
  </div>;
}

export function TransferPractice({ id, repeat = false }: { id: string; repeat?: boolean }) {
  const task = repeat && revisit[id] ? revisit[id] : transfer[id];
  const challenge = lessonById[id]?.challenge;
  const days = useStore(s => s.progress[id]?.transferDays);
  const previous = useStore(s => s.progress[id]?.transfer);
  const save = useStore(s => s.assessTransfer);
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState(false);
  if (!task) return null;
  return <section className="stack" aria-label="換個情境自己講">
    <h3>換個情境自己講</h3>
    <p>{task[0]}</p>
    {id === "F2" && <div className="row-btns">
      <button className="btn quiet" onClick={() => playAsset("assets/audio/lines/f2-new-name.mp3")}>聽另一位同事自我介紹，然後答佢</button>
      <button className="btn quiet" onClick={() => playAsset("assets/audio/lines/f2-new-name-slow.mp3")}>慢速聽介紹</button>
    </div>}
    {challenge && <OralRecording />}
    {step >= 1 && (challenge ? <>
      <p>聽對方追加嘅要求，再用英文答。</p>
      <div className="row-btns">
        <button type="button" className="btn quiet" onClick={() => playAsset(challenge.audio)}>重聽要求</button>
        <button type="button" className="btn ghost" onClick={() => playAsset(challenge.audioSlow)}>慢速聽要求</button>
      </div>
      {hint && <><p lang="en">{challenge.text}</p><p>{challenge.glossYue}</p></>}
    </> : <p>{task[1]}</p>)}
    {step < 2 && <button className="btn ghost" type="button" onClick={() => {
      stopAudio();
      if (step === 0 && challenge) playAsset(challenge.audio);
      setStep(step + 1);
    }}>{step ? "講完，核對表達" : challenge ? "講完，聽下一個要求" : "講完，睇下一個要求"}</button>}
    {step === 2 && <>
      <p>{task[2]}</p>
      {challenge && <ul><li>傳意：有冇講清選擇同原因？</li><li>清晰度：對方聽唔聽得出關鍵詞同數字？</li><li>互動：有冇回應新要求，再確認下一步？</li></ul>}
      <div className="row-btns">
        <button type="button" className="btn ghost" onClick={() => save(id, "practice")}>仲想練</button>
        <button type="button" className="btn quiet" onClick={() => save(id, hint ? "guided" : "independent")}>{hint ? "用提示做到" : "自己做到"}</button>
      </div>
    </>}
    {step < 2 && !hint && <button type="button" className="btn quiet" onClick={() => setHint(true)}>睇表達提示</button>}
    {hint && step < 2 && <p>{task[2]}</p>}
    {id === "F1" && hint && <div className="row-btns">{(repeat ? ["seat-noun", "sit-verb"] : starter.F1).map(word =>
      <button type="button" key={word} className="btn quiet" onClick={() => playAsset(wordAudio[word].audio)}>聽 {lexById[word].lemma}</button>
    )}</div>}
    {repeat && days && <ul aria-label="按日口語自評">{Object.entries(days).sort().map(([day, rating]) =>
      <li key={day}>{day} · {{ practice: "仲想練", guided: "用提示做到", independent: "自己做到" }[rating]}</li>)}</ul>}
    {previous && <p className="fine" role="status">上次自評 · {{ practice: "仲想練", guided: "用提示做到", independent: "自己做到" }[previous]}</p>}
  </section>;
}
