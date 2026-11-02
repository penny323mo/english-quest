/** Lesson gloss, Mandarin, and quiz-key checks. Shared by the test and the review sample. */

const SMALL = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};
const SCALE = { hundred: 100, thousand: 1000, million: 1000000 };
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
const ORDINAL = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  tenth: 10, eleventh: 11, twelfth: 12,
};
const YUE_DIGIT = { 零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const YUE_UNIT = { 十: 10, 百: 100, 千: 1000, 萬: 10000 };

const MEASURE_EN = [
  [/tablet|pill|capsule/, "tablet"],
  [/time|times|once|twice|thrice/, "time"],
  [/day/, "day"],
  [/month/, "month"],
  [/dollar/, "money"],
  [/people|person|guest/, "person"],
  [/piece|item/, "item"],
  [/percent/, "percent"],
];
const MEASURE_YUE = [
  [/粒|片|膠囊/, "tablet"],
  [/次|遍/, "time"],
  [/日|天/, "day"],
  [/月/, "month"],
  [/蚊|元|塊/, "money"],
  [/人|位/, "person"],
  [/份|件/, "item"],
  [/巴仙|%/, "percent"],
];

const ACTION_PAIRS = [
  { en: /\bwipe\b/i, yue: /抹/ },
  { en: /\bperfume\b/i, yue: /香水/ },
  { en: /\bdeposit\b/i, yue: /按金/ },
  { en: /\bsign\b/i, yue: /簽/ },
  { en: /\bpay\b/i, yue: /付|交/ },
  { en: /\bheat\b/i, yue: /熱/ },
  { en: /\bwait/i, yue: /等/ },
];

const EXTRA_NEEDS_EN = [
  [/免費/, /\b(free|complimentary)\b/i, "免費"],
  [/過敏/, /\ballerg/i, "過敏"],
  [/鎖匙/, /\bkeys?\b/i, "鎖匙"],
  [/大使館/, /\bembassy\b/i, "大使館"],
  [/保安/, /\b(security|guard)\b/i, "保安"],
  [/醬汁/, /\bsauce\b/i, "醬汁"],
  [/生日/, /\bbirthday\b/i, "生日"],
  [/試身/, /\bfitting\b/i, "試身"],
  [/存入/, /\bdeposit\b/i, "存入"],
  [/剩低/, /\b(left|remain|rest)\b/i, "剩低"],
];

function tokens(text) {
  return String(text).toLowerCase().match(/[a-z0-9']+/g) || [];
}

function parseEnglishNumbers(text) {
  const row = tokens(text);
  const values = [];
  let current = 0;
  let saw = false;
  const flush = () => {
    if (!saw) return;
    values.push(current);
    current = 0;
    saw = false;
  };
  for (let i = 0; i < row.length; i += 1) {
    const tok = row[i];
    if (/^\d+$/.test(tok)) {
      flush();
      values.push(Number(tok));
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(MONTHS, tok)) {
      const prev = row[i - 1] || "";
      if (tok !== "may" || ["in", "on", "this", "next", "last", "during", "of"].includes(prev)) {
        flush();
        values.push(MONTHS[tok]);
      }
      continue;
    }
    if (tok === "once") {
      const follows = row[i + 1] || "";
      flush();
      if (follows === "a" || follows === "per" || follows === "each") values.push(1);
      continue;
    }
    if (tok === "halfway") { flush(); values.push(0.5); continue; }
    if (tok === "twice") { flush(); values.push(2); continue; }
    if (tok === "thrice") { flush(); values.push(3); continue; }
    if (tok === "half") { flush(); values.push(0.5); continue; }
    if (tok === "both") { flush(); values.push(2); continue; }
    if (Object.prototype.hasOwnProperty.call(ORDINAL, tok)) {
      const n = ORDINAL[tok];
      if (saw && current >= 20 && current % 10 === 0 && n < 10) {
        current += n;
        continue;
      }
      flush();
      const prev = row[i - 1] || "";
      const next = row[i + 1] || "";
      if (["the", "a", "an", "my", "our", "your"].includes(prev) || next === "of") values.push(n);
      continue;
    }
    if (tok === "oh" || tok === "zero") {
      const prev = row[i - 1] || "";
      const next = row[i + 1] || "";
      const numish = (part) => Object.prototype.hasOwnProperty.call(SMALL, part) || /^\d+$/.test(part) || part === "oh" || part === "zero";
      flush();
      if (tok === "zero" || numish(prev) || numish(next)) values.push(0);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(SMALL, tok)) {
      const n = SMALL[tok];
      const next = row[i + 1] || "";
      if (n >= 1 && n <= 12 && next === "thirty") {
        flush();
        values.push(n, 0.5);
        i += 1;
        continue;
      }
      if (tok === "one") {
        const follows = row[i + 1] || "";
        const prev = row[i - 1] || "";
        const pronounNext = new Set(["", "and", "or", "but", "still", "available", "here", "there", "please", "too", "now", "today", "is", "was", "at", "on", "in", "for", "with", "by", "to", "from", "uses", "can", "will", "would", "how", "what", "where", "who", "which", "why"]);
        const adjective = new Set("shorter short larger large smaller small bigger big oversized grey gray newer new older old prepaid similar tighter tight softer soft longer long".split(" "));
        if (pronounNext.has(follows) || adjective.has(prev)) { flush(); continue; }
      }
      if (saw && current >= 20 && current % 10 === 0 && n < 10) current += n;
      else if (saw && current >= 100 && n < 100) current += n;
      else { flush(); current = n; saw = true; }
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(SCALE, tok)) {
      const scale = SCALE[tok];
      if (!saw) { current = scale; saw = true; }
      else current *= scale;
      continue;
    }
    flush();
  }
  flush();
  return values;
}

function optionalArticles(text) {
  return (String(text).match(/\b(a|an|the|this|that|each|every|per)\b/gi) || []).length;
}

export function parseYueNumbers(text) {
  const source = String(text).replaceAll("八達通", "ＸＸＸ").replaceAll("夾萬", "ＸＸ").replaceAll("零錢", "ＸＸ");
  const chars = [...source];
  const values = [];
  for (const raw of source.match(/\d+/g) || []) values.push(Number(raw));
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch === "半") { values.push(0.5); i += 1; continue; }
    if (ch === "零" && "售食錢".includes(chars[i + 1] || "")) { i += 2; continue; }
    if (chars[i - 2] === "星" && chars[i - 1] === "期" && Object.prototype.hasOwnProperty.call(YUE_DIGIT, ch)) {
      i += 1;
      continue;
    }
    if (ch === "一" && chars[i - 1] && chars[i - 1] === chars[i + 1]) { i += 1; continue; }
    if (ch === "一" && chars[i + 1] === "次" && chars.slice(Math.max(0, i - 8), i).join("").includes("再")) { i += 2; continue; }
    if (ch === "一" && "下啲齊起咬陣".includes(chars[i + 1] || "")) { i += 2; continue; }
    if (!Object.prototype.hasOwnProperty.call(YUE_DIGIT, ch) && !Object.prototype.hasOwnProperty.call(YUE_UNIT, ch)) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < chars.length && (Object.prototype.hasOwnProperty.call(YUE_DIGIT, chars[i]) || Object.prototype.hasOwnProperty.call(YUE_UNIT, chars[i]))) i += 1;
    const run = chars.slice(start, i);
    const ordinal = chars[start - 1] === "第";
    if (!run.some((part) => Object.prototype.hasOwnProperty.call(YUE_UNIT, part))) {
      if (chars[i] === "成") continue;
      const digits = run.map((part) => YUE_DIGIT[part]);
      const asYear = Number(digits.join(""));
      if (digits.length === 4 && asYear >= 1900 && asYear <= 2100) values.push(asYear);
      else for (const digit of digits) values.push(digit);
      continue;
    }
    // Place value, then any bare digits after the value (十二零八 → 12, 0, 8).
    let total = 0;
    let current = 0;
    let saw = false;
    let lastUnit = 0;
    let at = 0;
    while (at < run.length) {
      const now = run[at];
      if (Object.prototype.hasOwnProperty.call(YUE_DIGIT, now)) {
        if (lastUnit === 10000 && !saw && YUE_DIGIT[now] > 0 && YUE_DIGIT[now] < 10 && !Object.prototype.hasOwnProperty.call(YUE_UNIT, run[at + 1] || "")) {
          total += YUE_DIGIT[now] * 1000;
          current = 0;
          saw = false;
          lastUnit = 0;
          at += 1;
          continue;
        }
        current = YUE_DIGIT[now];
        saw = true;
        at += 1;
        continue;
      }
      const unit = YUE_UNIT[now];
      if (unit === 10000) total = (total + (saw ? current : 1)) * unit;
      else total += (saw ? current : 1) * unit;
      current = 0;
      saw = false;
      lastUnit = unit;
      at += 1;
      if (lastUnit === 10 && at < run.length && Object.prototype.hasOwnProperty.call(YUE_DIGIT, run[at]) && !Object.prototype.hasOwnProperty.call(YUE_UNIT, run[at + 1] || "")) {
        total += YUE_DIGIT[run[at]];
        at += 1;
        if (at < run.length && run.slice(at).every((part) => Object.prototype.hasOwnProperty.call(YUE_DIGIT, part))) {
          for (const digit of run.slice(at)) values.push(YUE_DIGIT[digit]);
          at = run.length;
        }
      }
    }
    total += current;
    if (ordinal || total > 0) values.push(total);
  }
  // N成 is N×10 percent. 兩成 = 20.
  for (const match of source.matchAll(/([一二兩三四五六七八九十])成/g)) {
    const n = YUE_DIGIT[match[1]];
    if (n) values.push(n * 10);
  }
  return values;
}

