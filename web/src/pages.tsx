import { useMemo, useRef, useState } from "react";
import { Rating, type Grade } from "ts-fsrs";
import {
  SHIPPED,
  asset,
  go,
  isLessonOpen,
  lessonById,
  lexById,
  lexicon,
  pathData,
} from "./data";
import { BEAT_LABELS } from "./beats";
import { GOAL_LABEL, GoalPick } from "./goals";
import { isDue } from "./fsrs";
import { learnerEyebrow } from "./labels";
import { playAsset } from "./media";
import { playSfx } from "./sfx";
import { useStore } from "./store";

function cefrClass(cefr: string): string {
  if (cefr.includes("B2")) return "b2";
  if (cefr.includes("B1")) return "b1";
  if (cefr.includes("A2")) return "a2";
  return "a1";
}

function todayStamp(d = new Date()): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const GLYPHS: Record<string, string> = {
  F1: "breath", F2: "wave", F3: "coin", F4: "thanks", F5: "card", F6: "sun",
  J1: "wave", J2: "search", J3: "necklace", J4: "gem", J5: "ring", J6: "tag",
  J7: "card", J8: "spark", J9: "box", J10: "gift", J11: "gem", J12: "phone", J13: "gift",
  R1: "seat", R2: "fork", R3: "leaf", R4: "plate", R5: "bill", R6: "phone", R7: "bowl", R8: "phone", R9: "bill", R10: "coffee", R11: "leaf", R12: "fork", R13: "coffee",
  T1: "plane", T2: "pass", T3: "bed", T4: "taxi", T5: "pin", T6: "bed", T7: "bag", T8: "pass", T9: "plane", T10: "bag", T11: "pin", T12: "bed", T13: "cross", T14: "plane", T15: "bed",
  W1: "phone", W2: "mail", W3: "meet", W4: "coffee", W5: "phone", W6: "card", W7: "phone", W8: "meet", W9: "mail", W10: "mail", W11: "mail",
  D1: "cross", D2: "coin", D3: "home", D4: "phone", D5: "box", D6: "cross", D7: "scissors", D8: "wrench", D9: "card", D10: "taxi", D11: "coin", D12: "cross",
  J14: "ring", J15: "ring", J16: "gem", J17: "necklace", J18: "spark",
};

