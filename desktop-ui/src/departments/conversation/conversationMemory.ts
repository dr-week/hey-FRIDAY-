/**
 * Conversation Memory — rolling dialog state (last 10 turns + slots), persisted in localStorage.
 * Enables follow-ups: "weather in Goa" -> "what about Mumbai?" -> "do I need an umbrella there?"
 */

export interface ConversationTurn {
  readonly id: string;
  readonly at: number;
  readonly raw: string;
  readonly reframed: string;
  readonly reply: string;
  readonly intent: string;
  readonly reframeChanged: boolean;
}

export interface DialogSlots {
  userName?: string;
  lastCity?: string;
  lastIntent?: string;
  mood?: string;
  notes: string[];
}

const KEY = "friday_conversation_v1";
const MAX_TURNS = 10;

interface Store { turns: ConversationTurn[]; slots: DialogSlots }

function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "");
    if (s && Array.isArray(s.turns)) return { turns: s.turns, slots: { notes: [], ...s.slots } };
  } catch { /* first run */ }
  return { turns: [], slots: { notes: [] } };
}

let store: Store = typeof localStorage !== "undefined" ? load() : { turns: [], slots: { notes: [] } };
const listeners = new Set<() => void>();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* quota */ }
  listeners.forEach((l) => l());
};

export const getTurns = (): readonly ConversationTurn[] => store.turns;
export const getSlots = (): DialogSlots => store.slots;
export const lastTurn = (): ConversationTurn | undefined => store.turns[store.turns.length - 1];

export function subscribeConversation(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function updateSlots(patch: Partial<DialogSlots>): void {
  store = { ...store, slots: { ...store.slots, ...patch } };
  save();
}

export function addTurn(t: Omit<ConversationTurn, "id" | "at">): ConversationTurn {
  const turn: ConversationTurn = { ...t, id: crypto.randomUUID?.() ?? String(Date.now()), at: Date.now() };
  store = { ...store, turns: [...store.turns, turn].slice(-MAX_TURNS) };
  if (t.intent !== "smalltalk" && t.intent !== "unknown") store.slots.lastIntent = t.intent;
  save();
  return turn;
}

export function clearConversation(keepProfile = true): void {
  store = { turns: [], slots: keepProfile ? { notes: store.slots.notes, userName: store.slots.userName } : { notes: [] } };
  save();
}

/**
 * Resolve elliptical follow-ups using the dialog state.
 * "what about mumbai" (after weather) -> "what is the weather in mumbai"
 */
export function resolveFollowUp(text: string): string {
  const lower = text.toLowerCase().trim();
  const { lastIntent, lastCity } = store.slots;
  const about = lower.match(/^(and |then )?(what about|how about|and in|and|in)\s+(.+?)\??$/);
  if (about && lastIntent === "weather_check") return `what is the weather in ${about[3]}`;
  if (/\b(there|over there|that place)\b/.test(lower) && lastCity && /umbrella|rain|weather|hot|cold/.test(lower)) {
    return lower.replace(/\b(over there|that place|there)\b/, `in ${lastCity}`);
  }
  if (/^(again|do it again|repeat that|one more time|same again)\b/.test(lower)) {
    const prev = [...store.turns].reverse().find((t) => t.intent !== "smalltalk");
    if (prev) return prev.reframed;
  }
  if (/^(more|louder|even more)$/.test(lower) && lastIntent === "volume_up") return "increase volume";
  if (/^(less|softer|lower)$/.test(lower) && lastIntent === "volume_down") return "decrease volume";
  return text;
}
