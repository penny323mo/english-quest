import { useMemo, useState } from "react";
import { Rating, type Grade } from "ts-fsrs";
import {
  GOAL_LABEL,
  SHIPPED,
  asset,
  isLessonOpen,
  lessonById,
  lexById,
  lexicon,
  pathData,
} from "./data";
import { isDue } from "./fsrs";
import { playAsset } from "./media";
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

function GoalPick({ value, onChange }: { value: Goal; onChange: (g: Goal) => void }) {
  const options: { id: Goal; text: string }[] = [
    { id: "foundation", text: "氣息、長短音、打招呼" },
    { id: "jewellery", text: "明日櫃檯用得着" },
    { id: "travel", text: "機場櫃檯先" },
    { id: "restaurant", text: "入座、跟位" },
  ];
  return (
    <div className="stack">
      {options.map((opt) => (
        <button key={opt.id} className={value === opt.id ? "opt on" : "opt"} type="button" onClick={() => onChange(opt.id)}>
          <strong>{GOAL_LABEL[opt.id]}</strong>
          <span>{opt.text}</span>
        </button>
      ))}
    </div>
  );
}

export function PathHome() {
  const profile = useStore((s) => s.profile);
  const progress = useStore((s) => s.progress);
  if (!profile) return null;
  const recommended = SHIPPED.find((id) => isLessonOpen(id, profile.goal, progress) && !progress[id]);
  const done = SHIPPED.filter((id) => progress[id]).length;
  return (
    <section className="screen">
      <header className="mast">
        <div>
          <p className="eyebrow">今日 {profile.minutes} 分鐘</p>
          <h1>{profile.name}</h1>
        </div>
        <div className="stats">
          <span>{profile.streak > 0 ? `連續 ${profile.streak} 日` : "完成一課就記低今日"}</span>
          <span>{profile.xp} XP</span>
        </div>
      </header>
      <figure className="cover">
        <img src={asset("assets/art/cover.webp")} alt="夜海旁嘅珠寶店" />
        <figcaption>
          <p className="kicker">{GOAL_LABEL[profile.goal]}</p>
          <p>{done} / {SHIPPED.length} 課完成。冇紅心，錯過咗聽日再嚟就得。</p>
        </figcaption>
      </figure>
      {pathData.units.map((unit) => (
        <section key={unit.id} className="unit">
          <h2>{unit.title}</h2>
          <p className="lede">{unit.blurb}</p>
          <div className="card-list">
            {unit.lessons.map((entry) => {
              const lesson = lessonById[entry.id];
              const soon = Boolean(entry.soon) || !lesson;
              const open = !soon && isLessonOpen(entry.id, profile.goal, progress);
              const title = lesson?.titleYue || entry.title || entry.id;
              const en = lesson?.titleEn || "即將推出";
              const body = (
                <>
                  {lesson ? (
                    <img src={asset(lesson.hero)} alt="" loading="lazy" />
                  ) : (
                    <div className="thumb-fallback">鎖</div>
                  )}
                  <span>
                    <strong>{title}</strong>
                    <em lang="en">{en}</em>
                  </span>
                  {recommended === entry.id ? (
                    <span className="pill">今日</span>
                  ) : progress[entry.id] ? (
                    <span className="pill quiet">完成</span>
                  ) : soon ? (
                    <span className="meta">即將</span>
                  ) : open ? (
                    <span className="meta">{lesson?.minutes} 分</span>
                  ) : (
                    <span className="meta">未開</span>
                  )}
                </>
              );
              if (open && lesson) {
                return (
                  <a key={entry.id} className="lesson-row" href={`#/lesson/${lesson.id}`}>
                    {body}
                  </a>
                );
              }
              return (
                <div key={entry.id} className="lesson-row locked">
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}

export function Review() {
  const cards = useStore((s) => s.cards);
  const gradeCard = useStore((s) => s.gradeCard);
  const due = useMemo(
    () => Object.values(cards).filter((card) => isDue(card) && lexById[card.id]).sort((a, b) => a.due.localeCompare(b.due)),
    [cards],
  );
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const card = due[index];
  const item = card ? lexById[card.id] : undefined;
  const waiting = Object.keys(cards).length - due.length;

  function grade(rating: Grade) {
    if (!card) return;
    gradeCard(card.id, rating);
    setShow(false);
    setIndex(0);
  }

  return (
    <section className="screen stack">
      <p className="eyebrow">重溫</p>
      <h1>到期先再睇</h1>
      <p className="lede">用 FSRS 排期。再來、難、好、易都只係記住你幾熟，唔會罰你。</p>
      {!item && (
        <p className="note">
          {Object.keys(cards).length === 0
            ? "完成一課之後，生字會出現喺呢度。"
            : `而家冇到期嘅卡。${waiting > 0 ? `仲有 ${waiting} 張未到時間。` : ""}`}
        </p>
      )}
      {item && (
        <>
          <p className="fine">{index + 1} / {due.length}</p>
          <h2 lang="en">{item.lemma}</h2>
          <p className="ipa">{show ? item.ipa : " "}</p>
          <Syllables id={item.id} hidden={!show} />
          <div className="row-btns">
            <button className="btn quiet" type="button" onClick={() => playAsset(item.audio)}>聽</button>
            <button className="btn ghost" type="button" onClick={() => playAsset(item.audioSlow)}>慢速</button>
          </div>
          {show ? (
            <>
              <p>{item.glossYue}</p>
              <p className="lede" lang="en">{item.example}</p>
              <div className="grades">
                <button className="btn ghost" type="button" onClick={() => grade(Rating.Again)}>再來</button>
                <button className="btn ghost" type="button" onClick={() => grade(Rating.Hard)}>難</button>
                <button className="btn" type="button" onClick={() => grade(Rating.Good)}>好</button>
                <button className="btn teal" type="button" onClick={() => grade(Rating.Easy)}>易</button>
              </div>
            </>
          ) : (
            <button className="btn block" type="button" onClick={() => setShow(true)}>揭曉意思</button>
          )}
        </>
      )}
    </section>
  );
}

function Syllables({ id, hidden }: { id: string; hidden?: boolean }) {
  const item = lexById[id];
  if (!item || hidden) return null;
  return (
    <div className="syl" aria-label="音節">
      {item.syllables.map((syl, i) => (
        <b key={`${syl}-${i}`} className={i + 1 === item.stress ? "stress" : ""}>
          {syl}
          <span className="fine"> {item.syllableIpa[i]}</span>
        </b>
      ))}
    </div>
  );
}

export function Words() {
  const [q, setQ] = useState("");
  const items = lexicon.items.filter((item) => {
    const hay = `${item.lemma} ${item.glossYue} ${item.ipa} ${item.senseId}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  return (
    <section className="screen">
      <p className="eyebrow">詞庫</p>
      <h1>每個意思一張卡</h1>
      <input className="field" value={q} placeholder="搜尋英文、粵語、音標" onChange={(e) => setQ(e.target.value)} />
      <div className="card-list">
        {items.map((item) => (
          <a key={item.id} className="word-row" href={`#/word/${item.id}`}>
            <span>
              <strong lang="en">{item.lemma}</strong>
              <em className="fine"> {item.glossYue}</em>
            </span>
            <span className="ipa">{item.ipa}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function WordDetail({ id }: { id: string }) {
  const item = lexById[id];
  const jyutping = useStore((s) => s.profile?.jyutping);
  if (!item) {
    return (
      <section className="screen plain">
        <a className="back" href="#/words">返詞庫</a>
        <h1>冇呢張卡</h1>
      </section>
    );
  }
  return (
    <section className="screen plain stack">
      <a className="back" href="#/words">返詞庫</a>
      <p className="eyebrow">{item.pos} · {item.senseId}</p>
      <h1 lang="en">{item.lemma}</h1>
      <p className="ipa">{item.ipa}</p>
      <Syllables id={item.id} />
      <p>{item.glossYue}</p>
      {jyutping && item.jyutping ? <p className="fine">粵拼（只標中文解釋）：{item.jyutping}</p> : null}
      <p className="fine">{item.glossZh}</p>
      <p lang="en">{item.example}</p>
      <p className="gloss">{item.exampleYue}</p>
      <div className="row-btns">
        <button className="btn" type="button" onClick={() => playAsset(item.audio)}>聽例句</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(item.audioSlow)}>慢速</button>
      </div>
      {item.note && <p className="note">{item.note}</p>}
      {item.variants.length > 0 && <p className="fine">其他讀法：{item.variants.join("、")}</p>}
      {item.collocations.length > 0 && (
        <p className="fine" lang="en">搭配：{item.collocations.join(" · ")}</p>
      )}
      <p className="fine">{item.stress === 0 ? "弱讀，冇重音。" : `重音喺第 ${item.stress} 個音節。`}來源：{item.sources.join("、")}。核對 {item.verified_at}。</p>
    </section>
  );
}

export function Profile() {
  const profile = useStore((s) => s.profile);
  const progress = useStore((s) => s.progress);
  if (!profile) return null;
  const done = SHIPPED.filter((id) => progress[id]).length;
  return (
    <section className="screen stack">
      <p className="eyebrow">我</p>
      <h1>{profile.name}</h1>
      <p className="lede">{GOAL_LABEL[profile.goal]} · 每日 {profile.minutes} 分鐘</p>
      <p className="kicker">連續 {profile.streak} 日 · {profile.xp} XP · {done} / {SHIPPED.length} 課</p>
      <p className="note">連續日數只係記低你有嚟。斷咗就由 1 再數，唔會扣你已經攞到嘅 XP。</p>
      <a className="btn block" href="#/settings">設定</a>
      <a className="btn ghost block" href="#/attributions">出處同授權</a>
    </section>
  );
}

export function Settings() {
  const profile = useStore((s) => s.profile);
  const update = useStore((s) => s.updateProfile);
  const reset = useStore((s) => s.reset);
  const [armed, setArmed] = useState(false);
  if (!profile) return null;
  return (
    <section className="screen plain stack">
      <a className="back" href="#/profile">返我</a>
      <h1>設定</h1>
      <label className="stack">
        <span>名字</span>
        <input
          className="field"
          value={profile.name}
          maxLength={24}
          onChange={(e) => update({ name: e.target.value })}
          onBlur={() => { if (!profile.name.trim()) update({ name: "阿琳" }); }}
        />
      </label>
      <h2>目標</h2>
      <GoalPick value={profile.goal} onChange={(goal) => update({ goal })} />
      <h2>每日分鐘</h2>
      <div className="row-btns">
        {([10, 15, 20] as const).map((n) => (
          <button key={n} className={profile.minutes === n ? "btn" : "btn ghost"} type="button" onClick={() => update({ minutes: n })}>
            {n}
          </button>
        ))}
      </div>
      <label className="toggle">
        <span>中文解釋顯示粵拼</span>
        <input type="checkbox" checked={profile.jyutping} onChange={(e) => update({ jyutping: e.target.checked })} />
      </label>
      <p className="fine">粵拼只標中文，唔會用來教英文發音。</p>
      {!armed ? (
        <button className="btn ghost block" type="button" onClick={() => setArmed(true)}>清除呢部機嘅進度</button>
      ) : (
        <div className="stack">
          <p className="note">清除之後，名字、課進度同重溫卡都會冇。呢個操作唔可以還原。</p>
          <button className="btn block" type="button" onClick={() => { reset(); location.hash = "#/onboarding"; }}>確認清除</button>
          <button className="btn ghost block" type="button" onClick={() => setArmed(false)}>取消</button>
        </div>
      )}
    </section>
  );
}

export function Attributions() {
  const profile = useStore((s) => s.profile);
  return (
    <section className="screen plain prose">
      <a className="back" href={profile ? "#/profile" : "#/onboarding"}>返</a>
      <p className="eyebrow">Attributions</p>
      <h1>出處同授權</h1>
      <p>程式碼以 MIT 授權，版權 2026 Penny Lei。見倉庫 LICENSE。</p>
      <h2>詞庫</h2>
      <p>content/lexicon.json 係編纂作品，以 CC BY-SA 4.0 發佈，因為音標交叉核對用咗 Wiktionary（CC BY-SA）。粵語解釋係手寫，逐條睇過。</p>
      <p>CMUdict 0.7b，Carnegie Mellon University，BSD 式授權。美式音標由 ARPAbet 轉出，重音同音節有標。</p>
      <p>Wiktionary / Wikimedia，CC BY-SA。意見唔同嘅讀音寫喺 review/flags.json，有人為決定先至教。</p>
      <p>Free Dictionary API 只用來交叉核對，唔係教學音源。</p>
      <p>ECDICT（MIT）同 CC-CEDICT（CC BY-SA 4.0）係中文對照參考，冇批量拷貝入卡。CC-Canto（CC BY-SA 3.0）用嚟核對粵拼開關；粵拼唔會教英文音。</p>
      <p>New General Service List 只係頻率參考，未整份複製入程式。</p>
      <h2>聲音</h2>
      <p>教學錄音係 Piper（MIT）en_US-ljspeech-medium。LJ Speech 屬公有領域。音素由 espeak-ng 產生，並強制 en-us，異讀詞再人手鎖定音素。慢速係合成時嘅長度比例 1.35，短句檔案時長未必剛好係 1.35 倍，但會慢過正常速度。冇用 Edge、Azure 或者 Kokoro。</p>
      <p>瀏覽器嘅 Web Speech 只係臨時跟讀，唔係標準音。</p>
      <h2>複習同畫面</h2>
      <p>排期用 ts-fsrs（MIT）。</p>
      <p>畫面由 xAI Grok Imagine 生成，虛構人物 Mei、Tom、Ana、Kai。冇真實品牌標誌。色調係夜藍、金、湖綠、紙色。</p>
      <p className="fine">進度只放喺呢部機嘅 IndexedDB，冇帳號，冇分析。</p>
    </section>
  );
}
