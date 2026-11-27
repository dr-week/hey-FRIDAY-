import { Database } from "bun:sqlite";
import type { FeedbackLogEntry, UserPreferences, VoiceMacro } from "../../core/types.ts";
import { MacroRepository } from "./macroRepo.ts";
import { FeedbackRepository } from "./feedbackRepo.ts";

/**
 * Primary SQLite Database Coordinator (Department: Persistence)
 * Delegates macro and feedback sub-departments while managing core preferences (<115 lines).
 */
export class FridayDatabase {
  private readonly db: Database;
  private readonly macros: MacroRepository;
  private readonly feedback: FeedbackRepository;

  constructor(filePath: string = "data/friday.sqlite") {
    this.db = new Database(filePath);
    this.macros = new MacroRepository(this.db);
    this.feedback = new FeedbackRepository(this.db);
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

    const defaultPrefs: UserPreferences = {
      defaultCity: "Tokyo",
      latitude: 35.6762,
      longitude: 139.6503,
      speechSpeed: 1.0,
    };

    const row = this.db.query("SELECT value FROM preferences WHERE key = 'user_prefs'").get();
    if (!row) {
      this.db.run("INSERT INTO preferences (key, value) VALUES ('user_prefs', ?)", [
        JSON.stringify(defaultPrefs),
      ]);
    }

    this.macros.initTable();
    this.feedback.initTable();
  }

  public getPreferences(): UserPreferences {
    const row = this.db
      .query<{ value: string }, [string]>("SELECT value FROM preferences WHERE key = ?")
      .get("user_prefs");
    if (!row) {
      throw new Error("Preferences table is uninitialized.");
    }
    return JSON.parse(row.value) as UserPreferences;
  }

  public updateCity(city: string, lat: number, lon: number): void {
    const current = this.getPreferences();
    const updated: UserPreferences = { ...current, defaultCity: city, latitude: lat, longitude: lon };
    this.db.run("UPDATE preferences SET value = ? WHERE key = 'user_prefs'", [JSON.stringify(updated)]);
  }

  public logDecision(query: string, intent: string, latencyMs: number): void {
    this.db.run("INSERT INTO decision_history (query, intent, latency_ms) VALUES (?, ?, ?)", [
      query,
      intent,
      latencyMs,
    ]);
  }

  public getRecentDecisions(limit: number = 5) {
    return this.db
      .query<{ query: string; intent: string; latency_ms: number; created_at: string }, [number]>(
        "SELECT query, intent, latency_ms, created_at FROM decision_history ORDER BY id DESC LIMIT ?"
      )
      .all(limit);
  }

  public saveMacro(triggerPhrase: string, steps: readonly string[], description?: string): VoiceMacro {
    return this.macros.saveMacro(triggerPhrase, steps, description);
  }

  public listMacros(): VoiceMacro[] {
    return this.macros.listMacros();
  }

  public findMatchingMacro(query: string): VoiceMacro | null {
    return this.macros.findMatchingMacro(query);
  }

  public recordFeedback(entry: FeedbackLogEntry): FeedbackLogEntry {
    return this.feedback.recordFeedback(entry);
  }

  public listFeedback(limit: number = 30): FeedbackLogEntry[] {
    return this.feedback.listFeedback(limit);
  }

  public close(): void {
    this.db.close();
  }
}
