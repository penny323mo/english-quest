import { audioElement, audioSnapshot, speechActive, stopAudio, subscribeAudio } from "./audio-element";
import { asset } from "./data";

export { audioSnapshot, speechActive, stopAudio, subscribeAudio };

export function playAsset(path: string): HTMLAudioElement {
  const node = audioElement();
  node.src = asset(path);
  node.playbackRate = 1;
  void node.play().catch(() => {
    /* Autoplay can still reject if the gesture was lost. The button stays. */
  });
  return node;
}

export function absAsset(path: string): string {
  return new URL(asset(path), location.href).href;
}

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecCtor = new () => Rec;

export function getRecognizer(): RecCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecCtor;
    webkitSpeechRecognition?: RecCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function recorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

export function keywordHits(transcript: string, keywords: string[]): string[] {
  const hay = transcript.toLowerCase();
  return keywords.filter((word) => hay.includes(word.toLowerCase()));
}
