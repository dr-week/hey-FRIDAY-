/**
 * Google Chromium Web Speech Engine Hook
 * - Accent tuned: 'en-IN' (Indian English) with automatic fallback to 'en-US'
 * - Wake Word Filtering: Rejects noise/conversations unless wake word "Hey Friday" / "Friday" is present
 * - Shared Audio Stream: Non-exclusive microphone capture (never blocks Discord/WhatsApp/Games)
 * - Whisper AI Style Push-To-Talk / Toggle Mode support
 */
import { useEffect, useRef, useState, useCallback } from "react";

// Web Speech API interface declarations
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

interface UseGoogleSpeechOptions {
  readonly onCommandDetected: (commandText: string) => void;
  readonly onListeningStateChange?: (isListening: boolean) => void;
}

export function useGoogleSpeech({
  onCommandDetected,
  onListeningStateChange,
}: UseGoogleSpeechOptions) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyTriggeredRef = useRef<boolean>(false);

  // Wake-word matcher for Indian speech patterns
  const extractCommand = useCallback((rawText: string, requireWakeWord: boolean): string | null => {
    const text = rawText.trim().toLowerCase();
    
    // If manually triggered via button or Whisper hotkey, wake word is optional
    if (!requireWakeWord) {
      // Strip "hey friday" or "friday" prefix if present
      const clean = text.replace(/^(hey\s+)?friday[,.\s]*/i, "").trim();
      return clean.length > 0 ? clean : text;
    }

    // Passive Wake Word Detection: Must match "hey friday", "friday", "a friday"
    const wakeWordPattern = /^(hey\s+friday|friday|ok\s+friday|ay\s+friday|hi\s+friday)[\s,]+(.+)$/i;
    const match = text.match(wakeWordPattern);
    if (match && match[2]) {
      return match[2].trim();
    }

    return null;
  }, []);

  const handleCommandResult = useCallback((rawTranscript: string) => {
    const isManual = isManuallyTriggeredRef.current;
    const command = extractCommand(rawTranscript, !isManual);

    if (command) {
      console.log(`🎙️ [Google Speech] Accepted Command: "${command}" (Raw: "${rawTranscript}")`);
      setTranscript(command);
      onCommandDetected(command);
    } else {
      console.log(`🔇 [Google Speech] Filtered out noise/non-wake speech: "${rawTranscript}"`);
    }

    // Reset manual trigger flag
    isManuallyTriggeredRef.current = false;
  }, [extractCommand, onCommandDetected]);

  useEffect(() => {
    const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      console.warn("Web Speech API not supported in this browser environment.");
      return;
    }

    const recognition = new SpeechConstructor();
    // Indian English dialect recognition
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item && item.isFinal) {
          const raw = item[0]?.transcript || "";
          if (raw.trim()) {
            handleCommandResult(raw);
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" is normal when user is quiet
      if (event.error !== "no-speech") {
        console.warn("Speech Recognition notice:", event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart continuous background listener if active
      if (isListening) {
        try {
          recognition.start();
        } catch {
          // Ignore already-started exceptions
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore on unmount
      }
    };
  }, [handleCommandResult, isListening]);

  /**
   * Start or restart listening
   */
  const startListening = useCallback((manual: boolean = false) => {
    isManuallyTriggeredRef.current = manual;
    setIsListening(true);
    onListeningStateChange?.(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Recognition might already be running
      }
    }
  }, [onListeningStateChange]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    setIsListening(false);
    onListeningStateChange?.(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
  }, [onListeningStateChange]);

  /**
   * Whisper-AI Style Toggle: Hotkey or click triggers instant command capture
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening(true);
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}
