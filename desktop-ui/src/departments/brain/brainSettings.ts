/**
 * Brain Settings — user-owned keys for FREE "thinking" AI providers + cloud storage.
 * Stored ONLY in this browser's localStorage; never committed or sent to our servers.
 */

export type BrainProvider = "chrome_builtin" | "gemini" | "groq" | "openrouter";

export interface BrainSettings {
  enabled: boolean;
  order: BrainProvider[];
  geminiKey: string;
  geminiModel: string;
  groqKey: string;
  groqModel: string;
  openrouterKey: string;
  openrouterModel: string;
  driveClientId: string;
  autoSyncDrive: boolean;
}

/** Free tiers (Nov 2026): Gemini AI Studio, Groq, OpenRouter ":free" models, Chrome Prompt API. */
export const PROVIDER_INFO: Record<BrainProvider, { label: string; keyUrl: string }> = {
  chrome_builtin: { label: "Chrome built-in Gemini Nano (no key, offline)", keyUrl: "https://developer.chrome.com/docs/ai/prompt-api" },
  gemini: { label: "Google Gemini (free AI Studio key)", keyUrl: "https://aistudio.google.com/apikey" },
  groq: { label: "Groq Llama (free, ultra fast)", keyUrl: "https://console.groq.com/keys" },
  openrouter: { label: "OpenRouter :free models", keyUrl: "https://openrouter.ai/keys" },
};

const KEY = "friday_brain_settings_v1";

const DEFAULTS: BrainSettings = {
  enabled: true,
  order: ["chrome_builtin", "gemini", "groq", "openrouter"],
  geminiKey: "",
  geminiModel: "gemini-2.5-flash",
  groqKey: "",
  groqModel: "llama-3.1-8b-instant",
  openrouterKey: "",
  openrouterModel: "meta-llama/llama-3.3-70b-instruct:free",
  driveClientId: "",
  autoSyncDrive: false,
};

export function loadBrainSettings(): BrainSettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveBrainSettings(patch: Partial<BrainSettings>): BrainSettings {
  const next = { ...loadBrainSettings(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