function Glyph({ kind }: { kind: string }) {
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
  if (kind === "lock") {
    return <svg {...props}><rect x="6" y="11" width="12" height="8" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
  }
  if (kind === "breath") return <svg {...props}><path d="M3 14c2-5 4-5 6 0s4 5 6 0 4-5 6 0" /></svg>;
  if (kind === "wave") return <svg {...props}><path d="M8 14c.4-3 2-4 3.2-1" /><path d="M4 16c1-6 4-8 7-3" /><circle cx="15" cy="8" r="2.2" /></svg>;
  if (kind === "coin") return <svg {...props}><circle cx="12" cy="12" r="7" /><path d="M12 8v8M9.5 10.5h4a1.5 1.5 0 0 1 0 3h-3" /></svg>;
  if (kind === "thanks") return <svg {...props}><path d="M8 13l2 2 6-7" /><path d="M5 19h14" /></svg>;
  if (kind === "card") return <svg {...props}><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M8 11h8M8 14h5" /></svg>;
  if (kind === "sun") return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" /></svg>;
  if (kind === "search") return <svg {...props}><circle cx="11" cy="11" r="5" /><path d="M15 15l4 4" /></svg>;
  if (kind === "necklace") return <svg {...props}><path d="M7 7c1 6 3 9 5 9s4-3 5-9" /><circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none" /></svg>;
  if (kind === "gem") return <svg {...props}><path d="M7 9l5-4 5 4-5 10z" /><path d="M7 9h10" /></svg>;
  if (kind === "ring") return <svg {...props}><circle cx="12" cy="13" r="5" /><path d="M12 8l1.2-3h-2.4z" /></svg>;
  if (kind === "tag") return <svg {...props}><path d="M4 12l8-8h6v6l-8 8z" /><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" /></svg>;
  if (kind === "spark") return <svg {...props}><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" /></svg>;
  if (kind === "box") return <svg {...props}><path d="M4 8l8-3 8 3v9l-8 3-8-3z" /><path d="M12 5v15M4 8l8 3 8-3" /></svg>;
  if (kind === "gift") return <svg {...props}><rect x="5" y="10" width="14" height="9" rx="1" /><path d="M4 10h16M12 10v9M12 10c-2-3-5-3-5 0M12 10c2-3 5-3 5 0" /></svg>;
  if (kind === "phone") return <svg {...props}><path d="M7 4h3l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v3a2 2 0 0 1-2 2A14 14 0 0 1 5 6a2 2 0 0 1 2-2z" /></svg>;
  if (kind === "seat") return <svg {...props}><path d="M7 11V6h10v5" /><path d="M6 11h12v4H6zM8 15v4M16 15v4" /></svg>;
  if (kind === "fork") return <svg {...props}><path d="M8 3v7a3 3 0 0 0 3 3v8M8 3v5M11 3v5M14 3c2 3 2 6 0 8" /></svg>;
  if (kind === "leaf") return <svg {...props}><path d="M5 16c8-1 12-8 13-13-6 1-13 6-13 13z" /><path d="M8 13c2-1 4-3 6-6" /></svg>;
  if (kind === "plate") return <svg {...props}><ellipse cx="12" cy="13" rx="8" ry="4" /><path d="M8 13h8" /></svg>;
  if (kind === "bill") return <svg {...props}><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
  if (kind === "bowl") return <svg {...props}><path d="M5 10h14c0 5-3 8-7 8s-7-3-7-8z" /><path d="M8 6c1 2 2 2 3 0s2-2 3 0" /></svg>;
  if (kind === "plane") return <svg {...props}><path d="M3 13l18-6-6 14-2-6-6-2z" /></svg>;
  if (kind === "pass") return <svg {...props}><rect x="5" y="4" width="14" height="16" rx="2" /><circle cx="12" cy="11" r="2.4" /><path d="M8 16h8" /></svg>;
  if (kind === "bed") return <svg {...props}><path d="M4 16V8M4 14h16v4M8 14v-2a2 2 0 0 1 2-2h6v4" /></svg>;
  if (kind === "taxi") return <svg {...props}><path d="M4 14h16v4H4zM7 14l2-4h6l2 4" /><circle cx="8" cy="18" r="1.3" fill="currentColor" stroke="none" /><circle cx="16" cy="18" r="1.3" fill="currentColor" stroke="none" /></svg>;
  if (kind === "pin") return <svg {...props}><path d="M12 21s6-6 6-10a6 6 0 1 0-12 0c0 4 6 10 6 10z" /><circle cx="12" cy="11" r="1.6" /></svg>;
  if (kind === "bag") return <svg {...props}><path d="M6 8h12l-1 12H7z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
  if (kind === "mail") return <svg {...props}><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M4 8l8 6 8-6" /></svg>;
  if (kind === "meet") return <svg {...props}><circle cx="8" cy="9" r="2.2" /><circle cx="16" cy="9" r="2.2" /><path d="M4 17c.6-2 2-3 4-3s3.4 1 4 3M12 17c.6-2 2-3 4-3s3.4 1 4 3" /></svg>;
  if (kind === "coffee") return <svg {...props}><path d="M6 8h10v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2M8 4c.4 1 .4 2 0 3M12 4c.4 1 .4 2 0 3" /></svg>;
  if (kind === "cross") return <svg {...props}><path d="M12 5v14M6 10h12" /></svg>;
  if (kind === "home") return <svg {...props}><path d="M4 12l8-7 8 7" /><path d="M7 11v8h10v-8" /></svg>;
  if (kind === "scissors") return <svg {...props}><circle cx="7" cy="7" r="2.2" /><circle cx="7" cy="17" r="2.2" /><path d="M9 8.5L20 18M9 15.5L20 6" /></svg>;
  if (kind === "wrench") return <svg {...props}><path d="M14 6a3 3 0 0 0-3 4L4 17l3 3 7-7a3 3 0 0 0 4-3l-3 1-2-2 1-3z" /></svg>;
  return <svg {...props}><circle cx="12" cy="12" r="3" /></svg>;
}

