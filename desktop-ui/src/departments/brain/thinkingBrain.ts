/**
 * Thinking Brain — fallback chain over free AI providers with conversation context.
 * Used only when the offline dialogue engine + command router can't answer.
 */
import { loadBrainSettings, type BrainProvider } from "./brainSettings.ts";
import { askChromeBuiltin, askGemini, askGroq, askOpenRouter, type ChatMsg } from "./freeAiProviders.ts";
import { getSlots, getTurns } from "../conversation/conversationMemory.ts";

const SYSTEM_PROMPT = [
  "You are FRIDAY, a warm, witty female desktop voice assistant.",
  "Replies are SPOKEN aloud: 1-3 short sentences, no markdown, no lists, no emojis.",
  "The user speaks Indian English via speech-to-text; silently fix mis-hearings and infer intent.",
  "If asked to control the PC, say what you'd do in one sentence.",
].join(" ");

export interface BrainAnswer { readonly text: string; readonly provider: BrainProvider }

const ADAPTERS = {
  chrome_builtin: (m: ChatMsg[]) => askChromeBuiltin(m),
  gemini: askGemini,
  groq: askGroq,
  openrouter: askOpenRouter,
} as const;

function buildMessages(userText: string): ChatMsg[] {
  const slots = getSlots();
  const facts = [
    slots.userName && `User's name: ${slots.userName}.`,
    slots.mood && `User mood: ${slots.mood}.`,
    slots.lastCity && `Last city mentioned: ${slots.lastCity}.`,
    `Local time: ${new Date().toLocaleString()}.`,
  ].filter(Boolean).join(" ");
  const history: ChatMsg[] = getTurns().slice(-6).flatMap((t) => [
    { role: "user" as const, content: t.reframed },
    { role: "assistant" as const, content: t.reply },
  ]);
  return [{ role: "system", content: `${SYSTEM_PROMPT} ${facts}` }, ...history, { role: "user", content: userText }];
}

export async function thinkWithFreeAi(userText: string): Promise<BrainAnswer | null> {
  const s = loadBrainSettings();
  if (!s.enabled) return null;
  const msgs = buildMessages(userText);
  for (const provider of s.order) {
    try {
      const text = (await ADAPTERS[provider](msgs, s)).replace(/[*#_`]/g, "").trim();
      if (text) return { text, provider };
    } catch {
      // try next provider in the chain
    }
  }
  return null;
}

/** Quick connectivity test for the settings card. */
export async function testProvider(provider: BrainProvider): Promise<string> {
  try {
    const out = await ADAPTERS[provider](buildMessages("Say hi in five words."), loadBrainSettings());
    return out ? `✅ ${out.slice(0, 60)}` : "⚠️ empty reply";
  } catch (e) {
    return `❌ ${(e as Error).message.slice(0, 60)}`;
  }
}
