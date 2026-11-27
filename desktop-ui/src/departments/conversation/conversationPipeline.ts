/**
 * Conversation Pipeline — the single entry point for every utterance:
 *   raw speech -> reframe (disfluency + grammar) -> follow-up resolution
 *   -> dialogue/skills (local) OR desktop command router (backend / browser Laya)
 *   -> memory turn.
 */
import { reframeUtterance, type ReframeResult } from "../reframing/grammarReframer.ts";
import { addTurn, resolveFollowUp, updateSlots } from "./conversationMemory.ts";
import { respondConversationally } from "./dialogueEngine.ts";
import { sendQuery, type QueryResult } from "../../services/api.ts";
import { thinkWithFreeAi } from "../brain/thinkingBrain.ts";
import { matchCorpus } from "./communicationCorpus.ts";
import { speakWithNaturalVoice, stopNaturalVoice } from "../sound/naturalTtsEngine.ts";

export interface PipelineResult extends QueryResult {
  readonly reframe: ReframeResult;
  readonly resolvedText: string;
}

type SpeechCbs = { readonly onSpeakStart?: () => void; readonly onSpeakEnd?: () => void };

const CITY_RE = /\b(?:in|at|for)\s+([a-z]+(?:\s[a-z]+)?)\s*\??$/i;

const FRIENDLY_UNKNOWN = [
  "Hmm, I didn't quite get that. Could you say it another way?",
  "Sorry, I'm not sure what you mean yet. Try 'what can you do'.",
];

export async function runConversationTurn(raw: string, cbs?: SpeechCbs): Promise<PipelineResult> {
  const t0 = performance.now();
  const reframe = reframeUtterance(raw);
  const resolvedText = resolveFollowUp(reframe.reframed);

  const city = resolvedText.match(CITY_RE)?.[1];
  if (city && /weather|umbrella|rain|temperature/i.test(resolvedText)) updateSlots({ lastCity: city });

  const chat = respondConversationally(resolvedText);
  if (chat?.runCommand) return runConversationTurn(chat.runCommand, cbs);

  let result: QueryResult;
  if (chat) {
    speakWithNaturalVoice(chat.reply, { onStart: cbs?.onSpeakStart, onEnd: cbs?.onSpeakEnd });
    result = {
      response: chat.reply,
      isLocalBackend: false,
      meta: {
        query: raw, normalizedQuery: resolvedText, intent: chat.intent, response: chat.reply,
        latencyMs: Math.max(1, Math.round(performance.now() - t0)), modelUsed: "friday_dialogue_engine",
        route: "auto", isDestructive: false,
      },
    };
  } else {
    result = await sendQuery(resolvedText, cbs);
    if (result.meta?.intent === "unknown") {
      const exact = await matchCorpus(resolvedText, 0.85);
      const brain = exact ? null : await thinkWithFreeAi(resolvedText);
      const fuzzy = exact ?? (brain ? null : await matchCorpus(resolvedText, 0.5));
      const reply = brain?.text ?? fuzzy?.reply ?? FRIENDLY_UNKNOWN[Math.floor(Math.random() * FRIENDLY_UNKNOWN.length)];
      const intent = brain ? "ai_thinking" : fuzzy ? `chat_${fuzzy.category}` : "unknown";
      const modelUsed = brain?.provider ?? (fuzzy ? "communication_corpus" : result.meta.modelUsed);
      stopNaturalVoice();
      speakWithNaturalVoice(reply, { onStart: cbs?.onSpeakStart, onEnd: cbs?.onSpeakEnd });
      result = { ...result, response: reply, meta: { ...result.meta, response: reply, intent, modelUsed } };
    }
  }

  addTurn({
    raw, reframed: resolvedText, reply: result.response,
    intent: result.meta?.intent ?? "unknown", reframeChanged: reframe.changed || resolvedText !== reframe.reframed,
  });
  return { ...result, reframe, resolvedText };
}
