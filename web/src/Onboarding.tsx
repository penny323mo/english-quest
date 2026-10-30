import { useState } from "react";
import { GoalPick } from "./goals";
import { blankProfile, useStore } from "./store";
import type { Goal, Level } from "./types";

export function Onboarding() {
  const existing = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(existing?.name || "");
  const [goal, setGoal] = useState<Goal>(existing?.goal || "jewellery");
  const [minutes, setMinutes] = useState<10 | 15 | 20>(existing?.minutes || 15);
  const [level, setLevel] = useState<Level>(existing?.level || "new");

  function finish() {
    if (existing) {
      useStore.getState().updateProfile({ name: name.trim() || "阿琳", goal, minutes, level });
    } else {
      setProfile(blankProfile({ name, goal, minutes, level }));
    }
    location.hash = "#/";
  }

  return (
    <section className="screen plain stack">
      <p className="eyebrow">English Quest</p>
      <h1>情景英文</h1>
      {step === 0 && (
        <>
          <p className="lede">你部機上記低個名就得。進度唔會上傳。</p>
          <label className="stack">
            <span>點稱呼你？</span>
            <input className="field" value={name} placeholder="阿琳" maxLength={24} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="btn block" type="button" onClick={() => setStep(1)}>下一步</button>
        </>
      )}
      {step === 1 && (
        <>
          <h2>你想先練邊樣？</h2>
          <GoalPick value={goal} onChange={setGoal} />
          <button className="btn block" type="button" onClick={() => setStep(2)}>下一步</button>
        </>
      )}
      {step === 2 && (
        <>
          <h2>每日幾多分鐘？</h2>
          <div className="stack">
            {([10, 15, 20] as const).map((n) => (
              <button key={n} className={minutes === n ? "opt on" : "opt"} type="button" onClick={() => setMinutes(n)}>
                <strong>{n} 分鐘</strong>
                <span>{n === 15 ? "啱阿琳返工前後" : n === 10 ? "赶時間都得" : "想練耐少少"}</span>
              </button>
            ))}
          </div>
          <button className="btn block" type="button" onClick={() => setStep(3)}>下一步</button>
        </>
      )}
      {step === 3 && (
        <>
          <h2>而家英文幾熟？</h2>
          <div className="stack">
            <button className={level === "new" ? "opt on" : "opt"} type="button" onClick={() => setLevel("new")}>
              <strong>識得 hello、thank you</strong>
              <span>想開口又怕被人笑</span>
            </button>
            <button className={level === "some" ? "opt on" : "opt"} type="button" onClick={() => setLevel("some")}>
              <strong>聽得多，講得少</strong>
              <span>句子識，音未穩</span>
            </button>
            <button className={level === "work" ? "opt on" : "opt"} type="button" onClick={() => setLevel("work")}>
              <strong>返工有用過</strong>
              <span>想講得更穩、更有禮</span>
            </button>
          </div>
          <button className="btn block" type="button" onClick={finish}>開始</button>
        </>
      )}
      <a className="back" href="#/attributions">出處同授權</a>
    </section>
  );
}