function counts(list) {
  const map = new Map();
  for (const n of list) map.set(n, (map.get(n) || 0) + 1);
  return map;
}

export function numberMismatches(english, yue) {
  const en = parseEnglishNumbers(english);
  const zh = parseYueNumbers(yue);
  const enCounts = counts(en);
  const zhCounts = counts(zh);
  const optional = optionalArticles(english);
  let spareOnes = optional;
  const problems = [];
  for (const [n, need] of zhCounts) {
    const have = enCounts.get(n) || 0;
    let extra = need - have;
    if (extra > 0 && n === 1 && spareOnes > 0) {
      const used = Math.min(extra, spareOnes);
      extra -= used;
      spareOnes -= used;
    }
    if (extra > 0) problems.push(`gloss adds ${extra} × ${n}`);
  }
  for (const [n, need] of enCounts) {
    const have = zhCounts.get(n) || 0;
    if (have < need) problems.push(`gloss drops ${need - have} × ${n}`);
  }
  return problems;
}

function measurePairs(english, yue) {
  const problems = [];
  const en = [];
  const row = tokens(english);
  for (let i = 0; i < row.length; i += 1) {
    const tok = row[i];
    let n = null;
    if (tok === "once") n = 1;
    else if (tok === "twice") n = 2;
    else if (tok === "thrice") n = 3;
    else if (Object.prototype.hasOwnProperty.call(SMALL, tok)) n = SMALL[tok];
    else if (/^\d+$/.test(tok)) n = Number(tok);
    if (n == null) continue;
    const window = row.slice(i, i + 3).join(" ");
    for (const [re, unit] of MEASURE_EN) {
      if (re.test(window) || (tok === "once" || tok === "twice" || tok === "thrice") && unit === "time") {
        if ((tok === "once" || tok === "twice" || tok === "thrice") && unit !== "time") continue;
        en.push([unit, n]);
        break;
      }
    }
  }
  const zh = [...String(yue)];
  for (let i = 0; i < zh.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(YUE_DIGIT, zh[i]) && zh[i] !== "兩") continue;
    const slice = zh.slice(Math.max(0, i - 1), i + 3).join("");
    const nums = parseYueNumbers(slice);
    const n = nums[0];
    if (n == null) continue;
    for (const [re, unit] of MEASURE_YUE) {
      if (re.test(slice)) {
        const hit = [unit, n];
        if (!en.some(([u, v]) => u === hit[0] && v === hit[1])) {
          const sameUnit = en.filter(([u]) => u === unit);
          if (sameUnit.length) problems.push(`${unit} ${n} vs ${sameUnit.map((pair) => pair[1]).join("/")}`);
        }
      }
    }
  }
  return [...new Set(problems)];
}

