import React from "react";
import { Activity, Cpu, Mic, MicOff } from "lucide-react";
import type { MicDiagnosticState } from "../speech/useGoogleSpeech.ts";

/**
 * Minimal Icon Topbar for FRIDAY Studio (Department: Lab / Header <45 lines).
 */
interface StudioTopBarProps {
  readonly isLocalBackend: boolean;
  readonly isListening: boolean;
  readonly isArmedSession: boolean;
  readonly micState: MicDiagnosticState;
}

export const StudioTopBar: React.FC<StudioTopBarProps> = ({
  isLocalBackend,
  isListening,
  isArmedSession,
  micState,
}) => {
  const micLabel =
    micState === "permission-denied"
      ? "Allow Mic"
      : micState === "unsupported"
        ? "Use Chrome"
        : isArmedSession
          ? "Awake (8s)"
          : isListening
            ? "Mic Live"
            : "Mic Off";

  const micColor =
    micState === "permission-denied" ? "red" : isArmedSession ? "amber" : isListening ? "teal" : "";

  return (
    <header className="glass-topbar">
      <div className="brand-row">
        <Cpu size={18} className="icon-cyan" />
        <h1>FRIDAY Studio</h1>
      </div>
      <div className="status-pills">
        <span className={`status-chip ${isLocalBackend ? "teal" : "sky"}`}>
          <Activity size={13} />
          <span>{isLocalBackend ? "Local 4141" : "Web Engine"}</span>
        </span>
        <span className={`status-chip ${micColor}`}>
          {isListening ? <Mic size={13} /> : <MicOff size={13} />}
          <span>{micLabel}</span>
        </span>
      </div>
    </header>
  );
};
