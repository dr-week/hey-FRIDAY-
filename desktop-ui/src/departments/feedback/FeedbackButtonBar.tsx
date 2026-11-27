import React, { useState, useEffect } from "react";
import {
  ALL_FRIDAY_INTENTS,
  type FeedbackLogItem,
  type FramingFeedbackStatus,
  type ResponseFeedbackStatus,
  type WakeWordFeedbackStatus,
} from "../../types/widget.ts";

/**
 * Multi-Button Feedback Evaluation Bar (Department: Feedback / RLHF Controls)
 * Separate buttons for: 1) Sentence Framing, 2) Wake-Word, 3) AI Response (<140 lines).
 */
interface FeedbackButtonBarProps {
  readonly rawSpokenText: string;
  readonly normalizedText: string;
  readonly detectedIntent: string;
  readonly aiResponse: string;
  readonly isLocalBackend: boolean;
  readonly onSaveFeedback: (entry: FeedbackLogItem) => void;
}

export const FeedbackButtonBar: React.FC<FeedbackButtonBarProps> = ({
  rawSpokenText,
  normalizedText,
  detectedIntent,
  aiResponse,
  isLocalBackend,
  onSaveFeedback,
}) => {
  const [framingStatus, setFramingStatus] = useState<FramingFeedbackStatus>("unrated");
  const [wakeWordStatus, setWakeWordStatus] = useState<WakeWordFeedbackStatus>("unrated");
  const [responseStatus, setResponseStatus] = useState<ResponseFeedbackStatus>("unrated");
  const [correctedText, setCorrectedText] = useState<string>(normalizedText || rawSpokenText);
  const [expectedIntent, setExpectedIntent] = useState<string>(detectedIntent || "unknown");
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    setFramingStatus("unrated");
    setWakeWordStatus("unrated");
    setResponseStatus("unrated");
    setCorrectedText(normalizedText || rawSpokenText);
    setExpectedIntent(detectedIntent || "unknown");
    setSavedNotice(false);
  }, [rawSpokenText, normalizedText, detectedIntent]);

  const handleSubmit = (
    nextFraming: FramingFeedbackStatus = framingStatus,
    nextWake: WakeWordFeedbackStatus = wakeWordStatus,
    nextResp: ResponseFeedbackStatus = responseStatus
  ) => {
    onSaveFeedback({
      rawSpokenText: rawSpokenText || "(manual test)",
      normalizedText: normalizedText || rawSpokenText || "(manual test)",
      correctedText,
      detectedIntent: detectedIntent || "unknown",
      expectedIntent,
      aiResponse,
      framingStatus: nextFraming,
      wakeWordStatus: nextWake,
      responseStatus: nextResp,
      source: isLocalBackend ? "desktop-local" : "web-pages",
    });
    setSavedNotice(true);
  };

  return (
    <div className="feedback-panel">
      <div className="feedback-panel-header">
        <span className="feedback-title">🧪 Rate Voice Framing, Wake-Word &amp; AI Response (Training Loop)</span>
        {savedNotice && <span className="feedback-saved-badge">✓ Logged to Training Dataset</span>}
      </div>

      <div className="feedback-row">
        <span className="feedback-label">1. Sentence Framing:</span>
        <button type="button" className={`fb-btn ${framingStatus === "correct" ? "active-good" : ""}`}
          onClick={() => { setFramingStatus("correct"); handleSubmit("correct", wakeWordStatus, responseStatus); }}>
          ✅ Framing / Text Correct
        </button>
        <button type="button" className={`fb-btn ${framingStatus === "incorrect" ? "active-bad" : ""}`}
          onClick={() => setFramingStatus("incorrect")}>
          ❌ Framing / Text Wrong
        </button>
      </div>

      <div className="feedback-row">
        <span className="feedback-label">2. "Hey Friday" Wake:</span>
        <button
          type="button"
          className={`fb-btn ${wakeWordStatus === "responded_correctly" ? "active-good" : ""}`}
          onClick={() => { setWakeWordStatus("responded_correctly"); handleSubmit(framingStatus, "responded_correctly", responseStatus); }}
        >
          🎙️ Woke &amp; Responded OK
        </button>
        <button
          type="button"
          className={`fb-btn ${wakeWordStatus === "missed_wake" ? "active-bad" : ""}`}
          onClick={() => { setWakeWordStatus("missed_wake"); handleSubmit(framingStatus, "missed_wake", responseStatus); }}
        >
          🔇 Ignored "Hey Friday"
        </button>
        <button
          type="button"
          className={`fb-btn ${wakeWordStatus === "false_wake" ? "active-warn" : ""}`}
          onClick={() => { setWakeWordStatus("false_wake"); handleSubmit(framingStatus, "false_wake", responseStatus); }}
        >
          ⚠️ False Wake on Noise
        </button>
      </div>

      <div className="feedback-row">
        <span className="feedback-label">3. AI Response:</span>
        <button
          type="button"
          className={`fb-btn ${responseStatus === "accurate" ? "active-good" : ""}`}
          onClick={() => { setResponseStatus("accurate"); handleSubmit(framingStatus, wakeWordStatus, "accurate"); }}
        >
          🎯 Response Accurate
        </button>
        <button
          type="button"
          className={`fb-btn ${responseStatus === "weird_or_wrong" ? "active-bad" : ""}`}
          onClick={() => setResponseStatus("weird_or_wrong")}
        >
          🤖 Responded Weird / Wrong Intent
        </button>
      </div>

      {(framingStatus === "incorrect" || responseStatus === "weird_or_wrong") && (
        <div className="feedback-correction-box">
          <input
            type="text"
            className="fb-input"
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
            placeholder="Type what you actually spoke (Gold Transcript)..."
          />
          <select className="fb-select" value={expectedIntent} onChange={(e) => setExpectedIntent(e.target.value)}>
            {ALL_FRIDAY_INTENTS.map((i) => <option key={i} value={i}>Expected: {i}</option>)}
          </select>
          <button type="button" className="fb-save-btn" onClick={() => handleSubmit(framingStatus, wakeWordStatus, responseStatus)}>
            💾 Save Correction
          </button>
        </div>
      )}
    </div>
  );
};
