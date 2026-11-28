import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { KnowledgeRepository } from "../src/services/db/knowledgeRepo.ts";
import { AgentTasksRepository } from "../src/services/db/agentTasksRepo.ts";
import { DecisionsRepository } from "../src/services/db/decisionsRepo.ts";
import { extractAgentDelegation } from "../desktop-ui/src/departments/agents/agentDelegator.ts";
import { evaluateEnvironmentDecision } from "../desktop-ui/src/departments/tasks/microsoftDecisions.ts";

test("agent delegation extraction", () => {
  const d1 = extractAgentDelegation("tell the AI agent to analyze this codebase");
  expect(d1.isDelegation).toBe(true);
  expect(d1.instruction).toBe("analyze this codebase");

  const d2 = extractAgentDelegation("delegate task: research quantum gravity");
  expect(d2.isDelegation).toBe(true);
  expect(d2.instruction).toBe("research quantum gravity");

  const d3 = extractAgentDelegation("what is the weather today");
  expect(d3.isDelegation).toBe(false);
});

test("microsoft environment decisions evaluation", () => {
  const s1 = evaluateEnvironmentDecision("save this to file notes.txt");
  expect(s1.isDecision).toBe(true);
  expect(s1.action).toBe("Save to file: notes.txt");
  expect(s1.risk).toBe("low");

  const s2 = evaluateEnvironmentDecision("decide to delete temporary cache files");
  expect(s2.isDecision).toBe(true);
  expect(s2.risk).toBe("high");
});

test("department database repositories (SQLite)", () => {
  const db = new Database(":memory:");
  const knowledge = new KnowledgeRepository(db);
  const tasks = new AgentTasksRepository(db);
  const decisions = new DecisionsRepository(db);

  knowledge.initTable();
  tasks.initTable();
  decisions.initTable();

  // Knowledge
  knowledge.recordKnowledge({
    query_pattern: "what is speed of light",
    answer: "Approximately 299,792,458 meters per second.",
    category: "science",
    source: "wikipedia",
    confidence: 1.0,
    hit_count: 1,
    verified: 1,
  });
  const k = knowledge.lookup("what is speed of light");
  expect(k?.answer).toContain("299,792,458");

  // Agent Tasks
  const t = tasks.createTask("run security audit", "security_agent", "Security Audit");
  expect(t.status).toBe("pending");
  tasks.updateStatus(t.id!, "completed", "Audit passed cleanly");
  const list = tasks.listTasks(10);
  expect(list[0].status).toBe("completed");

  // Decisions
  const dec = decisions.proposeDecision("Lock workstation", "Safe lock action", "low", "windows");
  expect(dec.status).toBe("pending");
  decisions.resolveDecision(dec.id!, true);
  const decList = decisions.listRecent(10);
  expect(decList[0].status).toBe("approved");

  db.close();
});

import { calendarSkill } from "../desktop-ui/src/departments/conversation/calendarSkill.ts";

test("google calendar skill and daily briefing", () => {
  const add = calendarSkill("schedule team standup at 10am");
  expect(add).not.toBeNull();
  expect(add?.intent).toBe("calendar_add");
  expect(add?.reply).toContain("team standup");

  const check = calendarSkill("what is my schedule today");
  expect(check).not.toBeNull();
  expect(check?.intent).toBe("calendar_check");
  expect(check?.reply).toContain("team standup");
});

import { matchOnlineSkill } from "../desktop-ui/src/departments/knowledge/onlineSkills.ts";

test("online web skills: tech news, currency, jokes", async () => {
  const news = await matchOnlineSkill("what is the tech news today");
  expect(news).not.toBeNull();
  expect(news?.intent).toBe("online_tech_news");
  expect(news?.reply).toContain("headlines");

  const curr = await matchOnlineSkill("convert 100 dollars to rupees");
  expect(curr).not.toBeNull();
  expect(curr?.intent).toBe("online_currency_convert");
  expect(curr?.reply).toContain("USD is currently equal to");

  const joke = await matchOnlineSkill("tell me a funny joke");
  expect(joke).not.toBeNull();
  expect(joke?.intent).toBe("online_joke");
});
