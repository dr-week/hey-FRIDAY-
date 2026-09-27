import { useEffect } from "react";

interface ShortcutHandlers {
  readonly onTriggerMic: () => void;
  readonly onClose: () => void;
}

export function useKeyboardShortcut({ onTriggerMic, onClose }: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Whisper AI Hotkey: Ctrl + Shift + Space
      if (e.ctrlKey && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        onTriggerMic();
      }
      // Quick Exit: Escape
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTriggerMic, onClose]);
}
