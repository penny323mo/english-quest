"""Selection gate for a word take and its perturbed copies (no acoustic fallback)."""
from check_audio_asr import compare_word, needs_parakeet


def judge_take(lemma: str, whispers: list[str], parakeet: str | None, alts=()) -> dict:
    """Parakeet must hear the word once. Each Whisper variant must either match or
    repeat only the target word. A different word, prefix or missing model fails.
    Keep every transcript so selection can be audited, including failed attempts.
    """
    decisions = [
        "whisper" if not compare_word(lemma, heard, alts)
        else "parakeet" if needs_parakeet(lemma, heard) else "failed"
        for heard in whispers
    ]
    para_ok = parakeet is not None and not compare_word(lemma, parakeet, alts)
    accepted = bool(whispers) and para_ok and "failed" not in decisions
    return {
        "accepted": bool(accepted),
        "verdict": ("parakeet" if "parakeet" in decisions else "whisper") if accepted else "failed",
        "whisper": whispers, "parakeet": parakeet, "variants": decisions,
    }
