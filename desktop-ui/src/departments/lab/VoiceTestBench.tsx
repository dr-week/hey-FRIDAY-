import React, { useState } from "react";
import type { ExecutionTelemetryMeta, FeedbackLogItem } from "../../types/widget.ts";
import type { WakeGateEvaluation } from "../speech/wakeWordGate.ts";
import { FeedbackButtonBar } from "../feedback/FeedbackButtonBar.tsx";
import { FeedbackHistoryDrawer } from "../feedback/FeedbackHistoryDrawer.tsx";

/**
 * Interactive Voice, Sentence Framing & Wake-Word Web Test Bench (Department: Lab / Web UI)
 * Designed for live testing on GitHub Pages and local Desktop (<140 lines).
 */

interface VoiceTestBenchProps {
  readonly isListening: boolean;
  readonly isArmedSession: boolean;
  readonly isLocalBackend: boolean;
  readonly lastWakeEval: WakeGateEvaluation | null;
  readonly lastSpeech: string;
  readonly lastMeta: ExecutionTelemetryMeta | null;
  readonly feedbackLogs: readonly FeedbackLogItem[];
  readonly onToggleMic: () => void;
  readonly onSimulateVoiceInput: (rawText: string) => void;
  readonly onSaveFeedback: (entry: FeedbackLogItem) => void;
  readonly onClearFeedback: () => void;
}

const PRESET_VOICE_TESTS: ReadonlyArray<{ readonly label: string; readonly phrase: string }> = [
  { label: "🎙️ Wake Only ('Hey Friday')", phrase: "Hey Friday" },
  { label: "🔧 Phonetic Typo ('Hey Freddie check get statues')", phrase: "Hey Freddie check get statues" },
  { label: "🔇 Wake + Mute ('Hey Friday mute audio')", phrase: "Hey Friday mute audio" },
  { label: "🌴 Goa Weather ('Hey Friday do I need an umbrella in Goa today?')", phrase: "Hey Friday do I need an umbrella in Goa today?" },
  { label: "⚡ 0ms Macro ('Hey Friday focus mode')", phrase: "Hey Friday focus mode" },
  { label: "🗣️ Ambient Chatter ('I am talking to my friend on Discord')", phrase: "I am talking to my friend on Discord" },
];

export const VoiceTestBench: React.FC<VoiceTestBenchProps> = ({
  isListening,
  isArmedSession,
  isLocalBackend,
  lastWakeEval,
  lastSpeech,
  lastMeta,
  feedbackLogs,
  onToggleMic,
  onSimulateVoiceInput,
  onSaveFeedback,
  onClearFeedback,
}) => {
  const [customPhrase, setCustomPhrase] = useState<string>("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhrase.trim()) return;
    onSimulateVoiceInput(customPhrase.trim());
  };

  return (
    <div className="voice-lab-card">
      <div className="voice-lab-header">
        <div>
          <h2>⚡ Hey FRIDAY — Voice Framing &amp; Wake-Word Test Lab</h2>
          <p className="voice-lab-sub">
            Speak into your microphone or test phonetic phrases below, then use the dedicated feedback buttons to train &amp; export Laya calibration logs.
          </p>
        </div>
        <div className="voice-lab-badges">
          <span className={`env-badge ${isLocalBackend ? "local" : "pages"}`}>
            {isLocalBackend ? "🟢 Connected: Local Bun 4141" : "🌐 Running: GitHub Pages Browser Engine"}
          </span>
          <span className={`wake-badge ${isArmedSession ? "armed" : isListening ? "listening" : "idle"}`}>
            {isArmedSession
              ? "🔥 Wake Armed (7s Follow-up Window)"
              : isListening
                ? "🎙️ Mic Listening ('Hey Friday')"
                : "⏸️ Mic Paused"}
          </span>
        </div>
      </div>

      {/* Live Speech & Wake-Word Diagnostic Telemetry Grid */}
      <div className="telemetry-grid">
        <div className="telemetry-box">
          <span className="telemetry-label">1. Raw Spoken Transcript (ASR)</span>
          <div className="telemetry-value">{lastWakeEval?.rawText || lastMeta?.query || "Speak 'Hey Friday...'"}</div>
        </div>
        <div className="telemetry-box">
          <span className="telemetry-label">2. Normalized &amp; Framed Sentence</span>
          <div className="telemetry-value highlight">
            {lastWakeEval?.normalizedText || lastMeta?.normalizedQuery || "—"}
            {lastWakeEval?.wasRepaired && <span className="repaired-tag">✨ Phonetic Auto-Repaired</span>}
          </div>
        </div>
        <div className="telemetry-box">
          <span className="telemetry-label">3. Wake-Word Gate Decision</span>
          <div className="telemetry-value">
            <code>{lastWakeEval?.matchType || "ready"}</code>
          </div>
        </div>
        <div className="telemetry-box">
          <span className="telemetry-label">4. Laya System-1 Intent &amp; Response</span>
          <div className="telemetry-value">
            <strong>{lastMeta?.intent || "standby"}</strong> ({lastMeta?.latencyMs ?? 0}ms)
            <div className="ai-reply-preview">{lastSpeech || "Ready for voice command."}</div>
          </div>
        </div>
      </div>

      {/* Custom Spoken Sentence Simulator & Preset Test Buttons */}
      <form className="simulator-form" onSubmit={handleCustomSubmit}>
        <input
          type="text"
          className="sim-input"
          value={customPhrase}
          onChange={(e) => setCustomPhrase(e.target.value)}
          placeholder="Type or dictate any sentence (e.g. 'Hey Friday check get statues' or 'Hey Friday')..."
        />
        <button type="submit" className="sim-run-btn">
          ▶ Test Framing &amp; Wake Gate
        </button>
        <button type="button" className="sim-mic-btn" onClick={onToggleMic}>
          {isListening ? "⏹ Stop Mic" : "🎙️ Start Live Mic"}
        </button>
      </form>

      <div className="preset-chips">
        {PRESET_VOICE_TESTS.map((p) => (
          <button key={p.label} type="button" className="preset-chip" onClick={() => onSimulateVoiceInput(p.phrase)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Separate Dedicated Feedback Buttons (Framing, Wake-Word, Response) */}
      <FeedbackButtonBar
        rawSpokenText={lastWakeEval?.rawText || lastMeta?.query || ""}
        normalizedText={lastWakeEval?.normalizedText || lastMeta?.normalizedQuery || ""}
        detectedIntent={lastMeta?.intent || "unknown"}
        aiResponse={lastSpeech}
        isLocalBackend={isLocalBackend}
        onSaveFeedback={onSaveFeedback}
      />

      {/* Recorded Feedback Dataset Table & Laya .fit() CSV Exporter */}
      <FeedbackHistoryDrawer logs={feedbackLogs} onClear={onClearFeedback} />
    </div>
  );
};