export function PathHome() {
  const profile = useStore((s) => s.profile);
  const progress = useStore((s) => s.progress);
  const lessonCursor = useStore((s) => s.lessonCursor);
  const armResume = useStore((s) => s.armResume);
  const setLessonCursor = useStore((s) => s.setLessonCursor);
  if (!profile) return null;
  const recommended = SHIPPED.find((id) => isLessonOpen(id, profile.goal, progress) && !progress[id]);
  const done = SHIPPED.filter((id) => progress[id]).length;
  const resumeLesson = lessonCursor ? lessonById[lessonCursor.lessonId] : undefined;
  const resumeOpen = Boolean(
    lessonCursor &&
      resumeLesson &&
      !progress[lessonCursor.lessonId] &&
      isLessonOpen(lessonCursor.lessonId, profile.goal, progress),
  );
  const studiedToday = profile.lastActive === todayStamp();
  return (
    <section className="screen">
      <header className="path-head">
        <div className="status-row">
          <span className="pill">{profile.streak > 0 ? `連續 ${profile.streak} 日` : "今日未打卡"}</span>
          <span className="pill">{profile.xp} XP</span>
          <span className="pill goal">
            今日目標 {profile.minutes} 分鐘
            <span className="goal-bar" aria-hidden="true"><i style={{ width: studiedToday ? "100%" : "0%" }} /></span>
          </span>
        </div>
        <div className="path-title-row">
          <div className="mast-copy">
            <p className="fine">{profile.name} · {GOAL_LABEL[profile.goal]}</p>
            <h1 className="path-title">學習路徑</h1>
          </div>
          <img className="mascot" src={asset("assets/art/mascot-wave.webp")} alt="小燈" width={72} height={72} />
        </div>
        <p className="fine">{done} / {SHIPPED.length} 課完成。冇紅心。聽日再嚟都得。</p>
      </header>
      {resumeOpen && lessonCursor && resumeLesson ? (
        <div className="resume-banner">
          <p>未完成：{resumeLesson.titleYue}。停喺{BEAT_LABELS[lessonCursor.beat]}。</p>
          <button
            className="btn block"
            type="button"
            onClick={() => {
              armResume();
              playSfx("tap");
              go(`#/lesson/${lessonCursor.lessonId}`);
            }}
          >
            繼續
          </button>
          <button
            className="btn ghost block"
            type="button"
            onClick={() => {
              const id = lessonCursor.lessonId;
              setLessonCursor(null);
              playSfx("tap");
              go(`#/lesson/${id}`);
            }}
          >
            重新開始
          </button>
        </div>
      ) : null}
      {pathData.units.map((unit) => (
        <section key={unit.id} className="unit band">
          <h2>{unit.title}</h2>
          <p className="lede">{unit.blurb}</p>
          <div className="path-rail">
            {unit.lessons.map((entry, index) => {
              const lesson = lessonById[entry.id];
              const soon = Boolean(entry.soon) || !lesson;
              const open = !soon && isLessonOpen(entry.id, profile.goal, progress);
              const doneLesson = Boolean(progress[entry.id]);
              const title = lesson?.titleYue || entry.title || entry.id;
              const en = lesson?.titleEn || "即將推出";
              const cefr = entry.cefr || lesson?.cefr || "";
              const state = soon ? "soon" : doneLesson ? "done" : recommended === entry.id ? "current" : open ? "open" : "locked";
              const body = (
                <>
                  <span className="orb">
                    {open && lesson ? <Glyph kind={GLYPHS[entry.id] || "dot"} /> : <Glyph kind="lock" />}
                  </span>
                  <span className="node-copy">
                    {cefr && <span className={`cefr ${cefrClass(cefr)}`}>{cefr}</span>}
                    <strong>{title}</strong>
                    <em lang="en">{en}</em>
                    {recommended === entry.id ? (
                      <span className="meta">今日</span>
                    ) : doneLesson ? (
                      <span className="meta">完成</span>
                    ) : soon ? (
                      <span className="meta">即將</span>
                    ) : open ? (
                      <span className="meta">{lesson?.minutes} 分</span>
                    ) : (
                      <span className="meta">未開</span>
                    )}
                  </span>
                </>
              );
              const cls = `path-node ${state} ${index % 2 ? "even" : "odd"}`;
              if (open && lesson) {
                return (
                  <a key={entry.id} className={cls} href={`#/lesson/${lesson.id}`} onClick={() => playSfx("tap")}>
                    {body}
                  </a>
                );
              }
              return (
                <div key={entry.id} className={`${cls} locked`}>
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
      <p className="eyebrow">練習</p>
      <h1>到期先再睇</h1>
      <p className="lede">用 FSRS 排期。再來、難、好、易都只係記住你幾熟，唔會罰你。</p>
      <a className="btn ghost block" href="#/vocab">生字</a>
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
    const hay = `${item.lemma} ${item.glossYue} ${item.ipa}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  return (
    <section className="screen">
      <p className="eyebrow">生字</p>
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
  const [more, setMore] = useState(false);
  if (!item) {
    return (
      <section className="screen plain">
        <a className="back" href="#/vocab">返生字</a>
        <h1>冇呢張卡</h1>
      </section>
    );
  }
  return (
    <section className="screen plain stack">
      <a className="back" href="#/words">返詞庫</a>
      <p className="eyebrow">{learnerEyebrow(item)}</p>
      <h1 lang="en">{item.lemma}</h1>
      <p className="ipa">{item.ipa}</p>
      <Syllables id={item.id} />
      <p>{item.glossYue}</p>
      {jyutping && item.jyutping ? <p className="fine">粵拼（只標中文解釋）：{item.jyutping}</p> : null}
      <p lang="en">{item.example}</p>
      <p className="gloss">{item.exampleYue}</p>
      <div className="row-btns">
        <button className="btn" type="button" onClick={() => playAsset(item.audio)}>聽例句</button>
        <button className="btn ghost" type="button" onClick={() => playAsset(item.audioSlow)}>慢速</button>
      </div>
      {item.note && <p className="note">{item.note}</p>}
      <button className="btn ghost block" type="button" onClick={() => setMore((open) => !open)}>
        {more ? "收起" : "更多"}
      </button>
      {more && item.usageNotes && <p className="note">{item.usageNotes}</p>}
      {more && item.pitfallsYue && <p className="note">{item.pitfallsYue}</p>}
      {more && item.examples?.slice(1).map((example) => (
        <div key={example.en} className="stack">
          <p lang="en">{example.en}</p>
          <p className="gloss">{example.yue}</p>
          <button className="btn quiet" type="button" onClick={() => playAsset(example.audio)}>聽例句</button>
        </div>
      ))}
      {more && item.related && item.related.length > 0 && (
        <p className="fine">
          相關：
          {item.related.map((relatedId) => {
            const related = lexById[relatedId];
            if (!related) return null;
            return <a key={relatedId} href={`#/word/${relatedId}`} lang="en"> {related.lemma}</a>;
          })}
        </p>
      )}
      {more && item.miniDialogue?.map((turn) => (
        <p key={turn.en} className="lede"><span lang="en">{turn.en}</span><span className="gloss"> {turn.yue}</span></p>
      ))}
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
  const previewImport = useStore((s) => s.previewImport);
  const applyImport = useStore((s) => s.applyImport);
  const exportSnapshot = useStore((s) => s.exportSnapshot);
  const [armed, setArmed] = useState(false);
  const [importNote, setImportNote] = useState("");
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!profile) return null;

  async function onPick(file: File) {
    const text = await file.text();
    const preview = previewImport(text);
    if (!preview.ok) {
      setPendingImport(null);
      setImportNote(preview.message);
      return;
    }
    setImportNote("");
    setPendingImport(text);
  }

  function onExport() {
    const body = exportSnapshot();
    const blob = new Blob([body], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "english-quest-progress.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

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
      <label className="toggle">
        <span>音效</span>
        <input type="checkbox" checked={profile.sound !== false} onChange={(e) => update({ sound: e.target.checked })} />
      </label>
      <p className="fine">正確、錯誤、完成同連擊都有短音。發音朗讀播放嗰陣會讓路。關掉就完全靜音。</p>
      <h2>進度檔案</h2>
      <button className="btn ghost block" type="button" onClick={onExport}>匯出進度</button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onPick(file);
        }}
      />
      <button className="btn ghost block" type="button" onClick={() => fileRef.current?.click()}>匯入進度</button>
      {importNote && <p className="note">{importNote}</p>}
      {pendingImport && (
        <div className="stack">
          <p className="note">匯入會覆蓋而家嘅進度，課同重溫卡都會換走。</p>
          <button
            className="btn block"
            type="button"
            onClick={() => {
              const result = applyImport(pendingImport);
              setPendingImport(null);
              setImportNote(result.ok ? "已匯入呢部機。" : result.message);
            }}
          >
            確定匯入
          </button>
          <button className="btn ghost block" type="button" onClick={() => setPendingImport(null)}>取消</button>
        </div>
      )}
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
