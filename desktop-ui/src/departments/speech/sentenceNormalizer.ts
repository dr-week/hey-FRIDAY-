/**
 * Phonetic & Indian-English Sentence Framing Normalizer (Department: Speech / Framing)
 * Fixes common Windows/Web Speech ASR phonetic typos before wake-word and intent routing (<70 lines).
 */

const PHONETIC_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(hey\s+freddie|hay\s+friday|a\s+friday|he\s+friday|ok\s+friday|hi\s+friday|ay\s+friday|oye\s+friday)\b/gi, "hey friday"],
  [/\b(get|git|good|kit)\s+(statues|status|stat|stats)\b/gi, "git status"],
  [/\b(un\s+mute|on\s+mute)\b/gi, "unmute"],
  [/\b(newt|miute|moot)\s+(audio|sound|pc|computer)\b/gi, "mute audio"],
  [/\b(weather|whether|feather)\b/gi, "weather"],
  [/\b(run\s+bun\s+test|bun\s+tests|project\s+test|run\s+text)\b/gi, "run tests"],
  [/\b(lock\s+work\s+station|log\s+workstation|lock\s+walk\s+station)\b/gi, "lock workstation"],
  [/\b(recycle\s+been|recycle\s+bean)\b/gi, "recycle bin"],
  [/\b(screen\s+shot|screen\s+short)\b/gi, "screenshot"],
];

export interface NormalizationResult {
  readonly rawText: string;
  readonly normalizedText: string;
  readonly wasRepaired: boolean;
}

export function normalizeSpokenSentence(rawText: string): NormalizationResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { rawText: "", normalizedText: "", wasRepaired: false };
  }

  let current = trimmed;
  for (const [pattern, replacement] of PHONETIC_RULES) {
    current = current.replace(pattern, replacement);
  }
  const normalizedText = current.replace(/\s+/g, " ").trim();

  return {
    rawText: trimmed,
    normalizedText,
    wasRepaired: normalizedText.toLowerCase() !== trimmed.toLowerCase(),
  };
}
