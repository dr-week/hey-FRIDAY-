/**
 * Google Sheets Realtime Feedback Sync (<75 lines)
 * Pipes voice feedback & reframing corrections directly to the Google Sheet.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

export const GOOGLE_SHEET_ID = "1PqGJWyTioDEPQBd6z9gVtv7BBAa2uKOpufLrsRuXYg0";

export function syncFeedbackToGoogleSheet(): { synced: number; sheetUrl: string } {
  const jsonlPath = join(process.cwd(), "data", "feedback", "training_feedback.jsonl");
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;

  if (!existsSync(jsonlPath)) {
    console.log("ℹ️ No local feedback logs found to sync.");
    return { synced: 0, sheetUrl };
  }

  const lines = readFileSync(jsonlPath, "utf-8").split("\n").filter(Boolean);
  let count = 0;

  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      const ts = item.timestamp || new Date().toISOString();
      const raw = (item.rawSpokenText || "").replace(/,/g, " ");
      const reframed = (item.reframedUtterance || item.normalizedText || "").replace(/,/g, " ");
      const intent = item.detectedIntent || "unknown";
      const rating = item.responseStatus || "unrated";
      const corrected = (item.correctedText || "").replace(/,/g, " ");
      const platform = "desktop_supervisor";

      const csvRow = `${ts},${raw},${reframed},${intent},${rating},${corrected},${platform}`;
      execSync(`/opt/antigravity/bin/gsheets mutate append ${GOOGLE_SHEET_ID} "Sheet1" "${csvRow}"`, {
        stdio: "pipe",
      });
      count++;
    } catch {
      // Continue next row
    }
  }

  console.log(`✅ Synced ${count} feedback rows to Google Sheet: ${sheetUrl}`);
  return { synced: count, sheetUrl };
}

if (import.meta.main) {
  syncFeedbackToGoogleSheet();
}
