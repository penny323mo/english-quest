/** Profile name token. Content stores this; the screen fills in the signed-in name. */
export const LEARNER_TOKEN = "{{learner}}";
export const LEARNER_SPELL_TOKEN = "{{learner-spell}}";

/** Used only when onboarding stored no name. Content must not repeat it. */
export const FALLBACK_LEARNER = "阿琳";

export function learnerName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : FALLBACK_LEARNER;
}

export function spellLearner(name: string | null | undefined): string {
  return learnerName(name).replace(/\s+/g, "").toUpperCase().split("").join(" ");
}

export function fillLearner(text: string, name: string | null | undefined): string {
  if (!text.includes("{{")) return text;
  return text
    .split(LEARNER_SPELL_TOKEN)
    .join(spellLearner(name))
    .split(LEARNER_TOKEN)
    .join(learnerName(name));
}

export function needsRuntimeSpeech(script: string | undefined, runtimeTts?: boolean): boolean {
  if (runtimeTts) return true;
  if (!script) return false;
  return script.includes(LEARNER_TOKEN) || script.includes(LEARNER_SPELL_TOKEN);
}