function withoutQuotedDots(text) {
  return String(text)
    .replace(/"[^"]*"/g, (part) => part.replaceAll(".", " "))
    .replace(/「[^」]*」/g, (part) => part.replaceAll(".", " "));
}

function sentenceCount(text, enders) {
  const parts = withoutQuotedDots(text).split(enders).map((part) => part.trim()).filter((part) => /[A-Za-z\p{Script=Han}]/u.test(part));
  return Math.max(1, parts.length);
}

/** Sentence boundaries plus a coordinator (and / but / because / if, 因為 / 所以 / 如果 / ，想). */
export function englishClauseCount(text) {
  const body = withoutQuotedDots(text);
  const sentences = sentenceCount(body, /[.!?]+/);
  const links = body.match(/,\s+(?:and|but|or)\b|\b(?:because|if|when|so)\b/gi) || [];
  return sentences + links.length;
}

export function cantoneseClauseCount(text) {
  const body = String(text);
  const sentences = sentenceCount(body, /[。！？]+/);
  const links = body.match(/因為|所以|如果|但係|不過|同埋|[，,]再|[，,]想|[，,]我|[，,]你|[，,]佢/g) || [];
  return sentences + links.length;
}

const GLOSS_OBJECTS = [
  [/熱(?!得)/, /\bhot\b/i, "熱"],
  [/醬汁/, /\bsauce\b/i, "醬汁"],
  [/燈光/, /\blight\b/i, "燈光"],
  [/成套/, /\bset\b/i, "成套"],
  [/有景/, /\bview\b/i, "有景"],
  [/大堂/, /\blobby\b/i, "大堂"],
  [/舖頭/, /\b(shop|store)\b/i, "舖頭"],
  [/聽日/, /\btomorrow\b/i, "聽日"],
  [/今朝/, /\bmorning\b/i, "今朝"],
  [/的士/, /\btaxi\b/i, "的士"],
  [/存貨/, /\bstock\b/i, "存貨"],
  [/期限/, /\bdeadline\b/i, "期限"],
  [/手鏈|手鍊/, /\bbracelet\b/i, "手鏈"],
];

