import React from "react";
import { GripVertical, VolumeX, Camera, Lock } from "lucide-react";
import { ActionButton } from "./ActionButton.tsx";
import { MicButton } from "./MicButton.tsx";
import { CloseButton } from "./CloseButton.tsx";
import { WaveformVisualizer } from "./WaveformVisualizer.tsx";
import type { Position } from "../types/widget.ts";

interface PillWidgetProps {
  readonly isListening: boolean;
  readonly isProcessing?: boolean;
  readonly isDocked?: "left" | "right" | "top" | "bottom" | null;
  readonly pos: Position;
  readonly onMouseDown: (e: React.MouseEvent) => void;
  readonly onMute: () => void;
  readonly onScreenshot: () => void;
  readonly onMic: () => void;
  readonly onLock: () => void;
  readonly onClose: () => void;
}

export const PillWidget: React.FC<PillWidgetProps> = ({
  isListening,
  isProcessing = false,
  isDocked = null,
  pos,
  onMouseDown,
  onMute,
  onScreenshot,
  onMic,
  onLock,
  onClose,
}) => {
  return (
    <div
      className={`pill-widget ${isListening ? "listening" : ""} ${isProcessing ? "processing" : ""} ${isDocked ? `docked-${isDocked}` : ""}`}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      }}
      onMouseDown={onMouseDown}
    >
      {/* 6-dot Drag Handle */}
      <div className="drag-handle" title="Drag">
        <GripVertical size={16} />
      </div>

      {/* 1. Mute Audio Toggle */}
      <ActionButton
        title="Mute"
        className="action-btn"
        onClick={onMute}
      >
        <VolumeX size={17} />
      </ActionButton>

      {/* 2. Take Screenshot */}
      <ActionButton
        title="Snip"
        className="action-btn"
        onClick={onScreenshot}
      >
        <Camera size={17} />
      </ActionButton>

      {/* 3. Center Voice Module with Active Glowing Waveform */}
      <div className="mic-waveform-group">
        <MicButton isListening={isListening} onClick={onMic} />
        <WaveformVisualizer isListening={isListening} isProcessing={isProcessing} />
      </div>

      {/* 4. Lock PC */}
      <ActionButton
        title="Lock"
        className="action-btn"
        onClick={onLock}
      >
        <Lock size={17} />
      </ActionButton>

      {/* 5. Crimson Kill/Close Cross */}
      <CloseButton onClick={onClose} />
    </div>
  );
};
