import { asset } from "./data";

let el: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

function audio(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = "none";
    const ping = () => listeners.forEach((fn) => fn());
    el.addEventListener("timeupdate", ping);
    el.addEventListener("ended", ping);
    el.addEventListener("pause", ping);
    el.addEventListener("playing", ping);
    el.addEventListener("error", ping);
  }
  return el;
}

export function subscribeAudio(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function playAsset(path: string): HTMLAudioElement {
  const node = audio();
  node.src = asset(path);
  node.playbackRate = 1;
  void node.play().catch(() => {
    /* Autoplay can still reject if the gesture was lost. The button stays. */
  });
  return node;
}

export function stopAudio() {
  if (!el) return;
  el.pause();
  el.currentTime = 0;
}

export function audioSnapshot(): { src: string; time: number; duration: number; paused: boolean } {
  const node = audio();
  return {
    src: node.currentSrc || node.src || "",
    time: node.currentTime || 0,
    duration: Number.isFinite(node.duration) ? node.duration : 0,
    paused: node.paused,
  };
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
  return keywords.filter((k) => hay.includes(k.toLowerCase()));
}
