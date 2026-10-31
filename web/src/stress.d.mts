export type StressPart = { text: string; stressed: boolean };
export type KaraokeSpan = { word: string; start: number; end: number };

export function stressSplit(syllables: readonly string[], stress: number): StressPart[];
export function syllableCount(word: string): number;
export function karaokeSpans(text: string, durationSec: number): KaraokeSpan[];
