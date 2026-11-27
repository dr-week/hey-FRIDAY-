import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CloudSun,
  GitBranch,
  Mic,
  MicOff,
  Play,
  Radio,
  Sparkles,
  VolumeX,
  Zap,
} from "lucide-react";
import type { ExecutionTelemetryMeta, FeedbackLogItem } from "../../types/widget.ts";
import type { WakeGateEvaluation } from "../speech/wakeWordGate.ts";
import type { MicDiagnosticState } from "../speech/useGoogleSpeech.ts";
import type { VoiceProfileData } from "../calibration/voiceProfileStorage.ts";
import { VoiceCalibrationCard } from "../calibration/VoiceCalibrationCard.tsx";
import { CollabAndTrainCard } from "../collab/CollabAndTrainCard.tsx";
import { FeedbackButtonBar } from "../feedback/FeedbackButtonBar.tsx";
import { FeedbackHistoryDrawer } from "../feedback/FeedbackHistoryDrawer.tsx";
import { downloadLayaTrainingCsv } from "../feedback/feedbackStorage.ts";
import {
  type AssistantPresenceState,
  PresenceAndSoundBar,
} from "../sound/PresenceAndSoundBar.tsx";
import { StudioTopBar } from "./StudioTopBar.tsx";

/**
 * Multi-Gradient Functional Workspace (Department: Lab / UIUX <145 lines).
 * Each department has its own signature color gradient & collapsible zone.
 */
interface VoiceTestBenchProps {
  readonly isListening: boolean;
  readonly isArmedSession: boolean;
  readonly presence: AssistantPresenceState;
  readonly micState: MicDiagnosticState;
  readonly isLocalBackend: boolean;
  readonly profile: VoiceProfileData;
  readonly isCalibratingWake: boolean;
  readonly lastWakeEval: WakeGateEvaluation | null;
  readonly lastSpeech: string;
  readonly lastMeta: ExecutionTelemetryMeta | null;
  readonly feedbackLogs: readonly FeedbackLogItem[];
  readonly onToggleMic: () => void;
  readonly onStartWakeCalibration: () => void;
  readonly onProfileUpdated: (next: VoiceProfileData) => void;
  readonly onSimulateVoiceInput: (rawText: string) => void;
  readonly onSaveFeedback: (entry: FeedbackLogItem) => void;
  readonly onClearFeedback: () => void;
}

const QUICK_ICON_PRESETS = [
  { icon: Radio, label: "Wake", phrase: "Hey Friday" },
  { icon: GitBranch, label: "Typo Git", phrase: "Hey Freddie check get statues" },
  { icon: VolumeX, label: "Mute", phrase: "Hey Friday mute audio" },
  { icon: CloudSun, label: "Goa", phrase: "Hey Friday do I need an umbrella in Goa today?" },
  { icon: Zap, label: "Macro", phrase: "Hey Friday focus mode" },
];

