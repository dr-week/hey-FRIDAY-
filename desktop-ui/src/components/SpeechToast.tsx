import React from "react";

interface SpeechToastProps {
  readonly text: string;
}

export const SpeechToast: React.FC<SpeechToastProps> = ({ text }) => {
  if (!text) return null;
  return <div className="speech-toast">{text}</div>;
};
