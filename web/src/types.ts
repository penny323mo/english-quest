export type Goal = "foundation" | "jewellery" | "travel" | "restaurant";
export type Level = "new" | "some" | "work";

export type Profile = {
  name: string;
  goal: Goal;
  minutes: 10 | 15 | 20;
  level: Level;
  jyutping: boolean;
  xp: number;
  streak: number;
  lastActive: string | null;
};

export type LessonDone = { at: string; xp: number };

export type StoredCard = {
  id: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
};

export type LexItem = {
  id: string;
  lemma: string;
  pos: string;
  senseId: string;
  ipa: string;
  syllables: string[];
  syllableIpa: string[];
  stress: number;
  audio: string;
  audioSlow: string;
  glossYue: string;
  glossZh: string;
  jyutping: string;
  collocations: string[];
  example: string;
  exampleYue: string;
  note: string;
  variants: string[];
  sources: string[];
  verified_at: string;
  status: string;
};

export type Line = {
  id: string;
  speaker: string;
  speakerLabel: string;
  text: string;
  glossYue: string;
  audio: string;
  audioSlow: string;
};

export type UnderstandItem = {
  prompt: string;
  choices: string[];
  answer: number;
  explain?: string;
};

export type Chunk = {
  pattern: string;
  example: string;
  glossYue: string;
  answer: string;
  choices: string[];
};

export type BuildChoice = {
  type: "choice";
  promptYue: string;
  choices: string[];
  answer: number;
  explain?: string;
};

export type BuildOrder = {
  type: "order";
  promptYue: string;
  tokens: string[];
  answer: string[];
};

export type QuizItem = {
  type: "listen" | "meaning" | "choice";
  prompt: string;
  lemma?: string;
  choices: string[];
  answer: number;
  explain?: string;
};

export type RoleTurn = {
  partner: string;
  partnerId: string;
  line: string;
  audio: string;
  audioSlow: string;
  expect: string;
  keywords: string[];
  modelAudio: string;
  modelSlow: string;
};

export type Lesson = {
  id: string;
  unit: string;
  titleYue: string;
  titleEn: string;
  canDoYue: string;
  canDoEn: string;
  minutes: number;
  hero: string;
  cast: string[];
  lemmas: string[];
  dialogue: Line[];
  understand: UnderstandItem[];
  chunks: Chunk[];
  shadow: { lineId: string; hint: string };
  build: Array<BuildChoice | BuildOrder>;
  roleplay: { you: string; intro: string; turns: RoleTurn[] };
  quiz: QuizItem[];
  sound: {
    ipa: string;
    title: string;
    note: string;
    pairs: { a: string; b: string }[];
    drill: string[];
  };
  next: string | null;
};

export type PathFile = {
  units: {
    id: string;
    title: string;
    blurb: string;
    lessons: { id: string; title?: string; soon?: boolean }[];
  }[];
};

export type Route =
  | { name: "path" }
  | { name: "onboarding" }
  | { name: "lesson"; id: string }
  | { name: "review" }
  | { name: "words" }
  | { name: "word"; id: string }
  | { name: "profile" }
  | { name: "attributions" }
  | { name: "settings" };
