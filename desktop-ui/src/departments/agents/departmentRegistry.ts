/**
 * Department Registry — ORDER = decision priority (cheap/offline first, network last).
 * Coordinates specialist agents for conversation, memory, tasks, external agents, decisions, and online knowledge (<115 lines).
 */
import type { AgentDepartment } from "./agentTypes.ts";
import { respondConversationally } from "../conversation/dialogueEngine.ts";
import { matchCorpus } from "../conversation/communicationCorpus.ts";
import { recallKnowledge } from "../knowledge/knowledgeCache.ts";
import { searchOnline } from "../knowledge/webKnowledge.ts";
import { thinkWithFreeAi } from "../brain/thinkingBrain.ts";
import { sendQuery } from "../../services/api.ts";
import { extractAgentDelegation, dispatchAgentTask } from "./agentDelegator.ts";
import { evaluateEnvironmentDecision, executeFileSaveDecision, recordAndProposeDecision } from "../tasks/microsoftDecisions.ts";

const conversation: AgentDepartment = {
  id: "conversation", label: "Conversation & skills",
  accepts: () => true,
  handle: async ({ text }) => {
    const r = respondConversationally(text);
    return r ? { reply: r.reply, intent: r.intent, source: "dialogue_engine", runCommand: (r as any).runCommand } : null;
  },
};

const agentDelegation: AgentDepartment = {
  id: "agent_delegation", label: "Agent Access Point",
  accepts: ({ text }) => extractAgentDelegation(text).isDelegation,
  handle: async ({ text }) => {
    const { instruction } = extractAgentDelegation(text);
    const { reply } = await dispatchAgentTask(instruction);
    return { reply, intent: "agent_delegated", source: "agent_delegator" };
  },
};

const decisionsDepartment: AgentDepartment = {
  id: "decisions", label: "Microsoft & Windows Decisions",
  accepts: ({ text }) => evaluateEnvironmentDecision(text).isDecision,
  handle: async ({ text, raw }) => {
    const evalRes = evaluateEnvironmentDecision(text);
    recordAndProposeDecision(evalRes);
    if (evalRes.action.startsWith("Save to file:")) {
      const filename = evalRes.action.replace("Save to file:", "").trim();
      executeFileSaveDecision(filename, raw);
      return { reply: `Saved transcript to ${filename} on your computer.`, intent: "save_file", source: "microsoft_decisions" };
    }
    return {
      reply: `Decision proposed (${evalRes.risk} risk): "${evalRes.action}". You can review or approve it in the Agent Hub.`,
      intent: "decision_proposed",
      source: "microsoft_decisions",
    };
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
  conversation, agentDelegation, decisionsDepartment, memory, tasks, communicationExact, brain, knowledge, communicationFuzzy,
];
