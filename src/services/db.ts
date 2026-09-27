import { Database } from "bun:sqlite";
import type { UserPreferences } from "../core/types.ts";

export class FridayDatabase {
  private readonly db: Database;

  constructor(filePath: string = "data/friday.sqlite") {
    this.db = new Database(filePath);
    this.initTables();
  }

  private initTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS decision_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        intent TEXT NOT NULL,
        latency_ms REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default preferences if not existing
    const defaultPrefs: UserPreferences = {
      defaultCity: "Tokyo",
      latitude: 35.6762,
      longitude: 139.6503,
      speechSpeed: 1.0,
    };

    const row = this.db.query("SELECT value FROM preferences WHERE key = 'user_prefs'").get();
    if (!row) {
      this.db.run(
        "INSERT INTO preferences (key, value) VALUES ('user_prefs', ?)",
        [JSON.stringify(defaultPrefs)]
      );
    }
  }

  public getPreferences(): UserPreferences {
    const row = this.db.query<{ value: string }, [string]>(
      "SELECT value FROM preferences WHERE key = ?"
    ).get("user_prefs");

    if (!row) {
      throw new Error("Preferences table is uninitialized.");
    }
    return JSON.parse(row.value) as UserPreferences;
  }

  public updateCity(city: string, lat: number, lon: number): void {
    const current = this.getPreferences();
    const updated: UserPreferences = {
      ...current,
      defaultCity: city,
      latitude: lat,
      longitude: lon,
    };
    this.db.run(
      "UPDATE preferences SET value = ? WHERE key = 'user_prefs'",
      [JSON.stringify(updated)]
    );
  }

  public logDecision(query: string, intent: string, latencyMs: number): void {
    this.db.run(
      "INSERT INTO decision_history (query, intent, latency_ms) VALUES (?, ?, ?)",
      [query, intent, latencyMs]
    );
  }

  public getRecentDecisions(limit: number = 5): Array<{ query: string; intent: string; latency_ms: number; created_at: string }> {
    return this.db.query<
      { query: string; intent: string; latency_ms: number; created_at: string },
      [number]
    >("SELECT query, intent, latency_ms, created_at FROM decision_history ORDER BY id DESC LIMIT ?").all(limit);
  }

  public close(): void {
    this.db.close();
  }
}