export const VoiceTestBench: React.FC<VoiceTestBenchProps> = (props) => {
  const [customPhrase, setCustomPhrase] = useState("");
  const [openSec, setOpenSec] = useState({ calib: false, test: true, logs: false, collab: true });
  const toggleSec = (k: "calib" | "test" | "logs" | "collab") =>
    setOpenSec((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="glass-workspace">
      <StudioTopBar
        isLocalBackend={props.isLocalBackend}
        isListening={props.isListening}
        isArmedSession={props.isArmedSession}
        micState={props.micState}
      />

      {/* Zone 00: Live Presence Orb & Soothing Sound Studio */}
      <PresenceAndSoundBar presence={props.presence} onToggleWakeState={props.onToggleMic} />

      {/* Zone 01 (Emerald-Mint Gradient): Voice Calibration & Accent */}
      <VoiceCalibrationCard
        profile={props.profile}
        isCalibratingWake={props.isCalibratingWake}
        isOpen={openSec.calib}
        onToggleOpen={() => toggleSec("calib")}
        onStartWakeCalibration={props.onStartWakeCalibration}
        onProfileUpdated={props.onProfileUpdated}
      />

      {/* Zone 02 (Sky-Sapphire Gradient): Test Framing & Rate */}
      <section className="glass-accordion zone-sky">
        <button type="button" className="accordion-header" onClick={() => toggleSec("test")}>
          <div className="accordion-title-group">
            <span className="zone-icon-badge sky">
              <Sparkles size={16} />
            </span>
            <div className="zone-heading">
              <span className="zone-kicker">02 • LIVE TESTING &amp; FRAMING</span>
              <span>Test Voice &amp; Rate AI Response</span>
            </div>
            {props.lastMeta && <span className="mini-pill">{props.lastMeta.intent} • {props.lastMeta.latencyMs}ms</span>}
          </div>
          {openSec.test ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>

        {openSec.test && (
          <div className="accordion-body">
            <div className="compact-stat-strip">
              <div className="stat-tile">
                <span className="stat-tag">Heard</span>
                <p>{props.lastWakeEval?.rawText || props.lastMeta?.query || "Click Mic & Speak"}</p>
              </div>
              <div className="stat-tile">
                <span className="stat-tag">Framed {props.lastWakeEval?.wasRepaired ? "✨" : ""}</span>
                <p className="cyan-text">{props.lastWakeEval?.normalizedText || props.lastMeta?.normalizedQuery || "—"}</p>
              </div>
              <div className="stat-tile">
                <span className="stat-tag">Reply ({props.lastWakeEval?.matchType || "ready"})</span>
                <p>{props.lastSpeech || "Standby"}</p>
              </div>
            </div>

            <div className="test-action-bar">
              <button type="button" className={`glass-btn primary ${props.isListening ? "active-mic" : ""}`} onClick={props.onToggleMic}>
                {props.isListening ? <MicOff size={15} /> : <Mic size={15} />}
                <span>{props.isListening ? "Sleep" : "Wake Mic"}</span>
              </button>

              <form className="inline-sim-form" onSubmit={(e) => { e.preventDefault(); if (customPhrase.trim()) props.onSimulateVoiceInput(customPhrase.trim()); }}>
                <input type="text" className="glass-input-sm" value={customPhrase} onChange={(e) => setCustomPhrase(e.target.value)} placeholder="Or type phrase..." />
                <button type="submit" className="glass-btn icon-only" title="Run Test"><Play size={14} /></button>
              </form>

              <div className="icon-preset-group">
                {QUICK_ICON_PRESETS.map(({ icon: Icon, label, phrase }) => (
                  <button key={label} type="button" className="glass-chip-btn" title={phrase} onClick={() => props.onSimulateVoiceInput(phrase)}>
                    <Icon size={13} /><span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <FeedbackButtonBar
              rawSpokenText={props.lastWakeEval?.rawText || props.lastMeta?.query || ""}
              normalizedText={props.lastWakeEval?.normalizedText || props.lastMeta?.normalizedQuery || ""}
              detectedIntent={props.lastMeta?.intent || "unknown"}
              aiResponse={props.lastSpeech}
              isLocalBackend={props.isLocalBackend}
              onSaveFeedback={props.onSaveFeedback}
            />
          </div>
        )}
      </section>

      {/* Zone 03 (Amber-Gold Gradient): Training Logs & CSV Export */}
      <FeedbackHistoryDrawer logs={props.feedbackLogs} isOpen={openSec.logs} onToggleOpen={() => toggleSec("logs")} onClear={props.onClearFeedback} />

      {/* Zone 04 (Rose-Coral Gradient): Collab, Free GPU Training & Data Grants */}
      <CollabAndTrainCard
        logCount={props.feedbackLogs.length}
        isOpen={openSec.collab}
        onToggleOpen={() => toggleSec("collab")}
        onExportCsv={() => downloadLayaTrainingCsv(props.feedbackLogs)}
      />
    </div>
  );
};
