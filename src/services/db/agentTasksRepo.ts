import type { Database } from "bun:sqlite";

export type AgentTaskStatus = "pending" | "running" | "completed" | "failed";

export interface AgentTaskItem {
  id?: number;
  title: string;
  instruction: string;
  target_agent: string;
  status: AgentTaskStatus;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Department: Agent Tasks Repository (SQLite)
 * Tracks delegated jobs sent to external AI agents and worker processes (<90 lines).
 */
export class AgentTasksRepository {
  constructor(private readonly db: Database) {}

  public initTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS department_agent_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        instruction TEXT NOT NULL,
        target_agent TEXT DEFAULT 'external_ai',
        status TEXT DEFAULT 'pending',
        result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_agent_status ON department_agent_tasks(status);
    `);
  }

  public createTask(instruction: string, targetAgent = "external_ai", title?: string): AgentTaskItem {
    const taskTitle = title || instruction.slice(0, 40);
    this.db.run(
      `INSERT INTO department_agent_tasks (title, instruction, target_agent, status)
       VALUES (?, ?, ?, 'pending')`,
      [taskTitle, instruction, targetAgent]
    );
    const row = this.db.query<AgentTaskItem, []>(`SELECT * FROM department_agent_tasks ORDER BY id DESC LIMIT 1`).get();
    return row!;
  }

  public updateStatus(id: number, status: AgentTaskStatus, result?: string): void {
    this.db.run(
      `UPDATE department_agent_tasks
       SET status = ?, result = COALESCE(?, result), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, result ?? null, id]
    );
  }

  public listTasks(limit = 30): AgentTaskItem[] {
    return this.db.query<AgentTaskItem, [number]>(
      `SELECT * FROM department_agent_tasks ORDER BY id DESC LIMIT ?`
    ).all(limit);
  }
}
