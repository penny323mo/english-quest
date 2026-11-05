import type { Goal } from "./types";

export const GOAL_LABEL: Record<Goal, string> = {
  foundation: "打好基礎",
  daily: "日常生活",
  travel: "旅行登機",
  restaurant: "餐廳入座",
  work: "返工職場",
  jewellery: "珠寶櫃檯",
};

/** Basics and daily life first; jewellery is one track among equals. */
export const GOAL_ORDER: Goal[] = ["foundation", "daily", "travel", "restaurant", "work", "jewellery"];

const GOAL_TEXT: Record<Goal, string> = {
  foundation: "氣息、打招呼、數字、禮貌",
  daily: "睇醫生、銀行、電話卡、寄包裹",
  travel: "機場、酒店、搭的士",
  restaurant: "訂位、點菜、埋單",
  work: "電話、電郵、開會",
  jewellery: "推介首飾、試戴、收錢",
};

export function GoalPick({ value, onChange }: { value: Goal | null; onChange: (g: Goal) => void }) {
  return (
    <div className="stack" role="radiogroup" aria-label="目標">
      {GOAL_ORDER.map((id) => (
        <button
          key={id}
          className={value === id ? "opt on" : "opt"}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
        >
          <strong>{GOAL_LABEL[id]}</strong>
          <span>{GOAL_TEXT[id]}</span>
        </button>
      ))}
    </div>
  );
}
