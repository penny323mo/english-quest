import manifest from "../../content/word-audio.json";

export const wordAudio: Record<string, { audio: string; audioSlow: string; say: string }> = manifest.items;
