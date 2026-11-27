/**
 * Agent Delegator & Access Point
 * Coordinates dispatching work to external AI agents, webhooks, or the thinking brain (<115 lines).
 */
import { departmentDb, type ClientAgentTask } from "../database/departmentDb.ts";
import { thinkWithFreeAi } from "../brain/thinkingBrain.ts";

export interface AgentEndpointConfig {
  endpointUrl?: string; // Optional custom external agent webhook (e.g. MCP / LangChain / n8n)
  authToken?: string;
  autoExecute: boolean;
}

const SETTINGS_KEY = "friday_agent_endpoint_v1";

export function loadAgentConfig(): AgentEndpointConfig {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}"); } catch { return { autoExecute: true }; }
}

export function saveAgentConfig(cfg: Partial<AgentEndpointConfig>): AgentEndpointConfig {
  const current = { ...loadAgentConfig(), ...cfg };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  return current;
}

/** Check if user utterance asks to delegate a job to another agent */
export function extractAgentDelegation(text: string): { isDelegation: boolean; instruction: string } {
  const m = text.match(/^(?:tell|ask|instruct|delegate to|have|command) (?:the )?(?:ai )?agent (?:to )?(.+)/i)
    || text.match(/^(?:delegate task|run agent|agent task)[:,]?\s*(.+)/i);
  if (m && m[1].trim().length > 3) {
    return { isDelegation: true, instruction: m[1].trim() };
  }
  return { isDelegation: false, instruction: "" };
}

/** Access Point: Dispatches an instruction to external AI agents or thinking brain */
export async function dispatchAgentTask(instruction: string, title?: string): Promise<{ task: ClientAgentTask; reply: string }> {
  const cfg = loadAgentConfig();
  const task = departmentDb.createTask(instruction, cfg.endpointUrl ? "external_webhook" : "thinking_brain", title);

  // If custom agent webhook is provided, POST JSON to it
  if (cfg.endpointUrl) {
    try {
      departmentDb.updateTask(task.id, { status: "running" });
      const ctl = new AbortController();
      const tm = setTimeout(() => ctl.abort(), 12000);
      const res = await fetch(cfg.endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cfg.authToken ? { Authorization: `Bearer ${cfg.authToken}` } : {}) },
        body: JSON.stringify({ task_id: task.id, instruction }),
        signal: ctl.signal,
      });
      clearTimeout(tm);
      if (res.ok) {
        const data = await res.json();
        const resultText = data.reply || data.output || data.result || "External agent completed task.";
        departmentDb.updateTask(task.id, { status: "completed", result: resultText });
        return { task, reply: `Agent completed task: ${resultText}` };
      }
    } catch {
      // Fallback to internal thinking brain
    }
  }

  // Fallback: Use thinking brain as the specialist agent
  departmentDb.updateTask(task.id, { status: "running" });
  const brainAns = await thinkWithFreeAi(`Act as an autonomous AI agent. Complete this task and report results: ${instruction}`);
  const result = brainAns?.text ?? "Task queued for autonomous agent.";
  departmentDb.updateTask(task.id, { status: "completed", result });
  return { task, reply: `Agent processed task: ${result}` };
}
