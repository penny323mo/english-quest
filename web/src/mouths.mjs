/** Mouth shapes for a lesson focus sound. Never falls back to /θ/. */

const VOWELS = [
  ["eɪ", "ey"],
  ["aɪ", "ay"],
  ["ɔɪ", "oy"],
  ["oʊ", "ow"],
  ["aʊ", "aw"],
  ["ɝ", "er"],
  ["ɚ", "er"],
  ["æ", "ae"],
  ["ɑ", "ah"],
  ["ɔ", "openO"],
  ["ʌ", "uh"],
  ["ə", "schwa"],
  ["ɛ", "eh"],
  ["ɪ", "short"],
  ["ʊ", "uuh"],
  ["i", "long"],
  ["u", "oo"],
];

const CONS = [
  ["tʃ", "affricate"],
  ["dʒ", "dzh"],
  ["θ", "theta"],
  ["ð", "dh"],
  ["ʃ", "sh"],
  ["ʒ", "zh"],
  ["ŋ", "ng"],
  ["ɹ", "r"],
  ["l", "l"],
  ["n", "n"],
  ["m", "m"],
  ["w", "w"],
  ["v", "v"],
  ["b", "b"],
  ["p", "p"],
  ["ɡ", "g"],
  ["g", "g"],
  ["k", "k"],
  ["f", "f"],
  ["s", "s"],
  ["z", "z"],
  ["h", "h"],
  ["j", "yod"],
  ["t", "tstop"],
  ["d", "dstop"],
];

function path(dx, dy) {
  return `M${48 + dx} ${78 + dy} C${72 + dx} ${74 + dy} ${98 - dx} ${70 + dy} ${114 - dx} ${64 + dy} C${106} ${82 + dy} ${78} ${90} ${50 + dx} ${86 + dy} Z`;
}

export const TONGUE = {
  short: "M48 78 C70 74 96 76 112 70 C104 84 78 88 52 84 Z",
  long: "M46 82 C72 70 100 66 118 62 C112 80 80 90 50 88 Z",
  theta: "M50 80 C74 78 96 70 112 62 L116 70 C98 80 74 88 50 86 Z",
  w: "M48 80 C78 86 100 84 114 74 C104 90 76 94 50 88 Z",
  v: "M50 78 C76 76 102 74 118 68 C110 84 80 88 52 84 Z",
  sh: "M48 80 C74 78 98 70 116 64 C108 82 78 90 50 86 Z",
  affricate: "M50 78 C78 80 104 76 120 66 C112 82 82 88 52 84 Z",
  r: "M52 84 C74 70 96 62 110 66 C100 82 76 90 52 88 Z",
  l: "M50 76 C76 78 104 64 118 58 C110 78 80 86 52 84 Z",
  ey: path(0, -2),
  ay: path(2, 2),
  ow: path(-2, 1),
  aw: path(1, 3),
  oy: path(3, -1),
  ae: path(-1, 4),
  eh: path(2, -3),
  uh: path(-3, 2),
  oo: path(0, 3),
  ah: path(4, 0),
  openO: path(-2, -2),
  schwa: path(1, -4),
  er: path(3, 2),
  b: path(-4, 1),
  g: path(2, 4),
  dh: path(-1, -1),
  n: path(0, 2),
  dzh: path(4, -2),
  zh: path(-3, 3),
  ng: path(1, 1),
  m: path(-2, 4),
  p: path(3, -3),
  k: path(-4, -1),
  f: path(2, -4),
  s: path(0, -3),
  z: path(3, 1),
  h: path(-1, 2),
  yod: path(4, 3),
  tstop: path(-3, -3),
  dstop: path(1, -2),
  uuh: path(-2, 0),
  coda: "M52 82 C76 84 102 78 116 70 C108 86 80 92 52 88 Z",
};

export const CAPTION = {
  short: "短 /ɪ/：嘴唔使拉到好開，音好快收。",
  long: "長 /i/：嘴角再拉開少少，音拉長。",
  theta: "/θ/：舌尖輕貼上排牙，氣由牙縫出。",
  w: "/w/：雙唇收圓，再打開。",
  v: "/v/：上牙輕掂下唇，聲帶要震。",
  sh: "/ʃ/：唇少少圓，氣由中間連續出。",
  affricate: "/tʃ/：先輕輕一塞，再放氣。",
  r: "/ɹ/：舌尖向後收，唔好掂到上顎。",
  l: "/l/：舌尖掂到上顎後面。",
  ey: "/eɪ/：由 /e/ 滑去 /ɪ/，嘴角拉開。",
  ay: "/aɪ/：由開嘴滑去 /ɪ/。",
  ow: "/oʊ/：由圓唇滑去 /ʊ/。",
  aw: "/aʊ/：由開嘴滑去圓唇。",
  oy: "/ɔɪ/：由圓唇滑去 /ɪ/。",
  ae: "/æ/：嘴張開，舌放低。",
  eh: "/ɛ/：嘴半開，舌放平。",
  uh: "/ʌ/：嘴半開，放鬆，短促。",
  oo: "/u/：唇收圓，音拉長。",
  ah: "/ɑ/：嘴大開，舌放後。",
  openO: "/ɔ/：唇圓，嘴半開。",
  schwa: "/ə/：嘴放鬆，音好輕好短。",
  er: "/ɝ/：舌向後收，唇少少圓。",
  b: "/b/：雙唇先合住，再打開出聲。",
  g: "/ɡ/：舌後掂上顎，再打開。",
  dh: "/ð/：舌尖輕出牙縫，聲帶要震。",
  n: "/n/：舌尖掂上顎，氣由鼻出。",
  dzh: "/dʒ/：先一塞，再出有聲嘅 /ʒ/。",
  zh: "/ʒ/：唇少少圓，聲帶要震。",
  ng: "/ŋ/：舌後抬起，氣由鼻出。",
  m: "/m/：雙唇合住，氣由鼻出。",
  p: "/p/：雙唇合住，再打開出氣。",
  k: "/k/：舌後掂上顎，再打開出氣。",
  f: "/f/：上牙輕掂下唇，出氣。",
  s: "/s/：舌尖近牙槽，出一條氣。",
  z: "/z/：同 /s/ 口型，聲帶要震。",
  h: "/h/：嘴張開，輕輕送氣。",
  yod: "/j/：舌面向硬顎抬，再滑開。",
  tstop: "/t/：舌尖掂牙槽，再打開。",
  dstop: "/d/：同 /t/ 口型，聲帶要震。",
  uuh: "/ʊ/：唇少少圓，音短。",
  coda: "尾音要讀完：five 收到 /v/，six 收到 /ks/，ten 收到 /n/。",
};

function primaryKind(part) {
  const body = part.replace(/[\/ˈˌ.\s]/g, "");
  for (const [symbol, kind] of VOWELS) {
    if (body.includes(symbol)) return kind;
  }
  for (const [symbol, kind] of CONS) {
    if (body.includes(symbol)) return kind;
  }
  return null;
}

export function mouthsFor(ipa) {
  const raw = String(ipa || "");
  if (raw.includes("尾音")) return ["coda"];
  const parts = raw.split("·").map((part) => part.trim()).filter(Boolean);
  const kinds = [];
  for (const part of parts) {
    const kind = primaryKind(part);
    if (kind && !kinds.includes(kind)) kinds.push(kind);
  }
  return kinds;
}
