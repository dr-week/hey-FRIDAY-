import React, { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  readonly isListening: boolean;
  readonly isProcessing?: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isListening,
  isProcessing = false,
}) => {
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (!isListening || typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      // Clear inline heights so CSS fallback animations take over
      for (const el of barRefs.current) {
        if (el) el.style.height = "";
      }
      return;
    }

    let cancelled = false;
    let animId = 0;
    let audioCtx: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStream = stream;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const renderFrame = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(dataArray);
          for (let i = 0; i < 7; i++) {
            const barEl = barRefs.current[i];
            if (barEl) {
              const val = dataArray[i + 1] ?? 0;
              const px = Math.max(4, Math.min(20, Math.round((val / 255) * 20)));
              barEl.style.height = `${px}px`;
            }
          }
          animId = requestAnimationFrame(renderFrame);
        };

        animId = requestAnimationFrame(renderFrame);
      })
      .catch(() => {
        // Fallback smoothly to CSS keyframes if mic stream is unavailable
      });

    return () => {
      cancelled = true;
      if (animId) cancelAnimationFrame(animId);
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      for (const el of barRefs.current) {
        if (el) el.style.height = "";
      }
    };
  }, [isListening]);

  return (
    <div
      className={`waveform-container ${isListening ? "active" : ""} ${isProcessing ? "processing" : ""}`}
      title={
        isListening
          ? "Listening... Active WebAudio FFT stream"
          : isProcessing
            ? "Processing command..."
            : "Passive standby"
      }
    >
      <div className="waveform-glow-bg" />
      <div className="wave-bars">
        {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
          <span
            key={idx}
            ref={(el) => {
              barRefs.current[idx] = el;
            }}
            className={`wave-bar bar-${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
