import { speechActive } from "./audio-element";
import { useStore } from "./store";

export type SfxKind = "correct" | "wrong" | "complete" | "xp" | "streak" | "tap";

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let busyUntil = 0;

function ctor(): AudioCtor | null {
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext || w.webkitAudioContext || null;
}

function context(): AudioContext | null {
  try {
    const Ctor = ctor();
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function unlockSfx() {
  try {
    const c = context();
    if (c && c.state === "suspended") void c.resume().catch(() => undefined);
  } catch {
    /* Autoplay can stay blocked. Later taps try again. */
  }
}

function muted(): boolean {
  try {
    return useStore.getState().profile?.sound === false;
  } catch {
    return false;
  }
}

function tone(
  c: AudioContext,
  freq: number,
  t: number,
  dur: number,
  type: OscillatorType,
  gain: number,
) {
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp);
  amp.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function schedule(kind: SfxKind, c: AudioContext, t: number): number {
  if (kind === "correct") {
    tone(c, 523.25, t, 0.09, "sine", 0.06);
    tone(c, 659.25, t + 0.09, 0.12, "sine", 0.05);
    return 0.24;
  }
  if (kind === "wrong") {
    tone(c, 110, t, 0.2, "sine", 0.05);
    return 0.22;
  }
  if (kind === "tap") {
    tone(c, 880, t, 0.035, "square", 0.02);
    return 0.05;
  }
  if (kind === "xp") {
    tone(c, 988, t, 0.07, "sine", 0.04);
    tone(c, 1318, t + 0.07, 0.07, "sine", 0.04);
    tone(c, 1568, t + 0.14, 0.1, "sine", 0.035);
    return 0.26;
  }
  if (kind === "streak") {
    tone(c, 392, t, 0.22, "triangle", 0.05);
    return 0.24;
  }
  tone(c, 523.25, t, 0.12, "sine", 0.05);
  tone(c, 659.25, t + 0.14, 0.12, "sine", 0.05);
  tone(c, 783.99, t + 0.28, 0.12, "sine", 0.05);
  tone(c, 1046.5, t + 0.42, 0.18, "sine", 0.045);
  tone(c, 1568, t + 0.62, 0.1, "sine", 0.03);
  tone(c, 392, t + 0.7, 0.16, "triangle", 0.04);
  return 0.88;
}

export function playSfx(kind: SfxKind) {
  try {
    if (muted() || speechActive()) return;
    const c = context();
    if (!c) return;
    const run = () => {
      const now = c.currentTime;
      if (kind !== "tap" && now < busyUntil) return;
      if (muted() || speechActive()) return;
      const dur = schedule(kind, c, now);
      busyUntil = now + dur;
    };
    if (c.state === "suspended") {
      void c.resume().then(run).catch(() => undefined);
      return;
    }
    run();
  } catch {
    /* A blocked audio graph must not break the lesson. */
  }
}
