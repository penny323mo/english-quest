import { audioElement, audioSnapshot, cancelSpeech, replaceAudioElement, speechActive, stopAudio, subscribeAudio } from "./audio-element";
import { asset, lessons, lexicon } from "./data";
import { fillLearner, needsRuntimeSpeech } from "./learner";
import { lexExtrasNow, onLexExtras } from "./lex-extras";
import { useStore } from "./store";

export { audioSnapshot, speechActive, stopAudio, subscribeAudio };

let runtimeScripts: Map<string, string> | null = null;
// The 更多 examples arrive later (lex-extras.ts); rebuild the lookup to include them.
onLexExtras(() => {
  runtimeScripts = null;
});

function runtimeScript(path: string): string | null {
  if (!runtimeScripts) {
    const map = new Map<string, string>();
    const add = (audio: string | undefined, script: string | undefined, runtimeTts?: boolean) => {
      if (!audio || !script || !needsRuntimeSpeech(script, runtimeTts)) return;
      map.set(audio, script);
    };
    for (const lesson of lessons) {
      for (const line of lesson.dialogue) {
        add(line.audio, line.say || line.text, line.runtimeTts);
        add(line.audioSlow, line.say || line.text, line.runtimeTts);
      }
      for (const turn of lesson.roleplay.turns) {
        add(turn.modelAudio, turn.expect, turn.runtimeTts);
        add(turn.modelSlow, turn.expect, turn.runtimeTts);
      }
    }
    const extras = lexExtrasNow();
    for (const item of lexicon.items) {
      add(item.audio, item.say || item.example);
      add(item.audioSlow, item.say || item.example);
      for (const example of [...(item.examples || []), ...(extras?.[item.id]?.examples || [])]) {
        add(example.audio, example.en);
        add(example.audioSlow, example.en);
      }
    }
    runtimeScripts = map;
  }
  return runtimeScripts.get(path) ?? null;
}

function speakAloud(text: string): void {
  if (typeof speechSynthesis === "undefined") return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.92;
  speechSynthesis.speak(utter);
}

export function playAsset(path: string): HTMLAudioElement {
  const script = runtimeScript(path);
  const node = audioElement();
  if (script) {
    stopAudio();
    speakAloud(fillLearner(script, useStore.getState().profile?.name));
    node.removeAttribute("src");
    return node;
  }
  return playUrl(asset(path));
}

/**
 * Play one clip, a file or the learner's own recording, on the shared element.
 * Only one sound plays at a time (review finding 7): a spoken line is cancelled and
 * the previous clip released first.
 */
export function playUrl(url: string): HTMLAudioElement {
  cancelSpeech();
  const next = replaceAudioElement();
  next.src = url;
  next.playbackRate = 1;
  void next.play().catch(() => {
    /* Autoplay can still reject if the gesture was lost. The button stays. */
  });
  return next;
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
