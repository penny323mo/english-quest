let el: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

export function audioElement(): HTMLAudioElement {
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

export function speechActive(): boolean {
  return Boolean(el && !el.paused && !el.ended);
}

export function stopAudio() {
  if (!el) return;
  el.pause();
  el.currentTime = 0;
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