const ENGLISH_OBJECTS = [
  [/\bhot\b/i, /熱/, "hot"],
  [/\bsauce\b/i, /醬/, "sauce"],
  [/\bin the shop\b/i, /舖|店/, "shop"],
  [/\btaxi\b/i, /的士/, "taxi"],
  [/\btomorrow\b/i, /聽日|聽朝/, "tomorrow"],
  [/\bdeadline\b/i, /期限|截數/, "deadline"],
  [/\bcollect\b/i, /取|攞/, "collect"],
  [/\bstock\b/i, /存貨/, "stock"],
  [/\bbracelet\b/i, /手鏈|手鍊|手鈪/, "bracelet"],
];

const VERB_PAIRS = [
  [/\b(?:call|called|calling)\b/i, /打|叫|電話|通話/, "call"],
  [/\battach/i, /附/, "attach"],
  [/\bconfirm/i, /確認/, "confirm"],
  [/\bcollect\b/i, /取|攞/, "collect"],
];

export function objectGaps(english, yue) {
  const problems = [];
  for (const [yueRe, enRe, label] of GLOSS_OBJECTS) {
    if (yueRe.test(yue) && !enRe.test(english)) problems.push(`gloss adds ${label}`);
  }
  for (const [enRe, yueRe, label] of ENGLISH_OBJECTS) {
    if (enRe.test(english) && !yueRe.test(yue)) problems.push(`gloss drops ${label}`);
  }
  for (const [enRe, yueRe, label] of VERB_PAIRS) {
    if (enRe.test(english) && !yueRe.test(yue)) problems.push(`gloss drops verb ${label}`);
  }
  return problems;
}

