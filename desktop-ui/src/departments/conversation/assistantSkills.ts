/**
 * Assistant Skills — offline utility features: time/date, calculator, focus timer, notes.
 * Each returns null when not applicable so the dialogue engine can try the next skill.
 */
import { getSlots, updateSlots } from "./conversationMemory.ts";
import { playEarcon } from "../sound/soothingSoundEngine.ts";
import { speakWithNaturalVoice } from "../sound/naturalTtsEngine.ts";

export interface SkillReply { readonly intent: string; readonly reply: string }

const WORD_OPS: [RegExp, string][] = [
  [/\b(times|multiplied by|into|x)\b/g, "*"], [/\b(plus|add|and)\b/g, "+"],
  [/\b(minus|less)\b/g, "-"], [/\b(divided by|by|over)\b/g, "/"],
];

export function timeDateSkill(t: string): SkillReply | null {
  const now = new Date();
  if (/\b(what('?s| is) the time|what time|time is it|current time)\b/.test(t)) {
    return { intent: "time_date_check", reply: `It's ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.` };
  }
  if (/\b(date|what day|which day|today'?s date)\b/.test(t)) {
    return { intent: "time_date_check", reply: `Today is ${now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.` };
  }
  return null;
}

export function mathSkill(t: string): SkillReply | null {
  const pct = t.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*of\s*(\d+(?:\.\d+)?)/);
  if (pct) {
    const v = (parseFloat(pct[1]) / 100) * parseFloat(pct[2]);
    return { intent: "math_calculate", reply: `${pct[1]}% of ${pct[2]} is ${+v.toFixed(4)}.` };
  }
  if (!/\b(calculate|what is|what's|how much is|compute|solve)\b|\d\s*[-+*/x]\s*\d/.test(t)) return null;
  let expr = t.replace(/\b(calculate|what is|what's|how much is|compute|solve|equals?)\b/g, "");
  for (const [re, op] of WORD_OPS) expr = expr.replace(re, op);
  expr = expr.replace(/[^0-9+\-*/().\s]/g, "").trim();
  if (!/\d\s*[+\-*/]\s*[\d(]/.test(expr)) return null;
  try {
    // Safe: only digits/operators survive the filter above.
    const v = Function(`"use strict";return (${expr})`)() as number;
    if (!Number.isFinite(v)) return null;
    return { intent: "math_calculate", reply: `${expr.replace(/\s+/g, " ")} = ${+v.toFixed(6)}.` };
  } catch { return null; }
}

let activeTimer: ReturnType<typeof setTimeout> | null = null;

export function timerSkill(t: string): SkillReply | null {
  if (/\b(cancel|stop) (the )?(timer|pomodoro)\b/.test(t)) {
    if (activeTimer) clearTimeout(activeTimer);
    activeTimer = null;
    return { intent: "timer_focus", reply: "Timer cancelled." };
  }
  if (!/\b(timer|pomodoro|focus|remind me in)\b/.test(t)) return null;
  const n = parseInt(t.match(/(\d+)/)?.[1] ?? (/pomodoro|focus/.test(t) ? "25" : "5"), 10);
  const secs = /second/.test(t) ? n : n * 60;
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    playEarcon("success");
    speakWithNaturalVoice(`Time's up! Your ${n} ${/second/.test(t) ? "second" : "minute"} timer is done. Take a breath.`);
    activeTimer = null;
  }, secs * 1000);
  return { intent: "timer_focus", reply: `Started a ${n} ${/second/.test(t) ? "second" : "minute"} timer. I'll chime when it's done.` };
}

export function notesSkill(t: string): SkillReply | null {
  const take = t.match(/^(?:take a note|note down|note that|make a note|remember that|write down)[:,]?\s*(.+)/);
  if (take) {
    updateSlots({ notes: [...getSlots().notes, take[1]].slice(-20) });
    return { intent: "voice_note", reply: `Noted: "${take[1]}".` };
  }
  if (/\b(read|show|what are) (my )?notes\b/.test(t)) {
    const notes = getSlots().notes;
    return { intent: "voice_note", reply: notes.length ? `You have ${notes.length} notes: ${notes.slice(-5).join("; ")}.` : "You have no notes yet." };
  }
  if (/\b(clear|delete) (my |all )?notes\b/.test(t)) {
    updateSlots({ notes: [] });
    return { intent: "voice_note", reply: "All notes cleared." };
  }
  return null;
}

export const ASSISTANT_SKILLS = [notesSkill, timerSkill, timeDateSkill, mathSkill];
