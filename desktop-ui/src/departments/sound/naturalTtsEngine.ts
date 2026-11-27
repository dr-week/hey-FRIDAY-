/**
 * Curated Natural Female Text-to-Speech & Conversational Persona Engine (Department: Sound / TTS)
 * Based on `readium/speech` (`HadrienGardeur/web-speech-recommended-voices`) and `leaonline/easy-speech`.
 * Ranks voices by natural quality (Neerja, Emma, Ava, Jenny, Aria, Google UK/US Female, Zira) (<135 lines).
 */

const VOICE_PREF_KEY = "hey_friday_preferred_tts_voice";

const CURATED_VOICE_PRIORITY: readonly string[] = [
  "Microsoft Neerja Online (Natural)",
  "Microsoft EmmaMultilingual Online (Natural)",
  "Microsoft AvaMultilingual Online (Natural)",
  "Microsoft Jenny Online (Natural)",
  "Microsoft Aria Online (Natural)",
  "Google UK English Female",
  "Google US English",
  "Microsoft Heera",
  "Microsoft Zira",
  "Samantha",
];

const WAKE_GREETINGS: readonly string[] = [
  "Yes? I'm listening.",
  "I'm here! How can I help?",
  "Awake and listening.",
  "Ready when you are.",
];

export function listAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function selectBestFemaleVoice(preferredName?: string): SpeechSynthesisVoice | null {
  const voices = listAvailableVoices();
  if (voices.length === 0) return null;

  const savedName = preferredName || (typeof window !== "undefined" ? window.localStorage.getItem(VOICE_PREF_KEY) : null);
  if (savedName) {
    const exact = voices.find((v) => v.name === savedName);
    if (exact) return exact;
  }

  for (const priorityName of CURATED_VOICE_PRIORITY) {
    const match = voices.find((v) => v.name.toLowerCase().includes(priorityName.toLowerCase()));
    if (match) return match;
  }

  const anyEnglishFemale = voices.find(
    (v) => v.lang.startsWith("en") && /female|neerja|zira|aria|jenny|emma|ava|samantha|google/i.test(v.name)
  );
  return anyEnglishFemale || voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

export function setPreferredVoiceName(voiceName: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VOICE_PREF_KEY, voiceName);
  }
}

export function getPreferredVoiceName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(VOICE_PREF_KEY) || "";
}

export function getCuteWakeGreeting(): string {
  const idx = Math.floor(Math.random() * WAKE_GREETINGS.length);
  return WAKE_GREETINGS[idx] || "Yes? I'm listening.";
}

/**
 * Adds warm, conversational personality to system replies before speaking
 */
export function humanizeAssistantReply(rawReply: string, intent?: string): string {
  if (!rawReply) return "Done!";
  if (intent === "system_volume_mute") return "Done! I've toggled your audio mute.";
  if (intent === "system_screenshot") return "Got it! I captured your screen and saved it to Pictures.";
  if (intent === "dev_git_status" && rawReply.includes("clean")) {
    return "Your Git working tree is spotless with zero uncommitted changes.";
  }
  return rawReply;
}

export function speakWithNaturalVoice(
  text: string,
  callbacks?: {
    readonly onStart?: () => void;
    readonly onEnd?: () => void;
  }
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    callbacks?.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const chosen = selectBestFemaleVoice();
    if (chosen) {
      utterance.voice = chosen;
      utterance.lang = chosen.lang;
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 1.03;
    utterance.pitch = 1.06; // Slightly warm, friendly inflection
    utterance.onstart = () => callbacks?.onStart?.();
    utterance.onend = () => callbacks?.onEnd?.();
    utterance.onerror = () => callbacks?.onEnd?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    callbacks?.onEnd?.();
  }
}

export function stopNaturalVoice(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