export function clauseMismatch(english, yue) {
  const enSentences = sentenceCount(english, /[.!?]+/);
  const yueSentences = sentenceCount(yue, /[。！？]+/);
  if (enSentences !== yueSentences) return `clause count ${enSentences}→${yueSentences}`;
  const en = englishClauseCount(english);
  const zh = cantoneseClauseCount(yue);
  if (en === zh) return "";
  const gaps = objectGaps(english, yue);
  if (!gaps.length) return "";
  return `clause count ${en}→${zh}; ${gaps.join(", ")}`;
}

export function extraItems(english, yue) {
  const problems = [];
  for (const [re, en, label] of EXTRA_NEEDS_EN) {
    if (re.test(yue) && !en.test(english)) problems.push(label);
  }
  return problems;
}

export function mandarinMarks(text) {
  const marks = [];
  const raw = String(text || "");
  const stripped = raw.replaceAll("的士", "Ｘ").replaceAll("目的", "Ｙ");
  if (stripped.includes("的")) marks.push("的");
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] !== "把") continue;
    const prev = raw[i - 1] || "";
    if (!"一二兩三四五六七八九十幾呢嗰每成你我佢".includes(prev)) marks.push("把");
  }
  for (const mark of ["並", "然後", "嗎", "我們", "你們", "他們", "這個", "那個", "什麼", "怎麼", "沒有", "不在", "一則", "放進", "並且"]) {
    if (raw.includes(mark)) marks.push(mark);
  }
  if (/寄.{0,6}短訊/.test(raw)) marks.push("寄…短訊");
  return marks;
}

function lessonEnglish(lesson) {
  const bits = [];
  for (const line of lesson.dialogue || []) bits.push(line.text, line.say || "");
  for (const chunk of lesson.chunks || []) bits.push(chunk.example || "", chunk.pattern || "");
  for (const item of lesson.build || []) {
    if (item.type === "order") bits.push((item.answer || []).join(" "));
    for (const choice of item.choices || []) bits.push(choice);
  }
  for (const turn of lesson.roleplay?.turns || []) bits.push(turn.line || "", turn.expect || "");
  for (const item of lesson.quiz || []) bits.push(item.prompt || "");
  for (const item of lesson.understand || []) bits.push(item.prompt || "");
  return bits.join("\n");
}

function quotedLine(lesson, prompt) {
  const text = String(prompt || "");
  let best = null;
  for (const line of lesson.dialogue || []) {
    if (!line.text || !text.includes(line.text)) continue;
    if (!best || line.text.length > best.text.length) best = line;
  }
  return best;
}

