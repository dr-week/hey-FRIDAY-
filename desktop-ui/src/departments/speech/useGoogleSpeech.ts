/**
 * Google Chromium Web Speech Engine Hook (Department: Speech / ASR Capture <140 lines).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { evaluateWakeWordGate, type WakeGateEvaluation } from "./wakeWordGate.ts";
import { loadVoiceProfile } from "../calibration/voiceProfileStorage.ts";

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export type MicDiagnosticState = "ready" | "listening" | "armed" | "unsupported" | "permission-denied";

export interface UseGoogleSpeechOptions {
  readonly onCommandDetected: (commandText: string, evaluation: WakeGateEvaluation) => void;
  readonly onWakeEvents?: (evaluation: WakeGateEvaluation) => void;
  readonly onInterimTranscript?: (interimText: string) => void;
  readonly onCalibrationCapture?: (rawSpoken: string) => boolean;
}

export function useGoogleSpeech({
  onCommandDetected,
  onWakeEvents,
  onInterimTranscript,
  onCalibrationCapture,
}: UseGoogleSpeechOptions) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isArmedSession, setIsArmedSession] = useState<boolean>(false);
  const [micState, setMicState] = useState<MicDiagnosticState>("ready");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const isManuallyTriggeredRef = useRef<boolean>(false);
  const armedUntilRef = useRef<number>(0);

  const armFollowupSession = useCallback((durationMs: number = 8000) => {
    armedUntilRef.current = Date.now() + durationMs;
    setIsArmedSession(true);
    setMicState("armed");
    setTimeout(() => {
      if (Date.now() >= armedUntilRef.current) {
        setIsArmedSession(false);
        setMicState(isListeningRef.current ? "listening" : "ready");
      }
    }, durationMs + 100);
  }, []);

  const handleCommandResult = useCallback(
    (alternatives: string[]) => {
      const primary = alternatives[0] || "";
      if (primary && onCalibrationCapture && onCalibrationCapture(primary)) return;

      const isManual = isManuallyTriggeredRef.current;
      const isArmed = Date.now() < armedUntilRef.current;
      let bestEval: WakeGateEvaluation | null = null;
      for (const alt of alternatives) {
        const ev = evaluateWakeWordGate(alt, { isManualTrigger: isManual, isArmedWindowActive: isArmed });
        if (!bestEval) bestEval = ev;
        if (ev.accepted || ev.shouldArmFollowupWindow) { bestEval = ev; break; }
      }
      if (!bestEval) return;
      onWakeEvents?.(bestEval);
      if (bestEval.shouldArmFollowupWindow) { armFollowupSession(8000); return; }
      if (bestEval.accepted) {
        armedUntilRef.current = 0;
        setIsArmedSession(false);
        isManuallyTriggeredRef.current = false;
        onCommandDetected(bestEval.commandText, bestEval);
      }
    },
    [armFollowupSession, onCalibrationCapture, onCommandDetected, onWakeEvents]
  );

  useEffect(() => {
    const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechConstructor) { setMicState("unsupported"); return; }

    const recognition = new SpeechConstructor();
    recognition.lang = loadVoiceProfile().speechLang || "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (!item) continue;
        const alts = Array.from({ length: item.length }, (_, j) => item[j]?.transcript?.trim() || "").filter(Boolean);
        if (item.isFinal && alts[0]) handleCommandResult(alts);
        else if (alts[0] && onInterimTranscript) onInterimTranscript(alts[0]);
      }
    };
    recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setMicState("permission-denied");
        isListeningRef.current = false;
        setIsListening(false);
      }
    };
    recognition.onend = () => { if (isListeningRef.current) try { recognition.start(); } catch {} };
    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, [handleCommandResult, onInterimTranscript]);

  const startListening = useCallback(async (manual: boolean = false) => {
    if (manual && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch { setMicState("permission-denied"); return; }
    }
    if (recognitionRef.current) recognitionRef.current.lang = loadVoiceProfile().speechLang;
    isManuallyTriggeredRef.current = manual;
    isListeningRef.current = true;
    setIsListening(true);
    setMicState("listening");
    if (manual) armFollowupSession(10000);
    try { recognitionRef.current?.start(); } catch {}
  }, [armFollowupSession]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsArmedSession(false);
    setMicState("ready");
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) stopListening();
    else startListening(true);
  }, [startListening, stopListening]);

  return { isListening, isArmedSession, micState, startListening, stopListening, toggleListening };
}
