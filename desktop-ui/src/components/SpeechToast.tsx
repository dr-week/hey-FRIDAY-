import React from "react";
import type { ExecutionTelemetryMeta } from "../types/widget.ts";

interface SpeechToastProps {
  readonly text: string;
  readonly meta?: ExecutionTelemetryMeta | null;
}

export const SpeechToast: React.FC<SpeechToastProps> = ({ text, meta }) => {
  if (!text) return null;
  return (
    <div className="speech-toast">
      <span>{text}</span>
      {meta && (
        <span
          style={{
            marginLeft: "10px",
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: "11px",
            background: meta.isDestructive ? "rgba(255, 71, 87, 0.22)" : "rgba(0, 242, 254, 0.16)",
            border: `1px solid ${meta.isDestructive ? "rgba(255, 71, 87, 0.55)" : "rgba(56, 189, 248, 0.45)"}`,
            color: meta.isDestructive ? "#ff6b81" : "#38bdf8",
            fontWeight: 600,
          }}
        >
          ⚡ {meta.latencyMs}ms • {meta.intent}
        </span>
      )}
    </div>
  );
};