function orderProblem(line, choice) {
  const text = line.text;
  const yue = String(choice || "");
  const then = text.match(/\b(?:then|before|after)\b/i);
  if (!then) return "";
  const found = ACTION_PAIRS.filter((pair) => pair.en.test(text) && pair.yue.test(yue));
  if (found.length < 2) return "";
  const enAt = found.map((pair) => ({ pair, at: text.search(pair.en) })).sort((a, b) => a.at - b.at);
  const yueAt = found.map((pair) => ({ pair, at: yue.search(pair.yue) })).sort((a, b) => a.at - b.at);
  const enOrder = enAt.map((row) => row.pair.en.source).join("|");
  const yueOrder = yueAt.map((row) => row.pair.en.source).join("|");
  const flipped = /\b(?:before|after)\b/i.test(text) && !/\bthen\b/i.test(text);
  const same = enOrder === yueOrder;
  if (flipped ? same : !same) return `order ${found.map((pair) => pair.en.source).join(" / ")}`;
  return "";
}

function doseCount(text, unitRe) {
  const match = String(text).match(unitRe);
  if (!match) return null;
  const token = match[1];
  if (token === "一") return 1;
  if (token === "兩" || token === "二") return 2;
  if (token === "三") return 3;
  if (token === "四") return 4;
  return null;
}

export function dosageProblems(english, yue) {
  const problems = [];
  const tablet = String(english).match(/\b(one|two|three|four|\d+)\s+tablets?\b/i);
  const times = String(english).match(/\b(twice|thrice)\b|\b(once|twice|thrice)\s+a\b|\b(\d+)\s+times\b/i);
  if (tablet) {
    const word = tablet[1].toLowerCase();
    const n = { one: 1, two: 2, three: 3, four: 4 }[word] || Number(word);
    const got = doseCount(yue, /([一二兩三四五六七八九十])粒/);
    if (got != null && got !== n) problems.push(`tablet ${n} glossed as ${got}`);
  }
  if (times) {
    const word = (times[1] || times[2] || "").toLowerCase();
    const n = { once: 1, twice: 2, thrice: 3 }[word] || Number(word);
    const got = doseCount(yue, /([一二兩三四五六七八九十])次/);
    if (got == null || got !== n) problems.push(`times ${n} missing`);
  }
  return problems;
}

export function glossProblems(english, yue, exempt) {
  if (exempt) return [];
  const problems = [];
  problems.push(...numberMismatches(english, yue).map((row) => `number: ${row}`));
  problems.push(...dosageProblems(english, yue).map((row) => `dose: ${row}`));
  problems.push(...extraItems(english, yue).map((row) => `item: ${row}`));
  problems.push(...objectGaps(english, yue).map((row) => `object: ${row}`));
  const clauses = clauseMismatch(english, yue);
  if (clauses) problems.push(`clause: ${clauses}`);
  if (/然後|並且/.test(yue)) problems.push("clause: written sequencer");
  if (/因為/.test(yue) && !/\bbecause\b/i.test(english)) problems.push("clause: gloss adds because");
  if (/\bbecause\b/i.test(english) && !/因為|所以/.test(yue)) problems.push("clause: gloss drops because");
  if (/\bbut\b/i.test(english) && !/但係|不過|但/.test(yue)) problems.push("clause: gloss drops but");
  return problems;
}

export function lessonGlossFailures(lesson, exemptions) {
  const failures = [];
  const exempt = new Set(exemptions?.lines || []);
  for (const line of lesson.dialogue || []) {
    const problems = glossProblems(line.text, line.glossYue, exempt.has(line.id));
    for (const problem of problems) failures.push(`${line.id} ${problem}`);
    const marks = mandarinMarks(line.glossYue);
    if (marks.length) failures.push(`${line.id} mandarin [${marks.join(",")}]`);
  }
  if (lesson.canDoEn && lesson.canDoYue && !exempt.has(`${lesson.id}-cando`)) {
    for (const problem of extraItems(lesson.canDoEn, lesson.canDoYue)) failures.push(`${lesson.id} can-do item: ${problem}`);
    const marks = mandarinMarks(lesson.canDoYue);
    if (marks.length) failures.push(`${lesson.id} can-do mandarin [${marks.join(",")}]`);
  }
  const surfaces = [
    lesson.canDoYue,
    ...(lesson.understand || []).flatMap((item) => [item.explain, ...(item.choices || [])]),
    ...(lesson.chunks || []).map((chunk) => chunk.glossYue),
    ...(lesson.quiz || []).flatMap((item) => [item.explain, item.prompt, ...(item.choices || [])]),
    lesson.roleplay?.intro,
  ];
  for (const text of surfaces) {
    const marks = mandarinMarks(text);
    if (marks.length) failures.push(`${lesson.id} surface mandarin [${marks.join(",")}] ${String(text).slice(0, 80)}`);
  }
  return failures;
}

