import type { FridayAssistant } from "../../core/friday.ts";

/**
 * Department HTTP Routes Handler
 * Dispatches REST requests for Knowledge, Agent Tasks, and Microsoft Decisions (<85 lines).
 */
export async function handleDepartmentRoute(
  req: Request,
  url: URL,
  friday: FridayAssistant
): Promise<Response | null> {
  const db = (friday as any).db;
  if (!db) return null;

  // 1. Department Knowledge: GET list / POST record
  if (url.pathname === "/api/departments/knowledge") {
    if (req.method === "GET") {
      const limit = Number(url.searchParams.get("limit") || "50");
      return Response.json({ status: "ok", knowledge: db.knowledge.listAll(limit) });
    }
    if (req.method === "POST") {
      const body = await req.json();
      const saved = db.knowledge.recordKnowledge(body);
      return Response.json({ status: "ok", item: saved });
    }
  }

  // 2. Department Agent Tasks: GET list / POST create / PATCH update
  if (url.pathname === "/api/departments/agent-tasks") {
    if (req.method === "GET") {
      const limit = Number(url.searchParams.get("limit") || "30");
      return Response.json({ status: "ok", tasks: db.agentTasks.listTasks(limit) });
    }
    if (req.method === "POST") {
      const body = (await req.json()) as { instruction: string; targetAgent?: string; title?: string };
      const task = db.agentTasks.createTask(body.instruction, body.targetAgent, body.title);
      return Response.json({ status: "ok", task });
    }
    if (req.method === "PATCH") {
      const body = (await req.json()) as { id: number; status: any; result?: string };
      db.agentTasks.updateStatus(body.id, body.status, body.result);
      return Response.json({ status: "ok", message: "Task updated" });
    }
  }

  // 3. Department Decisions: GET list / POST propose / PATCH resolve
  if (url.pathname === "/api/departments/decisions") {
    if (req.method === "GET") {
      const limit = Number(url.searchParams.get("limit") || "30");
      return Response.json({ status: "ok", decisions: db.decisions.listRecent(limit) });
    }
    if (req.method === "POST") {
      const body = (await req.json()) as { action: string; details: string; risk?: any; env?: string };
      const item = db.decisions.proposeDecision(body.action, body.details, body.risk, body.env);
      return Response.json({ status: "ok", decision: item });
    }
    if (req.method === "PATCH") {
      const body = (await req.json()) as { id: number; approved: boolean };
      db.decisions.resolveDecision(body.id, body.approved);
      return Response.json({ status: "ok", message: "Decision resolved" });
    }
  }

  return null;
}
