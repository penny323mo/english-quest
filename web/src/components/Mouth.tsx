type Kind = "short" | "long" | "theta" | "w" | "v" | "sh" | "affricate" | "r" | "l";

const TONGUE: Record<Kind, string> = {
  short: "M48 78 C70 74 96 76 112 70 C104 84 78 88 52 84 Z",
  long: "M46 82 C72 70 100 66 118 62 C112 80 80 90 50 88 Z",
  theta: "M50 80 C74 78 96 70 112 62 L116 70 C98 80 74 88 50 86 Z",
  w: "M48 80 C78 86 100 84 114 74 C104 90 76 94 50 88 Z",
  v: "M50 78 C76 76 102 74 118 68 C110 84 80 88 52 84 Z",
  sh: "M48 80 C74 78 98 70 116 64 C108 82 78 90 50 86 Z",
  affricate: "M50 78 C78 80 104 76 120 66 C112 82 82 88 52 84 Z",
  r: "M52 84 C74 70 96 62 110 66 C100 82 76 90 52 88 Z",
  l: "M50 76 C76 78 104 64 118 58 C110 78 80 86 52 84 Z",
};

const CAPTION: Record<Kind, string> = {
  short: "短 /ɪ/：嘴唔使拉到好開，音好快收。",
  long: "長 /i/：嘴角再拉開少少，音拉長。",
  theta: "/θ/：舌尖輕貼上排牙，氣由牙縫出。",
  w: "/w/：雙唇收圓，再打開。",
  v: "/v/：上牙輕掂下唇，聲帶要震。",
  sh: "/ʃ/：唇少少圓，氣由中間連續出。",
  affricate: "/tʃ/：先輕輕一塞，再放氣。check 係呢個音。",
  r: "/ɹ/：舌尖向後收，唔好掂到上顎。",
  l: "/l/：舌尖掂到上顎後面。同 /ɹ/ 分開。",
};

export function Mouth({ kind }: { kind: Kind }) {
  return (
    <figure className="mouth-fig">
      <svg viewBox="0 0 160 110" className="mouth" role="img" aria-label={CAPTION[kind]}>
        <path
          d="M18 36 C40 10 108 8 138 34 C150 48 152 78 136 96"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M46 46 C72 32 104 36 124 54" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M118 54 l10 8" stroke="#C6A75E" strokeWidth="2.4" strokeLinecap="round" />
        <path d={TONGUE[kind]} fill="#2F6F6A" opacity="0.9" />
        <circle cx="132" cy="42" r="2" fill="#C6A75E" />
        <circle cx="140" cy="34" r="1.4" fill="#C6A75E" opacity="0.7" />
      </svg>
      <figcaption>{CAPTION[kind]}</figcaption>
    </figure>
  );
}

export function mouthsFor(ipa: string): Kind[] {
  if (ipa.includes("ɪ") && ipa.includes("i")) return ["short", "long"];
  if (ipa.includes("θ")) return ["theta"];
  if (ipa.includes("w") && ipa.includes("v")) return ["w", "v"];
  if (ipa.includes("ʃ")) return ["sh", "affricate"];
  if (ipa.includes("ɹ")) return ["r", "l"];
  return ["theta"];
}
