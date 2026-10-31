import { CAPTION, TONGUE, mouthsFor } from "../mouths.mjs";

export { mouthsFor };

export function Mouth({ kind }: { kind: string }) {
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
