/**
 * Google Chromium Web Speech Engine Hook (Department: Speech / ASR Capture)
 * Uses `maxAlternatives = 3` + two-turn 7-second armed wake window (<135 lines).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { evaluateWakeWordGate, type WakeGateEvaluation } from "./wakeWordGate.ts";

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
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
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export interface UseGoogleSpeechOptions {
  readonly onCommandDetected: (commandText: string, evaluation: WakeGateEvaluation) => void;
  readonly onWakeEvents?: (evaluation: WakeGateEvaluation) => void;
  readonly onInterimTranscript?: (interimText: string) => void;
  readonly onListeningStateChange?: (isListening: boolean) => void;
}

export function useGoogleSpeech({
  onCommandDetected,
  onWakeEvents,
  onInterimTranscript,
  onListeningStateChange,
}: UseGoogleSpeechOptions) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isArmedSession, setIsArmedSession] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyTriggeredRef = useRef<boolean>(false);
  const armedUntilRef = useRef<number>(0);

  const armFollowupSession = useCallback((durationMs: number = 7000) => {
    armedUntilRef.current = Date.now() + durationMs;
    setIsArmedSession(true);
    setTimeout(() => {
      if (Date.now() >= armedUntilRef.current) setIsArmedSession(false);
    }, durationMs + 100);
  }, []);

  const handleCommandResult = useCallback(
    (alternatives: string[]) => {
      const isManual = isManuallyTriggeredRef.current;
      const isArmed = Date.now() < armedUntilRef.current;
      let bestEval: WakeGateEvaluation | null = null;
      for (const alt of alternatives) {
        const ev = evaluateWakeWordGate(alt, { isManualTrigger: isManual, isArmedWindowActive: isArmed });
        if (!bestEval) bestEval = ev;
        if (ev.accepted || ev.shouldArmFollowupWindow) {
          bestEval = ev;
          break;
        }
      }
      if (!bestEval) return;
      onWakeEvents?.(bestEval);
      if (bestEval.shouldArmFollowupWindow) {
        armFollowupSession(7000);
        return;
      }
      if (bestEval.accepted) {
        setTranscript(bestEval.commandText);
        armedUntilRef.current = 0;
        setIsArmedSession(false);
        isManuallyTriggeredRef.current = false;
        onCommandDetected(bestEval.commandText, bestEval);
      }
    },
    [armFollowupSession, onCommandDetected, onWakeEvents]
  );

  useEffect(() => {
    const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechConstructor) return;
    const recognition = new SpeechConstructor();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (!item) continue;
        const alts = Array.from({ length: item.length }, (_, j) => item[j]?.transcript?.trim() || "").filter(Boolean);
        if (item.isFinal && alts[0]) handleCommandResult(alts);
        else if (alts[0] && onInterimTranscript) onInterimTranscript(`🎙️ ${alts[0]}...`);
      }
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      if (isListening) try { recognition.start(); } catch {}
    };
    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, [handleCommandResult, isListening, onInterimTranscript]);

  const startListening = useCallback((manual: boolean = false) => {
    isManuallyTriggeredRef.current = manual;
    if (manual) armFollowupSession(10000);
    setIsListening(true);
    onListeningStateChange?.(true);
    try { recognitionRef.current?.start(); } catch {}
  }, [armFollowupSession, onListeningStateChange]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsArmedSession(false);
    onListeningStateChange?.(false);
    try { recognitionRef.current?.stop(); } catch {}
  }, [onListeningStateChange]);

  const toggleListening = useCallback(() => {
    if (isListening && !isArmedSession) {
      armFollowupSession(10000);
      isManuallyTriggeredRef.current = true;
    } else if (isListening) stopListening();
    else startListening(true);
  }, [armFollowupSession, isArmedSession, isListening, startListening, stopListening]);

  return { isListening, isArmedSession, transcript, startListening, stopListening, toggleListening };
}
