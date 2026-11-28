/**
 * Agent Department contract — FRIDAY is the "access point" (orchestrator);
 * each department is a specialist agent she can delegate to.
 * Pattern adapted from multi-agent routers (semantic-router, CrewAI/LangGraph supervisor).
 */
import type { ExecutionTelemetryMeta } from "../../types/widget.ts";

export type DepartmentId =
  | "conversation"      // greetings, empathy, memory, built-in skills
  | "agent_delegation"  // tell external AI agents / webhooks to do jobs
  | "decisions"         // Microsoft/Windows environment decisions & safety
  | "memory"            // learned answers database
  | "tasks"             // Windows / desktop control (local Bun backend or browser Laya)
  | "communication"     // chatterbot-corpus phrase dictionary
  | "online_skills"     // live web APIs (HackerNews, Currency, Jokes)
  | "brain"             // free LLMs (Chrome Nano, Gemini, Groq, OpenRouter)
  | "knowledge";        // online search (Dictionary, DuckDuckGo, Wikipedia)

export interface AgentContext {
  readonly raw: string;
  readonly text: string;          // reframed + follow-up-resolved
  readonly isQuestion: boolean;
}

export interface AgentReply {
  readonly reply: string;
  readonly intent: string;
  readonly source: string;        // provider / model used
  readonly alreadySpoken?: boolean;
  readonly meta?: ExecutionTelemetryMeta;
  readonly runCommand?: string;   // ask the router to re-run with a new utterance
  readonly learn?: boolean;       // save into knowledge cache
}

export interface AgentDepartment {
  readonly id: DepartmentId;
  readonly label: string;
  /** Cheap gate so the router can skip departments without doing work. */
  readonly accepts: (ctx: AgentContext) => boolean;
  /** Return null to pass the request to the next department. */
  readonly handle: (ctx: AgentContext) => Promise<AgentReply | null>;
}

export interface RouteTraceStep { readonly dept: DepartmentId; readonly result: "skipped" | "passed" | "answered"; readonly ms: number }
