/**
 * Free AI Providers — tiny fetch adapters. Each returns reply text or throws.
 */
import type { BrainSettings } from "./brainSettings.ts";

export interface ChatMsg { readonly role: "system" | "user" | "assistant"; readonly content: string }

const TIMEOUT_MS = 9000;

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<any> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Chrome 138+ Prompt API (Gemini Nano, on-device, free, no key). */
export async function askChromeBuiltin(msgs: ChatMsg[]): Promise<string> {
  const LM = (globalThis as any).LanguageModel;
  if (!LM) throw new Error("Chrome Prompt API unavailable");
  if ((await LM.availability?.()) === "unavailable") throw new Error("Gemini Nano not downloaded");
  const session = await LM.create({ initialPrompts: msgs.slice(0, -1) });
  try {
    return await session.prompt(msgs[msgs.length - 1].content);
  } finally {
    session.destroy?.();
  }
}

export async function askGemini(msgs: ChatMsg[], s: BrainSettings): Promise<string> {
  if (!s.geminiKey) throw new Error("no key");
  const system = msgs.find((m) => m.role === "system")?.content;
  const contents = msgs.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${s.geminiModel}:generateContent?key=${encodeURIComponent(s.geminiKey)}`;
  const data = await postJson(url, {
    contents,
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
  });
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
}

async function askOpenAiCompatible(url: string, key: string, model: string, msgs: ChatMsg[]): Promise<string> {
  if (!key) throw new Error("no key");
  const data = await postJson(url, { model, messages: msgs, max_tokens: 200, temperature: 0.7 }, {
    Authorization: `Bearer ${key}`,
  });
  return data?.choices?.[0]?.message?.content ?? "";
}

export const askGroq = (m: ChatMsg[], s: BrainSettings) =>
  askOpenAiCompatible("https://api.groq.com/openai/v1/chat/completions", s.groqKey, s.groqModel, m);

export const askOpenRouter = (m: ChatMsg[], s: BrainSettings) =>
  askOpenAiCompatible("https://openrouter.ai/api/v1/chat/completions", s.openrouterKey, s.openrouterModel, m);
