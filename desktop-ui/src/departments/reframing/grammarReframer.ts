/**
 * Grammar Reframer — bag-of-concepts reconstruction for broken / scrambled English.
 * "today umbrella goa rain tell me" -> "Do I need an umbrella in Goa today?"
 */
import { cleanDisfluencies, type CleanResult } from "./disfluencyCleaner.ts";
import { normalizeSpokenSentence } from "../speech/sentenceNormalizer.ts";

interface ConceptFrame {
  readonly need: RegExp[];        // ALL must match (order-free)
  readonly frame: (t: string) => string;
}

const CITY_RE = /\b(goa|mumbai|delhi|pune|bangalore|bengaluru|chennai|kolkata|hyderabad|london|new york|tokyo|dubai)\b/i;
const city = (t: string) => {
  const m = t.match(CITY_RE)?.[1];
  return m ? m.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
};

const FRAMES: ConceptFrame[] = [
  { need: [/umbrella|rain|raining/], frame: (t) => `Do I need an umbrella${city(t) ? ` in ${city(t)}` : ""} today?` },
  { need: [/weather|temperature|hot|cold|mausam/], frame: (t) => `What is the weather${city(t) ? ` in ${city(t)}` : ""}?` },
  { need: [/sound|volume|audio|awaaz/, /loud|high|softer|low|less|kam|down|decrease|reduce/], frame: () => "Decrease the volume" },
  { need: [/sound|volume|audio|awaaz/, /up|increase|more|zyada|louder|raise/], frame: () => "Increase the volume" },
  { need: [/sound|volume|audio/, /off|mute|silent|band/], frame: () => "Mute audio" },
  { need: [/battery|charge|cpu|ram|memory|system/], frame: () => "Check system status" },
  { need: [/screen ?shot|capture|snap/], frame: () => "Take a screenshot" },
  { need: [/lock/, /pc|computer|laptop|screen|system/], frame: () => "Lock computer" },
  { need: [/git|repo|branch|commit/], frame: () => "Check git status" },
  { need: [/time|clock|samay|baje/], frame: () => "What time is it?" },
  { need: [/date|day|today'?s date|tarikh/], frame: () => "What is today's date?" },
  { need: [/timer|pomodoro|focus/], frame: (t) => `Set a ${t.match(/\d+/)?.[0] ?? "25"} minute focus timer` },
  { need: [/note|remember|yaad/], frame: (t) => t },
];

export interface ReframeResult extends CleanResult {
  readonly raw: string;
  readonly reframed: string;
  readonly changed: boolean;
  readonly usedConceptFrame: boolean;
}

/** Only apply concept frames to SHORT, ungrammatical inputs (no clear verb at start). */
const LOOKS_GRAMMATICAL = /^(what|who|when|where|why|how|is|are|do|does|can|could|will|set|take|open|mute|lock|check|tell|increase|decrease|turn|start|stop|play|remember|read|calculate)\b/i;

export function reframeUtterance(raw: string): ReframeResult {
  const clean = cleanDisfluencies(raw);
  let text = normalizeSpokenSentence(clean.cleaned).normalizedText.trim();
  text = text.replace(/^(hey |hi |ok |okay )?fri?day[,\s]*/i, "").trim();
  let usedConceptFrame = false;

  const words = text.split(/\s+/).length;
  if (text && !LOOKS_GRAMMATICAL.test(text) && words <= 14) {
    const lower = text.toLowerCase();
    const hit = FRAMES.find((f) => f.need.every((re) => re.test(lower)));
    if (hit) { text = hit.frame(lower); usedConceptFrame = true; }
  }
  // Remove leftover politeness tails: "tell me", "for me"
  text = text.replace(/\s+(tell me|for me|now)\s*$/i, "").trim();
  if (text) text = text[0].toUpperCase() + text.slice(1);

  const changed = text.toLowerCase().replace(/[^a-z0-9 ]/g, "") !== raw.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  return { ...clean, raw, reframed: text || raw, changed, usedConceptFrame };
}
