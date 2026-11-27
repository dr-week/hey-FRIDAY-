import { Database } from "bun:sqlite";
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FeedbackLogEntry } from "../../core/types.ts";

/**
 * Voice & Framing Feedback Training Repository (Department: Persistence / RLHF)
 * Persists user feedback to SQLite AND appends training rows to `data/feedback/` (<115 lines).
 */
export class FeedbackRepository {
  private readonly db: Database;
  private readonly feedbackDir: string;

  constructor(db: Database, feedbackDir: string = "data/feedback") {
    this.db = db;
    this.feedbackDir = feedbackDir;
    if (!existsSync(this.feedbackDir)) {
      mkdirSync(this.feedbackDir, { recursive: true });
    }
  }

  public initTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS feedback_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raw_spoken_text TEXT NOT NULL,
        normalized_text TEXT NOT NULL,
        corrected_text TEXT,
        detected_intent TEXT NOT NULL,
        expected_intent TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        framing_status TEXT NOT NULL,
        wake_word_status TEXT NOT NULL,
        response_status TEXT NOT NULL,
        notes TEXT,
        source TEXT DEFAULT 'desktop-local',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public recordFeedback(entry: FeedbackLogEntry): FeedbackLogEntry {
    const createdAt = new Date().toISOString();
    this.db.run(
      `INSERT INTO feedback_logs (
        raw_spoken_text, normalized_text, corrected_text,
        detected_intent, expected_intent, ai_response,
        framing_status, wake_word_status, response_status, notes, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.rawSpokenText,
        entry.normalizedText,
        entry.correctedText ?? "",
        entry.detectedIntent,
        entry.expectedIntent,
        entry.aiResponse,
        entry.framingStatus,
        entry.wakeWordStatus,
        entry.responseStatus,
        entry.notes ?? "",
        entry.source ?? "desktop-local",
      ]
    );

    const saved: FeedbackLogEntry = { ...entry, createdAt };
    this.appendTrainingFiles(saved);
    return saved;
  }

  private appendTrainingFiles(entry: FeedbackLogEntry): void {
    try {
      const jsonlPath = join(this.feedbackDir, "training_feedback.jsonl");
      appendFileSync(jsonlPath, JSON.stringify(entry) + "\n", "utf-8");

      const csvPath = join(this.feedbackDir, "laya_training.csv");
      if (!existsSync(csvPath)) {
        writeFileSync(csvPath, "state,intent,framing_status,wake_word_status,response_status\n", "utf-8");
      }
      const trainingState = (entry.correctedText?.trim() || entry.normalizedText || entry.rawSpokenText).replace(/"/g, '""');
      const row = `"${trainingState}",${entry.expectedIntent},${entry.framingStatus},${entry.wakeWordStatus},${entry.responseStatus}\n`;
      appendFileSync(csvPath, row, "utf-8");
    } catch {
      // Best-effort file append
    }
  }

  public listFeedback(limit: number = 30): FeedbackLogEntry[] {
    const rows = this.db.query<Record<string, unknown>, [number]>(
      "SELECT * FROM feedback_logs ORDER BY id DESC LIMIT ?"
    ).all(limit);

    return rows.map((r) => ({
      id: Number(r.id),
      rawSpokenText: String(r.raw_spoken_text ?? ""),
      normalizedText: String(r.normalized_text ?? ""),
      correctedText: String(r.corrected_text ?? ""),
      detectedIntent: String(r.detected_intent ?? ""),
      expectedIntent: String(r.expected_intent ?? ""),
      aiResponse: String(r.ai_response ?? ""),
      framingStatus: (r.framing_status as FeedbackLogEntry["framingStatus"]) ?? "unrated",
      wakeWordStatus: (r.wake_word_status as FeedbackLogEntry["wakeWordStatus"]) ?? "unrated",
      responseStatus: (r.response_status as FeedbackLogEntry["responseStatus"]) ?? "unrated",
      notes: String(r.notes ?? ""),
      source: (r.source as FeedbackLogEntry["source"]) ?? "desktop-local",
      createdAt: String(r.created_at ?? ""),
    }));
  }
}
