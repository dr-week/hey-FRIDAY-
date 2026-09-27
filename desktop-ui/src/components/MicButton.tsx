import React from "react";
import { Mic } from "lucide-react";

interface MicButtonProps {
  readonly isListening: boolean;
  readonly isProcessing?: boolean;
  readonly onClick: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({ isListening, isProcessing = false, onClick }) => {
  return (
    <button
      type="button"
      className="mic-btn"
      title={isListening ? "Listening... Active voice stream" : "Click to Speak"}
      onClick={onClick}
    >
      {/* Dynamic Voice Halo Rings */}
      <div className={`mic-rings ${isListening ? "active" : ""}`} />
      
      {/* Outer audio waveform halo */}
      <div className={`mic-halo-waveform ${isListening ? "active" : ""} ${isProcessing ? "processing" : ""}`}>
        <span className="halo-bar halo-1" />
        <span className="halo-bar halo-2" />
        <span className="halo-bar halo-3" />
        <span className="halo-bar halo-4" />
        <span className="halo-bar halo-5" />
      </div>

      <div className="mic-core">
        <Mic size={20} color="#ffffff" />
      </div>
    </button>
  );
};
