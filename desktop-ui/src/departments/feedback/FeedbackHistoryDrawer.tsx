import React from "react";
import type { FeedbackLogItem } from "../../types/widget.ts";
import {
  downloadFeedbackJsonl,
  downloadLayaTrainingCsv,
} from "./feedbackStorage.ts";

/**
 * Feedback Training Log Viewer & Exporter (Department: Feedback / Dataset Export)
 * Displays recorded voice framing & wake-word feedback logs and exports CSV/JSONL (<95 lines).
 */

interface FeedbackHistoryDrawerProps {
  readonly logs: readonly FeedbackLogItem[];
  readonly onClear: () => void;
}

export const FeedbackHistoryDrawer: React.FC<FeedbackHistoryDrawerProps> = ({
  logs,
  onClear,
}) => {
  return (
    <div className="feedback-drawer">
      <div className="feedback-drawer-header">
        <div>
          <strong>📊 Voice &amp; Wake-Word Training Feedback Logs ({logs.length})</strong>
          <p className="feedback-sub">
            Export directly to <code>laya_training.csv</code> for <code>laya.Agent().fit()</code> or{" "}
            <code>training_feedback.jsonl</code>
          </p>
        </div>
        <div className="feedback-export-actions">
          <button
            type="button"
            className="fb-export-btn"
            onClick={() => downloadLayaTrainingCsv(logs)}
            disabled={logs.length === 0}
          >
            ⬇️ Export Laya .fit() CSV
          </button>
          <button
            type="button"
            className="fb-export-btn"
            onClick={() => downloadFeedbackJsonl(logs)}
            disabled={logs.length === 0}
          >
            ⬇️ Export JSONL
          </button>
          <button
            type="button"
            className="fb-clear-btn"
            onClick={onClear}
            disabled={logs.length === 0}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="feedback-empty">
          No feedback logged yet. Speak a command or click a preset test phrase above, then click any feedback button!
        </div>
      ) : (
        <div className="feedback-table-wrap">
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Spoken / Framed</th>
                <th>Correction (Gold)</th>
                <th>Intent (Actual → Gold)</th>
                <th>Framing</th>
                <th>Wake-Word</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 12).map((item, idx) => (
                <tr key={item.id ?? idx}>
                  <td>
                    <div className="raw-cell">"{item.rawSpokenText}"</div>
                    {item.normalizedText !== item.rawSpokenText && (
                      <div className="norm-cell">→ "{item.normalizedText}"</div>
                    )}
                  </td>
                  <td>{item.correctedText || "—"}</td>
                  <td>
                    <code>{item.detectedIntent}</code>
                    {item.expectedIntent !== item.detectedIntent && (
                      <span className="gold-arrow"> → {item.expectedIntent}</span>
                    )}
                  </td>
                  <td>{item.framingStatus}</td>
                  <td>{item.wakeWordStatus}</td>
                  <td>{item.responseStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