export function quizKeyFailures(lesson, lexById) {
  const failures = [];
  const corpus = lessonEnglish(lesson);
  for (const item of lesson.quiz || []) {
    if (!Number.isInteger(item.answer)) {
      failures.push(`${lesson.id} quiz answer is not an index`);
      continue;
    }
    if (item.answer < 0 || item.answer >= (item.choices || []).length) {
      failures.push(`${lesson.id} quiz answer out of range`);
      continue;
    }
    const choice = item.choices[item.answer];
    if (item.type === "listen") {
      const lemma = lexById[item.lemma];
      const word = String(lemma?.lemma || "").toLowerCase();
      if (!word || String(choice).toLowerCase() !== word) failures.push(`${lesson.id} listen key ${choice} ≠ ${word}`);
    }
    const line = quotedLine(lesson, item.prompt);
    if (line && /呢句即係點？|即係問緊咩？/.test(item.prompt || "")) {
      const order = orderProblem(line, choice);
      if (order) failures.push(`${lesson.id} ${line.id} ${order}`);
      const extras = extraItems(`${line.text}\n${line.glossYue}`, choice);
      if (extras.length) failures.push(`${lesson.id} ${line.id} key adds ${extras.join(",")}`);
      const numbers = numberMismatches(`${line.text} ${line.glossYue}`, choice);
      const added = numbers.filter((row) => row.startsWith("gloss adds"));
      if (added.length) failures.push(`${lesson.id} ${line.id} key ${added.join("; ")}`);
    }
  }
  for (const item of lesson.build || []) {
    if (item.type !== "order") continue;
    const phrase = (item.answer || []).join(" ").toLowerCase();
    if (!phrase) {
      failures.push(`${lesson.id} empty order key`);
      continue;
    }
    if (!corpus.toLowerCase().includes(phrase)) failures.push(`${lesson.id} order key not in a source line: ${phrase}`);
  }
  for (const item of lesson.understand || []) {
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.choices.length) {
      failures.push(`${lesson.id} understand key out of range`);
      continue;
    }
    const choice = item.choices[item.answer];
    const line = quotedLine(lesson, item.prompt);
    if (!line) continue;
    const order = orderProblem(line, choice);
    if (order) failures.push(`${lesson.id} understand ${line.id} ${order}`);
    const extras = extraItems(`${line.text}\n${line.glossYue}`, choice);
    if (extras.length) failures.push(`${lesson.id} understand ${line.id} key adds ${extras.join(",")}`);
    const numbers = numberMismatches(`${line.text} ${line.glossYue}`, choice);
    const added = numbers.filter((row) => row.startsWith("gloss adds"));
    if (added.length) failures.push(`${lesson.id} understand ${line.id} key ${added.join("; ")}`);
  }
  for (const chunk of lesson.chunks || []) {
    const filled = String(chunk.pattern || "").replace("___", chunk.answer || "");
    const example = String(chunk.example || "");
    if (chunk.answer && example && !example.toLowerCase().includes(String(chunk.answer).toLowerCase()) && !filled.toLowerCase().includes(String(chunk.answer).toLowerCase())) {
      failures.push(`${lesson.id} chunk key ${chunk.answer} missing from example`);
    }
  }
  return failures;
}

export function collectLessonText(lesson) {
  return JSON.stringify(lesson);
}
