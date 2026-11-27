import { Database } from "bun:sqlite";
import type { VoiceMacro } from "../../core/types.ts";

/**
 * Learned Voice Macros Repository (Department: Persistence / Macros)
 * Stores & matches 0ms Atticus-style multi-step voice routines (<85 lines).
 */
export class MacroRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  public initTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS voice_macros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger_phrase TEXT UNIQUE NOT NULL,
        steps_json TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const macroCount = this.db.query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM voice_macros").get();
    if (!macroCount || macroCount.cnt === 0) {
      this.saveMacro(
        "focus mode",
        ["mute audio", "check git status"],
        "Mutes system audio and verifies git working tree status"
      );
      this.saveMacro(
        "standup prep",
        ["check system status", "check git status"],
        "Checks hardware RAM/battery health and git repository status"
      );
    }
  }

  public saveMacro(triggerPhrase: string, steps: readonly string[], description: string = "Custom voice macro"): VoiceMacro {
    const normalized = triggerPhrase.trim().toLowerCase();
    this.db.run(
      `INSERT INTO voice_macros (trigger_phrase, steps_json, description)
       VALUES (?, ?, ?)
       ON CONFLICT(trigger_phrase) DO UPDATE SET
         steps_json = excluded.steps_json,
         description = excluded.description`,
      [normalized, JSON.stringify(steps), description]
    );
    return { triggerPhrase: normalized, steps, description };
  }

  public listMacros(): VoiceMacro[] {
    const rows = this.db.query<
      { id: number; trigger_phrase: string; steps_json: string; description: string; created_at: string },
      []
    >("SELECT id, trigger_phrase, steps_json, description, created_at FROM voice_macros ORDER BY id ASC").all();

    return rows.map((r) => ({
      id: r.id,
      triggerPhrase: r.trigger_phrase,
      steps: JSON.parse(r.steps_json) as string[],
      description: r.description,
      createdAt: r.created_at,
    }));
  }

  public findMatchingMacro(query: string): VoiceMacro | null {
    const normalized = query
      .trim()
      .toLowerCase()
      .replace(/^(hey\s+friday|friday|activate|run|start|enable)[\s,]+/i, "")
      .replace(/[.!?]+$/, "")
      .trim();

    for (const m of this.listMacros()) {
      if (normalized === m.triggerPhrase || query.toLowerCase().includes(m.triggerPhrase)) {
        return m;
      }
    }
    return null;
  }
}
