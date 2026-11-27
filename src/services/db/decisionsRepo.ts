import type { Database } from "bun:sqlite";

export type DecisionStatus = "pending" | "approved" | "rejected" | "executed";
export type DecisionRisk = "low" | "medium" | "high";

export interface DecisionItem {
  id?: number;
  action: string;
  environment: string;
  risk_level: DecisionRisk;
  details: string;
  status: DecisionStatus;
  created_at?: string;
}

/**
 * Department: Environment Decisions Repository (SQLite)
 * Tracks decisions made or proposed for Windows / Microsoft environment (<90 lines).
 */
export class DecisionsRepository {
  constructor(private readonly db: Database) {}

  public initTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS department_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        environment TEXT DEFAULT 'windows',
        risk_level TEXT DEFAULT 'low',
        details TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public proposeDecision(action: string, details: string, risk: DecisionRisk = "low", env = "windows"): DecisionItem {
    this.db.run(
      `INSERT INTO department_decisions (action, environment, risk_level, details, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [action, env, risk, details]
    );
    const row = this.db.query<DecisionItem, []>(`SELECT * FROM department_decisions ORDER BY id DESC LIMIT 1`).get();
    return row!;
  }

  public resolveDecision(id: number, approved: boolean): void {
    this.db.run(
      `UPDATE department_decisions SET status = ? WHERE id = ?`,
      [approved ? "approved" : "rejected", id]
    );
  }

  public listRecent(limit = 30): DecisionItem[] {
    return this.db.query<DecisionItem, [number]>(
      `SELECT * FROM department_decisions ORDER BY id DESC LIMIT ?`
    ).all(limit);
  }
}
