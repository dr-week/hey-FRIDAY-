/**
 * Personal Voice Profile & Custom Wake Alias Manager (Department: Calibration)
 * Lets the user speak "Hey Friday" 3 times to save how their browser/accent
 * transcribes their voice, plus custom command phrase mappings (<105 lines).
 */

const PROFILE_STORAGE_KEY = "hey_friday_voice_profile_v2";

export interface CustomPhraseMapping {
  readonly spokenPhrase: string;
  readonly targetCommand: string;
}

export interface VoiceProfileData {
  readonly wakeAliases: readonly string[];
  readonly customMappings: readonly CustomPhraseMapping[];
  readonly requireWakeWord: boolean;
  readonly speechLang: "en-IN" | "en-US" | "en-GB";
  readonly calibratedCount: number;
}

const DEFAULT_VOICE_PROFILE: VoiceProfileData = {
  wakeAliases: ["hey friday", "friday", "ok friday", "hi friday", "hey freddie", "hay friday"],
  customMappings: [],
  requireWakeWord: false, // Default to direct response so testing on web never silently drops user speech!
  speechLang: "en-IN",
  calibratedCount: 0,
};

export function loadVoiceProfile(): VoiceProfileData {
  if (typeof window === "undefined") return DEFAULT_VOICE_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_PROFILE;
    const parsed = JSON.parse(raw) as Partial<VoiceProfileData>;
    return {
      wakeAliases: parsed.wakeAliases?.length ? parsed.wakeAliases : DEFAULT_VOICE_PROFILE.wakeAliases,
      customMappings: parsed.customMappings ?? [],
      requireWakeWord: parsed.requireWakeWord ?? false,
      speechLang: parsed.speechLang ?? "en-IN",
      calibratedCount: parsed.calibratedCount ?? 0,
    };
  } catch {
    return DEFAULT_VOICE_PROFILE;
  }
}

export function saveVoiceProfile(profile: VoiceProfileData): VoiceProfileData {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }
  }
  return profile;
}

export function learnWakeWordSample(rawSpokenSample: string): VoiceProfileData {
  const current = loadVoiceProfile();
  const cleaned = rawSpokenSample
    .trim()
    .toLowerCase()
    .replace(/[.!?,]+$/g, "")
    .trim();

  if (!cleaned) return current;

  // Extract first 1-2 words as wake alias if user said a longer sentence
  const words = cleaned.split(/\s+/);
  const aliasCandidate = words.slice(0, Math.min(2, words.length)).join(" ");

  const nextAliases = Array.from(new Set([...current.wakeAliases, cleaned, aliasCandidate]));
  return saveVoiceProfile({
    ...current,
    wakeAliases: nextAliases,
    calibratedCount: current.calibratedCount + 1,
  });
}

export function addCustomPhraseMapping(spokenPhrase: string, targetCommand: string): VoiceProfileData {
  const current = loadVoiceProfile();
  const cleanPhrase = spokenPhrase.trim().toLowerCase();
  if (!cleanPhrase) return current;

  const filtered = current.customMappings.filter((m) => m.spokenPhrase !== cleanPhrase);
  return saveVoiceProfile({
    ...current,
    customMappings: [{ spokenPhrase: cleanPhrase, targetCommand }, ...filtered],
  });
}

export function resetVoiceProfile(): VoiceProfileData {
  return saveVoiceProfile(DEFAULT_VOICE_PROFILE);
}
