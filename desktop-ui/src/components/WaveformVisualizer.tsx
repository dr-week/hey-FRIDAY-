import React from "react";

interface WaveformVisualizerProps {
  readonly isListening: boolean;
  readonly isProcessing?: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isListening,
  isProcessing = false,
}) => {
  return (
    <div
      className={`waveform-container ${isListening ? "active" : ""} ${isProcessing ? "processing" : ""}`}
      title={isListening ? "Listening... Active voice stream" : isProcessing ? "Processing command..." : "Passive standby"}
    >
      <div className="waveform-glow-bg" />
      <div className="wave-bars">
        <span className="wave-bar bar-1" />
        <span className="wave-bar bar-2" />
        <span className="wave-bar bar-3" />
        <span className="wave-bar bar-4" />
        <span className="wave-bar bar-5" />
        <span className="wave-bar bar-6" />
        <span className="wave-bar bar-7" />
      </div>
    </div>
  );
};
