import { useState, useCallback, useEffect } from "react";
import { PillWidget } from "./components/PillWidget.tsx";
import { SpeechToast } from "./components/SpeechToast.tsx";
import { useDraggablePill } from "./hooks/useDraggablePill.ts";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut.ts";
import { useGoogleSpeech } from "./hooks/useGoogleSpeech.ts";
import { sendQuery, requestKillApp } from "./services/api.ts";
import "./App.css";

export default function App() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastSpeech, setLastSpeech] = useState<string>("");
  const { pos, isDocked, handleMouseDown } = useDraggablePill();

  const handleQuery = useCallback(async (queryText: string) => {
    setIsProcessing(true);
    setLastSpeech(`"${queryText}"`);
    try {
      const response = await sendQuery(queryText);
      if (response) {
        setLastSpeech(response);
      }
    } catch (err) {
      console.error("Query execution error:", err);
      setLastSpeech("Error processing command.");
    } finally {
      setTimeout(() => setIsProcessing(false), 2400);
    }
  }, []);

  // Google Speech Recognition Hook (en-IN + "Hey Friday" wake-word filtering)
  const { isListening, toggleListening, startListening } = useGoogleSpeech({
    onCommandDetected: (cmd) => handleQuery(cmd),
  });

  // Start background listening on mount and display sleek welcome
  useEffect(() => {
    startListening(false);
    setLastSpeech("Friday ready. Say 'Hey Friday' or press Ctrl+Shift+Space.");
    const timer = setTimeout(() => setLastSpeech(""), 4200);
    return () => clearTimeout(timer);
  }, [startListening]);

  const handleClose = useCallback(async () => {
    await requestKillApp();
    window.close();
  }, []);

  // Whisper AI Hotkey: Ctrl + Shift + Space wakes mic instantly
  useKeyboardShortcut({
    onTriggerMic: () => {
      toggleListening();
    },
    onClose: handleClose,
  });

  return (
    <div className="canvas-container">
      <PillWidget
        isListening={isListening}
        isProcessing={isProcessing}
        isDocked={isDocked}
        pos={pos}
        onMouseDown={handleMouseDown}
        onMute={() => handleQuery("mute audio")}
        onScreenshot={() => handleQuery("take screenshot")}
        onMic={() => toggleListening()}
        onLock={() => handleQuery("lock computer")}
        onClose={handleClose}
      />
      <SpeechToast text={lastSpeech} />
    </div>
  );
}
