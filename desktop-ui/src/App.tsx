import { useState, useCallback, useEffect } from "react";
import { PillWidget } from "./components/PillWidget.tsx";
import { SpeechToast } from "./components/SpeechToast.tsx";
import { useDraggablePill } from "./hooks/useDraggablePill.ts";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut.ts";
import {
  useGoogleSpeech,
  evaluateWakeWordGate,
  type WakeGateEvaluation,
} from "./hooks/useGoogleSpeech.ts";
import { VoiceTestBench } from "./departments/lab/VoiceTestBench.tsx";
import {
  clearLocalFeedbackLogs,
  loadLocalFeedbackLogs,
  recordFeedbackLog,
} from "./departments/feedback/feedbackStorage.ts";
import { sendQuery, requestKillApp, requestStopSpeech } from "./services/api.ts";
import type { ExecutionTelemetryMeta, FeedbackLogItem } from "./types/widget.ts";
import "./App.css";
import "./departments/lab/VoiceLab.css";

export default function App() {
  const isWebPagesDefault = typeof window !== "undefined" && window.location.port !== "4141";
  const [showLab, setShowLab] = useState<boolean>(isWebPagesDefault);
  const [isLocalBackend, setIsLocalBackend] = useState<boolean>(!isWebPagesDefault);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastSpeech, setLastSpeech] = useState<string>("");
  const [lastMeta, setLastMeta] = useState<ExecutionTelemetryMeta | null>(null);
  const [lastWakeEval, setLastWakeEval] = useState<WakeGateEvaluation | null>(null);
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLogItem[]>(() => loadLocalFeedbackLogs());
  const { pos, isDocked, handleMouseDown } = useDraggablePill();

  const handleQuery = useCallback(async (queryText: string, wakeEval?: WakeGateEvaluation) => {
    setIsProcessing(true);
    setLastMeta(null);
    setLastSpeech(`"${queryText}"`);
    try {
      const result = await sendQuery(queryText);
      setIsLocalBackend(result.isLocalBackend);
      if (result.response) {
        setLastSpeech(result.response);
        setLastMeta(
          result.meta
            ? {
                ...result.meta,
                rawSpokenText: wakeEval?.rawText ?? queryText,
                wakeMatchType: wakeEval?.matchType,
              }
            : null
        );
      }
    } catch {
      setLastSpeech("Error processing command.");
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  }, []);

  const { isListening, isArmedSession, toggleListening, startListening } = useGoogleSpeech({
    onCommandDetected: (cmd, ev) => {
      setLastWakeEval(ev);
      handleQuery(cmd, ev);
    },
    onWakeEvents: (ev) => {
      setLastWakeEval(ev);
      if (ev.shouldArmFollowupWindow) {
        setLastSpeech("🎙️ Hey Friday awake! Listening for your command (7s window)...");
      } else if (ev.matchType === "rejected_no_wake") {
        setLastSpeech(`🔇 Filtered non-wake speech: "${ev.rawText}"`);
      }
    },
    onInterimTranscript: (interim) => {
      setLastMeta(null);
      setLastSpeech(interim);
    },
  });

  useEffect(() => {
    startListening(false);
    setLastSpeech("Friday ready. Say 'Hey Friday' or test voice framing in the Lab.");
  }, [startListening]);

  const handleSimulateVoice = useCallback(
    (rawPhrase: string) => {
      const ev = evaluateWakeWordGate(rawPhrase, {
        isManualTrigger: false,
        isArmedWindowActive: isArmedSession,
      });
      setLastWakeEval(ev);
      if (ev.shouldArmFollowupWindow) {
        setLastSpeech("🎙️ Wake word 'Hey Friday' matched! Armed for follow-up command.");
        return;
      }
      if (ev.accepted) {
        handleQuery(ev.commandText, ev);
      } else {
        setLastSpeech(`🔇 Rejected by Wake Gate (missing 'Hey Friday'): "${ev.rawText}"`);
      }
    },
    [handleQuery, isArmedSession]
  );

  const handleSaveFeedback = useCallback(async (entry: FeedbackLogItem) => {
    const updated = await recordFeedbackLog(entry);
    setFeedbackLogs(updated);
  }, []);

  const handleClearFeedback = useCallback(() => {
    clearLocalFeedbackLogs();
    setFeedbackLogs([]);
  }, []);

  const handleClose = useCallback(async () => {
    await requestKillApp();
    window.close();
  }, []);

  const handleMicOrShortcut = useCallback(() => {
    requestStopSpeech();
    toggleListening();
  }, [toggleListening]);

  useKeyboardShortcut({ onTriggerMic: handleMicOrShortcut, onClose: handleClose });

  return (
    <div className={`canvas-container ${showLab ? "lab-mode" : ""}`}>
      <button type="button" className="lab-toggle-btn" onClick={() => setShowLab((s) => !s)}>
        {showLab ? "🫧 Compact Floating Pill Only" : "🧪 Open Voice & Feedback Test Lab"}
      </button>

      <PillWidget
        isListening={isListening || isArmedSession}
        isProcessing={isProcessing}
        isDocked={isDocked}
        pos={pos}
        onMouseDown={handleMouseDown}
        onMute={() => handleQuery("mute audio")}
        onScreenshot={() => handleQuery("take screenshot")}
        onMic={handleMicOrShortcut}
        onLock={() => handleQuery("lock computer")}
        onClose={handleClose}
      />

      {showLab && (
        <VoiceTestBench
          isListening={isListening}
          isArmedSession={isArmedSession}
          isLocalBackend={isLocalBackend}
          lastWakeEval={lastWakeEval}
          lastSpeech={lastSpeech}
          lastMeta={lastMeta}
          feedbackLogs={feedbackLogs}
          onToggleMic={handleMicOrShortcut}
          onSimulateVoiceInput={handleSimulateVoice}
          onSaveFeedback={handleSaveFeedback}
          onClearFeedback={handleClearFeedback}
        />
      )}

      {!showLab && <SpeechToast text={lastSpeech} meta={lastMeta} />}
    </div>
  );
}
