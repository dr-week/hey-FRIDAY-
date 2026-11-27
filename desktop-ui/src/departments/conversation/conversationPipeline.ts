/**
 * Conversation Pipeline — FRIDAY the "access point":
 *   raw speech -> reframe -> follow-up resolution
 *   -> agent router walks departments in priority order (decision trace)
 *   -> learn new answers -> speak ONCE -> memory turn.
 */
import { reframeUtterance, type ReframeResult } from "../reframing/grammarReframer.ts";
import { addTurn, resolveFollowUp, updateSlots } from "./conversationMemory.ts";
import type { QueryResult } from "../../services/api.ts";
import { speakWithNaturalVoice, stopNaturalVoice } from "../sound/naturalTtsEngine.ts";
import { DEPARTMENTS } from "../agents/departmentRegistry.ts";
import type { RouteTraceStep } from "../agents/agentTypes.ts";
import { isKnowledgeQuestion } from "../knowledge/webKnowledge.ts";
import { learnKnowledge } from "../knowledge/knowledgeCache.ts";
import { departmentDb } from "../database/departmentDb.ts";

export interface PipelineResult extends QueryResult {
  readonly reframe: ReframeResult;
  readonly resolvedText: string;
  readonly trace: RouteTraceStep[];
}

type SpeechCbs = { readonly onSpeakStart?: () => void; readonly onSpeakEnd?: () => void };

const CITY_RE = /\b(?:in|at|for)\s+([a-z]+(?:\s[a-z]+)?)\s*\??$/i;
const FRIENDLY_UNKNOWN = [
  "Hmm, I couldn't find an answer to that. Could you say it another way?",
  "Sorry, I'm not sure yet. Try adding an AI key in the Brain tab so I can think harder.",
];

export async function runConversationTurn(raw: string, cbs?: SpeechCbs, depth = 0): Promise<PipelineResult> {
  const t0 = performance.now();
  const reframe = reframeUtterance(raw);
  const text = resolveFollowUp(reframe.reframed);
  const city = text.match(CITY_RE)?.[1];
  if (city && /weather|umbrella|rain|temperature/i.test(text)) updateSlots({ lastCity: city });

  const ctx = { raw, text, isQuestion: isKnowledgeQuestion(text) };
  const trace: RouteTraceStep[] = [];
  let answer = null;
  let dept = "fallback";
  for (const d of DEPARTMENTS) {
    const s = performance.now();
    if (!d.accepts(ctx)) { trace.push({ dept: d.id, result: "skipped", ms: 0 }); continue; }
    try { answer = await d.handle(ctx); } catch { answer = null; }
    trace.push({ dept: d.id, result: answer ? "answered" : "passed", ms: Math.round(performance.now() - s) });
    if (answer) { dept = d.id; break; }
  }

  if (answer?.runCommand && depth < 2) return runConversationTurn(answer.runCommand, cbs, depth + 1);
  const reply = answer?.reply ?? FRIENDLY_UNKNOWN[Math.floor(Math.random() * FRIENDLY_UNKNOWN.length)];
  if (answer?.learn) {
    learnKnowledge(text, reply, answer.source, dept);
    departmentDb.saveKnowledge({ query_pattern: text, answer: reply, category: dept, source: answer.source, confidence: 1.0, verified: false });
  }

  if (!answer?.alreadySpoken) {
    stopNaturalVoice();
    speakWithNaturalVoice(reply.replace(/\s*\(from [^)]+\)$/, ""), { onStart: cbs?.onSpeakStart, onEnd: cbs?.onSpeakEnd });
  }

  const intent = answer?.intent ?? "unknown";
  addTurn({ raw, reframed: text, reply, intent, reframeChanged: reframe.changed || text !== reframe.reframed });
  return {
    response: reply,
    isLocalBackend: Boolean(answer?.alreadySpoken),
    reframe, resolvedText: text, trace,
    meta: {
      ...(answer?.meta ?? {}),
      query: raw, normalizedQuery: text, intent, response: reply,
      latencyMs: Math.max(1, Math.round(performance.now() - t0)),
      modelUsed: `${dept}:${answer?.source ?? "none"}`,
      route: answer ? "auto" : "review", isDestructive: Boolean(answer?.meta?.isDestructive),
    },
  };
}
