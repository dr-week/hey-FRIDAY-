import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  FileCode2,
  Trash2,
} from "lucide-react";
import type { FeedbackLogItem } from "../../types/widget.ts";
import {
  downloadFeedbackJsonl,
  downloadLayaTrainingCsv,
} from "./feedbackStorage.ts";

/**
 * Collapsible Feedback Training Dataset Drawer (Department: Feedback / Dataset Export)
 * Minimal icon-driven table & 1-click Laya `.fit()` CSV / JSONL export (<105 lines).
 */

interface FeedbackHistoryDrawerProps {
  readonly logs: readonly FeedbackLogItem[];
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
  readonly onClear: () => void;
}

export const FeedbackHistoryDrawer: React.FC<FeedbackHistoryDrawerProps> = ({
  logs,
  isOpen,
  onToggleOpen,
  onClear,
}) => {
  return (
    <section className="glass-accordion">
      <div className="accordion-header-row">
        <button type="button" className="accordion-header" onClick={onToggleOpen}>
          <div className="accordion-title-group">
            <Database size={17} className="icon-cyan" />
            <span>Training Logs</span>
            <span className="mini-pill">{logs.length}</span>
          </div>
          {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>

        <div className="header-quick-icons">
          <button
            type="button"
            className="glass-btn"
            title="Export Laya .fit() CSV Dataset"
            onClick={() => downloadLayaTrainingCsv(logs)}
            disabled={logs.length === 0}
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className="glass-btn"
            title="Export Raw JSONL Logs"
            onClick={() => downloadFeedbackJsonl(logs)}
            disabled={logs.length === 0}
          >
            <FileCode2 size={14} />
            <span>JSONL</span>
          </button>
          <button
            type="button"
            className="glass-btn icon-only"
            title="Clear Logs"
            onClick={onClear}
            disabled={logs.length === 0}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="accordion-body">
          {logs.length === 0 ? (
            <div className="empty-hint">No logs yet — rate any test above.</div>
          ) : (
            <div className="compact-log-list">
              {logs.slice(0, 10).map((item, idx) => (
                <div key={item.id ?? idx} className="compact-log-row">
                  <span className="log-spoken">"{item.correctedText || item.normalizedText}"</span>
                  <code className="log-intent">{item.expectedIntent}</code>
                  <span className="log-badges">
                    <span className={`dot-tag ${item.framingStatus}`}>{item.framingStatus}</span>
                    <span className={`dot-tag ${item.wakeWordStatus}`}>{item.wakeWordStatus}</span>
                    <span className={`dot-tag ${item.responseStatus}`}>{item.responseStatus}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
