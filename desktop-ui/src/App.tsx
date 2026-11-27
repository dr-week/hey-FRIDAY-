import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Minimize2, Sliders } from "lucide-react";
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
  learnWakeWordSample,
  loadVoiceProfile,
  type VoiceProfileData,
} from "./departments/calibration/voiceProfileStorage.ts";
import {
  clearLocalFeedbackLogs,
  loadLocalFeedbackLogs,
  recordFeedbackLog,
} from "./departments/feedback/feedbackStorage.ts";
import { playEarcon } from "./departments/sound/soothingSoundEngine.ts";
import {
  getCuteWakeGreeting,
  speakWithNaturalVoice,
} from "./departments/sound/naturalTtsEngine.ts";
import type { AssistantPresenceState } from "./departments/sound/PresenceAndSoundBar.tsx";
import { sendQuery, requestKillApp, requestStopSpeech } from "./services/api.ts";
import type { ExecutionTelemetryMeta, FeedbackLogItem } from "./types/widget.ts";
import "./App.css";
import "./departments/lab/VoiceLab.css";
import "./departments/sound/PresenceOrb.css";

export default function App() {
  const isWebPagesDefault = typeof window !== "undefined" && window.location.port !== "4141";
  const [showLab, setShowLab] = useState<boolean>(isWebPagesDefault);
  const [isLocalBackend, setIsLocalBackend] = useState<boolean>(!isWebPagesDefault);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastSpeech, setLastSpeech] = useState<string>("");
  const [lastMeta, setLastMeta] = useState<ExecutionTelemetryMeta | null>(null);
  const [lastWakeEval, setLastWakeEval] = useState<WakeGateEvaluation | null>(null);
  const [profile, setProfile] = useState<VoiceProfileData>(() => loadVoiceProfile());
  const [isCalibratingWake, setIsCalibratingWake] = useState<boolean>(false);
  const isCalibratingRef = useRef<boolean>(false);
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLogItem[]>(() => loadLocalFeedbackLogs());
  const { pos, isDocked, handleMouseDown } = useDraggablePill();

  const handleQuery = useCallback(async (queryText: string, wakeEval?: WakeGateEvaluation) => {
    setIsProcessing(true);
    setLastMeta(null);
    setLastSpeech(`"${queryText}"`);
    playEarcon("listen");
    try {
      const result = await sendQuery(queryText, {
        onSpeakStart: () => setIsSpeaking(true),
        onSpeakEnd: () => setIsSpeaking(false),
      });
      setIsLocalBackend(result.isLocalBackend);
      if (result.response) {
        playEarcon("reply");
        setLastSpeech(result.response);
        setLastMeta(
          result.meta
            ? { ...result.meta, rawSpokenText: wakeEval?.rawText ?? queryText, wakeMatchType: wakeEval?.matchType }
            : null
        );
      }
    } catch {
      playEarcon("gentle_error");
      setLastSpeech("Command error.");
    } finally {
      setTimeout(() => setIsProcessing(false), 1200);
    }
  }, []);

  const handleCalibrationSample = useCallback((rawSpoken: string): boolean => {
    if (!isCalibratingRef.current) return false;
    const updated = learnWakeWordSample(rawSpoken);
    setProfile(updated);
    isCalibratingRef.current = false;
    setIsCalibratingWake(false);
    playEarcon("success");
    const msg = `Learned your voice alias: ${rawSpoken.toLowerCase()}`;
    setLastSpeech(msg);
    speakWithNaturalVoice(msg, { onStart: () => setIsSpeaking(true), onEnd: () => setIsSpeaking(false) });
    return true;
  }, []);

  const { isListening, isArmedSession, micState, toggleListening, startListening } = useGoogleSpeech({
    onCommandDetected: (cmd, ev) => { setLastWakeEval(ev); handleQuery(cmd, ev); },
    onWakeEvents: (ev) => {
      setLastWakeEval(ev);
      if (ev.shouldArmFollowupWindow) {
        playEarcon("wake");
        const greet = getCuteWakeGreeting();
        setLastSpeech(`✨ ${greet}`);
        speakWithNaturalVoice(greet, { onStart: () => setIsSpeaking(true), onEnd: () => setIsSpeaking(false) });
      } else if (ev.matchType === "rejected_no_wake") {
        setLastSpeech(`Ignored: "${ev.rawText}"`);
      }
    },
    onInterimTranscript: (interim) => { setLastMeta(null); setLastSpeech(`🎙️ ${interim}...`); },
    onCalibrationCapture: handleCalibrationSample,
  });

  const presence: AssistantPresenceState = useMemo(() => {
    if (isSpeaking) return "speaking";
    if (isProcessing) return "thinking";
    if (isArmedSession) return "awake";
    if (isListening) return "listening";
    return "sleeping";
  }, [isArmedSession, isListening, isProcessing, isSpeaking]);

  useEffect(() => {
    startListening(false);
    setLastSpeech("Ready. Tap Orb or Mic to wake.");
  }, [startListening]);

  const handleStartWakeCalibration = useCallback(() => {
    isCalibratingRef.current = true;
    setIsCalibratingWake(true);
    playEarcon("wake");
    startListening(true);
    setLastSpeech("Speak 'Hey Friday' in your normal voice...");
  }, [startListening]);

  const handleSimulateVoice = useCallback((rawPhrase: string) => {
    if (isCalibratingRef.current) { handleCalibrationSample(rawPhrase); return; }
    const ev = evaluateWakeWordGate(rawPhrase, { isManualTrigger: false, isArmedWindowActive: isArmedSession });
    setLastWakeEval(ev);
    if (ev.shouldArmFollowupWindow) {
      playEarcon("wake");
      const greet = getCuteWakeGreeting();
      setLastSpeech(`✨ ${greet}`);
      speakWithNaturalVoice(greet, { onStart: () => setIsSpeaking(true), onEnd: () => setIsSpeaking(false) });
      return;
    }
    if (ev.accepted) handleQuery(ev.commandText, ev);
    else { playEarcon("gentle_error"); setLastSpeech(`Sleeping — say 'Hey Friday' first`); }
  }, [handleCalibrationSample, handleQuery, isArmedSession]);

  const handleMicOrShortcut = useCallback(() => {
    requestStopSpeech();
    setIsSpeaking(false);
    playEarcon(isListening ? "sleep" : "wake");
    toggleListening();
  }, [isListening, toggleListening]);

  const handleClose = useCallback(async () => { await requestKillApp(); window.close(); }, []);
  useKeyboardShortcut({ onTriggerMic: handleMicOrShortcut, onClose: handleClose });

  return (
    <div className={`canvas-container ${showLab ? "lab-mode" : ""}`}>
      <button type="button" className="lab-toggle-btn" onClick={() => setShowLab((s) => !s)}>
        {showLab ? <Minimize2 size={14} /> : <Sliders size={14} />}
        <span>{showLab ? "Pill Only" : "Studio"}</span>
      </button>

      <PillWidget
        isListening={isListening || isArmedSession}
        isProcessing={isProcessing || isSpeaking}
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
          presence={presence}
          micState={micState}
          isLocalBackend={isLocalBackend}
          profile={profile}
          isCalibratingWake={isCalibratingWake}
          lastWakeEval={lastWakeEval}
          lastSpeech={lastSpeech}
          lastMeta={lastMeta}
          feedbackLogs={feedbackLogs}
          onToggleMic={handleMicOrShortcut}
          onStartWakeCalibration={handleStartWakeCalibration}
          onProfileUpdated={setProfile}
          onSimulateVoiceInput={handleSimulateVoice}
          onSaveFeedback={async (entry) => setFeedbackLogs(await recordFeedbackLog(entry))}
          onClearFeedback={() => { clearLocalFeedbackLogs(); setFeedbackLogs([]); }}
        />
      )}

      {!showLab && <SpeechToast text={lastSpeech} meta={lastMeta} />}
    </div>
  );
}
