import type { Database } from "bun:sqlite";

export interface KnowledgeItem {
  id?: number;
  query_pattern: string;
  answer: string;
  category: string;
  source: string;
  confidence: number;
  hit_count: number;
  verified: number;
  created_at?: string;
}

/**
 * Department: Knowledge Database Repository (SQLite)
 * Manages learned Q&A pairs from web search, AI thinking, and users (<90 lines).
 */
export class KnowledgeRepository {
  constructor(private readonly db: Database) {}

  public initTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS department_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_pattern TEXT UNIQUE NOT NULL,
        answer TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        source TEXT DEFAULT 'online_search',
        confidence REAL DEFAULT 1.0,
        hit_count INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_knowledge_query ON department_knowledge(query_pattern);
    `);
  }

  public recordKnowledge(item: Omit<KnowledgeItem, "id" | "created_at">): KnowledgeItem {
    const norm = item.query_pattern.toLowerCase().trim();
    this.db.run(
      `INSERT INTO department_knowledge (query_pattern, answer, category, source, confidence, hit_count, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(query_pattern) DO UPDATE SET
         answer = excluded.answer,
         hit_count = department_knowledge.hit_count + 1,
         source = excluded.source`,
      [norm, item.answer, item.category, item.source, item.confidence, item.hit_count, item.verified]
    );
    return { ...item, query_pattern: norm };
  }

  public lookup(query: string): KnowledgeItem | null {
    const norm = query.toLowerCase().trim();
    const row = this.db
      .query<KnowledgeItem, [string]>(
        `SELECT * FROM department_knowledge WHERE query_pattern = ? OR ? LIKE '%' || query_pattern || '%' LIMIT 1`
      )
      .get(norm, norm);
    if (row) {
      this.db.run(`UPDATE department_knowledge SET hit_count = hit_count + 1 WHERE id = ?`, [row.id]);
    }
    return row ?? null;
  }

  public listAll(limit = 50): KnowledgeItem[] {
    return this.db.query<KnowledgeItem, [number]>(
      `SELECT * FROM department_knowledge ORDER BY hit_count DESC, id DESC LIMIT ?`
    ).all(limit);
  }

  public verify(id: number, verified = true): void {
    this.db.run(`UPDATE department_knowledge SET verified = ? WHERE id = ?`, [verified ? 1 : 0, id]);
  }
}
