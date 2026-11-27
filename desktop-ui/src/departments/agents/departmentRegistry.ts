/**
 * Department Registry — ORDER = decision priority (cheap/offline first, network last).
 */
import type { AgentDepartment } from "./agentTypes.ts";
import { respondConversationally } from "../conversation/dialogueEngine.ts";
import { matchCorpus } from "../conversation/communicationCorpus.ts";
import { recallKnowledge } from "../knowledge/knowledgeCache.ts";
import { searchOnline } from "../knowledge/webKnowledge.ts";
import { thinkWithFreeAi } from "../brain/thinkingBrain.ts";
import { sendQuery } from "../../services/api.ts";

const conversation: AgentDepartment = {
  id: "conversation", label: "Conversation & skills",
  accepts: () => true,
  handle: async ({ text }) => {
    const r = respondConversationally(text);
    return r ? { reply: r.reply, intent: r.intent, source: "dialogue_engine", runCommand: (r as any).runCommand } : null;
  },
};

const memory: AgentDepartment = {
  id: "memory", label: "Learned answers",
  accepts: () => true,
  handle: async ({ text }) => {
    const k = recallKnowledge(text);
    return k ? { reply: k.a, intent: `recall_${k.dept}`, source: `memory:${k.source}` } : null;
  },
};

const tasks: AgentDepartment = {
  id: "tasks", label: "Desktop tasks",
  accepts: () => true,
  handle: async ({ text }) => {
    const r = await sendQuery(text, { silent: true });
    if (!r.meta || r.meta.intent === "unknown") return null;
    return { reply: r.response, intent: r.meta.intent, source: r.meta.modelUsed, meta: r.meta, alreadySpoken: r.isLocalBackend };
  },
};

const communicationExact: AgentDepartment = {
  id: "communication", label: "Phrase dictionary",
  accepts: () => true,
  handle: async ({ text }) => {
    const m = await matchCorpus(text, 0.85);
    return m ? { reply: m.reply, intent: `chat_${m.category}`, source: "chatterbot_corpus" } : null;
  },
};

const brain: AgentDepartment = {
  id: "brain", label: "Free AI thinking",
  accepts: () => true,
  handle: async ({ text }) => {
    const b = await thinkWithFreeAi(text);
    return b ? { reply: b.text, intent: "ai_thinking", source: b.provider, learn: true } : null;
  },
};

const knowledge: AgentDepartment = {
  id: "knowledge", label: "Online search",
  accepts: ({ isQuestion }) => isQuestion,
  handle: async ({ text }) => {
    const w = await searchOnline(text);
    return w ? { reply: `${w.text} (from ${w.source})`, intent: "web_search", source: w.source, learn: true } : null;
  },
};

const communicationFuzzy: AgentDepartment = {
  ...communicationExact,
  handle: async ({ text }) => {
    const m = await matchCorpus(text, 0.5);
    return m ? { reply: m.reply, intent: `chat_${m.category}`, source: "chatterbot_corpus~" } : null;
  },
};

export const DEPARTMENTS: AgentDepartment[] = [
  conversation, memory, tasks, communicationExact, brain, knowledge, communicationFuzzy,
];
