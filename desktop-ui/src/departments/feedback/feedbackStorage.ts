import type { FeedbackLogItem } from "../../types/widget.ts";

/**
 * Feedback & RLHF Training Storage Manager (Department: Feedback / Dataset Export)
 * Persists feedback logs in browser localStorage (for GitHub Pages) AND syncs to
 * local Bun backend (`http://127.0.0.1:4141/api/feedback`) when running on desktop (<115 lines).
 */

const STORAGE_KEY = "hey_friday_feedback_logs_v2";
const API_BASE = "http://127.0.0.1:4141";

export function loadLocalFeedbackLogs(): FeedbackLogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FeedbackLogItem[];
  } catch {
    return [];
  }
}

export async function recordFeedbackLog(entry: FeedbackLogItem): Promise<FeedbackLogItem[]> {
  const stamped: FeedbackLogItem = {
    ...entry,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };

  const existing = loadLocalFeedbackLogs();
  const updated = [stamped, ...existing].slice(0, 250);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }

  // Also attempt to push to local Bun SQLite + data/feedback/training_feedback.jsonl
  try {
    await fetch(`${API_BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stamped),
    });
  } catch {
    // Running on GitHub Pages (serverless mode) — stored safely in localStorage
  }

  return updated;
}

export function clearLocalFeedbackLogs(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function downloadLayaTrainingCsv(logs: readonly FeedbackLogItem[]): void {
  const header = "state,intent,framing_status,wake_word_status,response_status,raw_spoken,notes\n";
  const rows = logs.map((l) => {
    const goldState = (l.correctedText?.trim() || l.normalizedText || l.rawSpokenText).replace(/"/g, '""');
    const raw = l.rawSpokenText.replace(/"/g, '""');
    const notes = (l.notes ?? "").replace(/"/g, '""');
    return `"${goldState}",${l.expectedIntent},${l.framingStatus},${l.wakeWordStatus},${l.responseStatus},"${raw}","${notes}"`;
  });

  triggerBrowserDownload(
    header + rows.join("\n"),
    `laya_training_${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv;charset=utf-8;"
  );
}

export function downloadFeedbackJsonl(logs: readonly FeedbackLogItem[]): void {
  const content = logs.map((l) => JSON.stringify(l)).join("\n") + "\n";
  triggerBrowserDownload(
    content,
    `training_feedback_${new Date().toISOString().slice(0, 10)}.jsonl`,
    "application/x-ndjson;charset=utf-8;"
  );
}

function triggerBrowserDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
