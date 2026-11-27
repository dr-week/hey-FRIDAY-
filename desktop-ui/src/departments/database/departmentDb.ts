/**
 * Department Database (Client Persistence & Synchronization)
 * Unified structured storage for Knowledge, Agent Tasks, and Microsoft Decisions (<125 lines).
 */

export interface ClientKnowledgeItem {
  id: string;
  query_pattern: string;
  answer: string;
  category: string;
  source: string;
  confidence: number;
  hit_count: number;
  verified: boolean;
  created_at: number;
}

export interface ClientAgentTask {
  id: string;
  title: string;
  instruction: string;
  target_agent: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  created_at: number;
}

export interface ClientDecisionItem {
  id: string;
  action: string;
  environment: "windows" | "microsoft" | "cloud";
  risk_level: "low" | "medium" | "high";
  details: string;
  status: "pending" | "approved" | "rejected";
  created_at: number;
}

const STORAGE_KEYS = {
  knowledge: "friday_dept_knowledge_v1",
  tasks: "friday_dept_agent_tasks_v1",
  decisions: "friday_dept_decisions_v1",
};

function readStore<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function writeStore<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

export const departmentDb = {
  // 1. Knowledge Store
  getKnowledge: (): ClientKnowledgeItem[] => readStore<ClientKnowledgeItem>(STORAGE_KEYS.knowledge),
  saveKnowledge: (item: Omit<ClientKnowledgeItem, "id" | "created_at" | "hit_count">): ClientKnowledgeItem => {
    const list = readStore<ClientKnowledgeItem>(STORAGE_KEYS.knowledge);
    const existing = list.find((k) => k.query_pattern.toLowerCase() === item.query_pattern.toLowerCase());
    if (existing) {
      existing.answer = item.answer;
      existing.source = item.source;
      existing.hit_count++;
      writeStore(STORAGE_KEYS.knowledge, list);
      return existing;
    }
    const created: ClientKnowledgeItem = {
      ...item,
      id: crypto.randomUUID?.() ?? String(Date.now()),
      hit_count: 1,
      created_at: Date.now(),
    };
    writeStore(STORAGE_KEYS.knowledge, [created, ...list].slice(0, 500));
    return created;
  },
  toggleVerifyKnowledge: (id: string): void => {
    const list = readStore<ClientKnowledgeItem>(STORAGE_KEYS.knowledge);
    const hit = list.find((k) => k.id === id);
    if (hit) { hit.verified = !hit.verified; writeStore(STORAGE_KEYS.knowledge, list); }
  },

  // 2. Agent Tasks Store
  getTasks: (): ClientAgentTask[] => readStore<ClientAgentTask>(STORAGE_KEYS.tasks),
  createTask: (instruction: string, target_agent = "external_ai", title?: string): ClientAgentTask => {
    const list = readStore<ClientAgentTask>(STORAGE_KEYS.tasks);
    const task: ClientAgentTask = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      title: title || instruction.slice(0, 35),
      instruction,
      target_agent,
      status: "pending",
      created_at: Date.now(),
    };
    writeStore(STORAGE_KEYS.tasks, [task, ...list].slice(0, 100));
    return task;
  },
  updateTask: (id: string, patch: Partial<ClientAgentTask>): void => {
    const list = readStore<ClientAgentTask>(STORAGE_KEYS.tasks);
    const hit = list.find((t) => t.id === id);
    if (hit) { Object.assign(hit, patch); writeStore(STORAGE_KEYS.tasks, list); }
  },

  // 3. Decisions Store (Microsoft / Windows environment)
  getDecisions: (): ClientDecisionItem[] => readStore<ClientDecisionItem>(STORAGE_KEYS.decisions),
  proposeDecision: (action: string, details: string, risk: "low" | "medium" | "high" = "low", env: "windows" | "microsoft" | "cloud" = "windows"): ClientDecisionItem => {
    const list = readStore<ClientDecisionItem>(STORAGE_KEYS.decisions);
    const item: ClientDecisionItem = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      action, details, environment: env, risk_level: risk, status: "pending", created_at: Date.now(),
    };
    writeStore(STORAGE_KEYS.decisions, [item, ...list].slice(0, 100));
    return item;
  },
  resolveDecision: (id: string, approved: boolean): void => {
    const list = readStore<ClientDecisionItem>(STORAGE_KEYS.decisions);
    const hit = list.find((d) => d.id === id);
    if (hit) { hit.status = approved ? "approved" : "rejected"; writeStore(STORAGE_KEYS.decisions, list); }
  },
};
