let el: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

function bind(node: HTMLAudioElement) {
  const ping = () => listeners.forEach((fn) => fn());
  node.addEventListener("timeupdate", ping);
  node.addEventListener("ended", ping);
  node.addEventListener("pause", ping);
  node.addEventListener("playing", ping);
  node.addEventListener("error", ping);
}

export function audioElement(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = "none";
    bind(el);
  }
  return el;
}

/**
 * Drop the live media element before a new clip.
 * WebKit (headless and iOS Safari) faults the media pipeline when one
 * element seeks or swaps src while the previous mp3 is still opening.
 * A fresh element keeps the old pipeline out of the next play().
 */
export function replaceAudioElement(): HTMLAudioElement {
  const prev = el;
  el = new Audio();
  el.preload = "none";
  bind(el);
  if (prev) releaseElement(prev);
  return el;
}

function releaseElement(node: HTMLAudioElement) {
  try {
    node.pause();
  } catch {
    /* The element can already be detached. */
  }
  node.removeAttribute("src");
  try {
    node.load();
  } catch {
    /* load() throws if the element was already destroyed. */
  }
}

export function subscribeAudio(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function speechActive(): boolean {
  return Boolean(el && !el.paused && !el.ended);
}

/** Stop any spoken line (runtime speech for lines with the learner's name). */
export function cancelSpeech() {
  if (typeof speechSynthesis === "undefined") return;
  try {
    speechSynthesis.cancel();
  } catch {
    /* speechSynthesis is missing in some WebKit builds. */
  }
}

export function stopAudio() {
  cancelSpeech();
  if (!el) return;
  try {
    el.pause();
  } catch {
    /* pause can throw if the media element is already gone. */
  }
  // Seeking before HAVE_METADATA crashes WebKit's player mid-lesson.
  if (el.readyState < 1) return;
  try {
    if (el.currentTime) el.currentTime = 0;
  } catch {
    /* InvalidStateError: metadata was dropped between the check and the seek. */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => stopAudio());
}

export function audioSnapshot(): { src: string; time: number; duration: number; paused: boolean } {
  const node = audioElement();
  return {
    src: node.currentSrc || node.src || "",
    time: node.currentTime || 0,
    duration: Number.isFinite(node.duration) ? node.duration : 0,
    paused: node.paused,
  };
}
