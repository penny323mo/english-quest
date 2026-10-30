import type { Goal } from "./types";

export const GOAL_LABEL: Record<Goal, string> = {
  foundation: "打好基礎",
  jewellery: "珠寶櫃檯",
  travel: "旅行登機",
  restaurant: "餐廳入座",
};

export function GoalPick({ value, onChange }: { value: Goal; onChange: (g: Goal) => void }) {
  const options: { id: Goal; text: string }[] = [
    { id: "foundation", text: "氣息、打招呼、數字、禮貌" },
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
