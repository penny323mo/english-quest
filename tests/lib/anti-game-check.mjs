const PERSONS = new Set(
  "mei tom kai ling vera quinn dana una otto iris fran opal hugh ned liam tess ruth paul mae hope yao joel cora ann ben mina sam lee jo pat kim robin alex chris jamie taylor morgan casey drew cole ana ada ren ray lea owen wen noa may suki pesi nori reid wynn nina ida mira glen".split(" "),
);
const PLACES = new Set(
  "window counter shelf box chair plant door table lamp drawer hall reception desk lobby station airport hotel shop store kitchen bathroom bedroom office bank clinic pharmacy restaurant cafe market street lane courtyard balcony elevator lift corridor warehouse basement attic garage patio garden park beach harbour harbor pier gate terminal carousel scanner belt booth till tray suitcase cabin passport trolley cart aisle stall plaza mall museum theatre theater cinema library classroom campus hostel dormitory apartment flat studio suite room front back side left right upstairs downstairs outdoor indoor kettle".split(" "),
);
const TIMES = new Set(
  "monday tuesday wednesday thursday friday saturday sunday noon midnight lunch dinner breakfast brunch yesterday tomorrow tonight morning afternoon evening weekend today week month year january february march april may june july august september october november december hour minute second oclock six seven eight nine ten eleven twelve one two three four five".split(" "),
);
const FUNC = new Set(
  "a an the i you we they he she it my your our is are was were be been am have has had do does did will would can could should may might to of in on at for with and or but if so not this that these those me him her them us please just very still also then there here from as about into".split(" "),
);

function tokens(sample) {
  return String(sample)
    .toLowerCase()
    .replace(/[.?!,;:"']/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sameWord(hay, needle) {
  if (hay === needle || hay === `${needle}s` || hay === `${needle}es`) return true;
  if (hay === `${needle}ed` || hay === `${needle}d` || hay === `${needle}ing`) return true;
  const last = needle[needle.length - 1];
  return hay === `${needle}${last}ed`;
}

function stripLemmaOnce(hay, lemma) {
  const needle = tokens(lemma);
  if (!needle.length) return hay;
  outer: for (let i = 0; i <= hay.length - needle.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) if (!sameWord(hay[i + j], needle[j])) continue outer;
    return hay.slice(0, i).concat(hay.slice(i + needle.length));
  }
  return hay;
}

function lemmaSwapKey(text, lemma) {
  const left = stripLemmaOnce(tokens(text), lemma).filter((tok) => tok !== "a" && tok !== "an" && tok !== "the");
  if (left.length < 2) return null;
  return left.join(" ");
}

function slotSkeleton(text) {
  const toks = tokens(text);
  const out = [];
  for (let i = 0; i < toks.length; i += 1) {
    const tok = toks[i];
    if (tok === "a" || tok === "an" || tok === "the") continue;
    if (/^\d+$/.test(tok)) {
      out.push("#");
      continue;
    }
    if (tok === "code" && i + 1 < toks.length) {
      out.push("#");
      i += 1;
      continue;
    }
    if (PERSONS.has(tok) || TIMES.has(tok) || PLACES.has(tok)) {
      out.push("#");
      continue;
    }
    out.push(tok);
  }
  const collapsed = [];
  for (const tok of out) {
    if (tok === "#" && collapsed[collapsed.length - 1] === "#") continue;
    collapsed.push(tok);
  }
  if (collapsed.length < 4) return null;
  return collapsed.join(" ");
}

function contentWords(text) {
  return new Set((String(text).toLowerCase().match(/[a-z']+/g) || []).filter((tok) => tok.length > 2 && !FUNC.has(tok)));
}

function hasHan(text) {
  return [...String(text)].some((ch) => /\p{Script=Han}/u.test(ch));
}

function norm(text) {
  return String(text).toLowerCase().replace(/[.?!,;:"']/g, " ").replace(/\s+/g, " ").trim();
}

export function lemmaSwapViolations(items) {
  const groups = new Map();
  for (const item of items) {
    const samples = [];
    if (item.example) samples.push(item.example);
    for (const example of item.examples || []) if (example.en) samples.push(example.en);
    for (const turn of item.miniDialogue || []) if (turn.en) samples.push(turn.en);
    const seen = new Set();
    for (const sample of samples) {
      const key = lemmaSwapKey(sample, item.lemma || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(item.id);
    }
  }
  const failures = [];
  for (const [key, ids] of groups) {
    if (ids.size > 2) failures.push(`${key} x${ids.size}`);
  }
  return failures;
}

export function lessonNearDuplicateViolations(lessons) {
  const failures = [];
  const verbatim = new Map();
  const frames = new Map();
  for (const lesson of lessons) {
    const seenFrames = new Set();
    for (const line of lesson.dialogue || []) {
      const text = String(line.text || "").trim();
      if (!text) continue;
      const plain = text.toLowerCase().replace(/\s+/g, " ");
      if (!verbatim.has(plain)) verbatim.set(plain, new Set());
      verbatim.get(plain).add(lesson.id);
      const key = slotSkeleton(text);
      if (!key || seenFrames.has(key)) continue;
      seenFrames.add(key);
      if (!frames.has(key)) frames.set(key, new Set());
      frames.get(key).add(lesson.id);
    }
  }
  for (const [text, ids] of verbatim) {
    if (ids.size > 1) failures.push(`verbatim x${ids.size}: ${text}`);
  }
  for (const [key, ids] of frames) {
    if (ids.size > 1) failures.push(`frame x${ids.size}: ${key}`);
  }
  return failures;
}

export function copiedGlossViolations(items, lessons) {
  const failures = [];
  function check(id, gloss, english) {
    const text = String(gloss || "").trim();
    if (!text) return;
    if (!hasHan(text)) failures.push(`${id} gloss is not Cantonese: ${text}`);
    if (english && norm(text) === norm(english)) failures.push(`${id} gloss copies the English`);
  }
  for (const item of items) {
    check(item.id, item.glossYue, item.lemma);
    check(`${item.id} example`, item.exampleYue, item.example);
    for (const [index, example] of (item.examples || []).entries()) check(`${item.id} ex${index}`, example.yue, example.en);
    for (const [index, turn] of (item.miniDialogue || []).entries()) check(`${item.id} md${index}`, turn.yue, turn.en);
  }
  for (const lesson of lessons || []) {
    for (const line of lesson.dialogue || []) check(line.id, line.glossYue, line.text);
  }
  return failures;
}

export function yesEchoViolations(lessons) {
  const failures = [];
  for (const lesson of lessons) {
    const main = lesson.dialogue || [];
    for (let i = 1; i < main.length; i += 1) {
      const reply = String(main[i].text || "").trim();
      if (!/^Yes\.\s+/i.test(reply)) continue;
      const rest = reply.replace(/^Yes\.\s+/i, "");
      const prev = contentWords(main[i - 1].text || "");
      const mine = contentWords(rest);
      const shared = [...mine].filter((tok) => prev.has(tok));
      const novel = [...mine].filter((tok) => !prev.has(tok));
      if (shared.length >= 3 && novel.length === 0) failures.push(`${main[i].id} echoes ${shared.join(",")}`);
    }
  }
  return failures;
}
