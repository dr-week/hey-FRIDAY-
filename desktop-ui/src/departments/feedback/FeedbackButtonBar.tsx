import React, { useState, useEffect } from "react";
import {
  AlertTriangle, Bot, Check, CheckCircle2, Ear, EarOff, FileText, Save, ThumbsDown, ThumbsUp, XCircle,
} from "lucide-react";
import {
  ALL_FRIDAY_INTENTS,
  type FeedbackLogItem,
  type FramingFeedbackStatus,
  type ResponseFeedbackStatus,
  type WakeWordFeedbackStatus,
} from "../../types/widget.ts";

/**
 * Icon-Driven Feedback Evaluation Bar (Department: Feedback / RLHF Controls <135 lines).
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
      rawSpokenText: rawSpokenText || "(test)",
      normalizedText: normalizedText || rawSpokenText || "(test)",
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
    <div className="icon-feedback-grid">
      <div className="fb-card">
        <div className="fb-card-head"><FileText size={14} className="icon-cyan" /><span>Framing</span></div>
        <div className="fb-pill-pair">
          <button type="button" className={`icon-pill-btn ${framingStatus === "correct" ? "good" : ""}`}
            onClick={() => { setFramingStatus("correct"); handleSubmit("correct", wakeWordStatus, responseStatus); }}>
            <CheckCircle2 size={15} /><span>Exact</span>
          </button>
          <button type="button" className={`icon-pill-btn ${framingStatus === "incorrect" ? "bad" : ""}`}
            onClick={() => setFramingStatus("incorrect")}>
            <XCircle size={15} /><span>Fix</span>
          </button>
        </div>
      </div>

      <div className="fb-card">
        <div className="fb-card-head"><Ear size={14} className="icon-cyan" /><span>Wake Call</span></div>
        <div className="fb-pill-pair">
          <button type="button" className={`icon-pill-btn ${wakeWordStatus === "responded_correctly" ? "good" : ""}`}
            onClick={() => { setWakeWordStatus("responded_correctly"); handleSubmit(framingStatus, "responded_correctly", responseStatus); }}>
            <Ear size={15} /><span>Woke</span>
          </button>
          <button type="button" className={`icon-pill-btn ${wakeWordStatus === "missed_wake" ? "bad" : ""}`}
            onClick={() => { setWakeWordStatus("missed_wake"); handleSubmit(framingStatus, "missed_wake", responseStatus); }}>
            <EarOff size={15} /><span>Missed</span>
          </button>
          <button type="button" className={`icon-pill-btn ${wakeWordStatus === "false_wake" ? "warn" : ""}`}
            onClick={() => { setWakeWordStatus("false_wake"); handleSubmit(framingStatus, "false_wake", responseStatus); }}>
            <AlertTriangle size={15} /><span>Noise</span>
          </button>
        </div>
      </div>

      <div className="fb-card">
        <div className="fb-card-head">
          <Bot size={14} className="icon-cyan" /><span>AI Reply</span>
          {savedNotice && <Check size={14} className="icon-emerald" />}
        </div>
        <div className="fb-pill-pair">
          <button type="button" className={`icon-pill-btn ${responseStatus === "accurate" ? "good" : ""}`}
            onClick={() => { setResponseStatus("accurate"); handleSubmit(framingStatus, wakeWordStatus, "accurate"); }}>
            <ThumbsUp size={15} /><span>Good</span>
          </button>
          <button type="button" className={`icon-pill-btn ${responseStatus === "weird_or_wrong" ? "bad" : ""}`}
            onClick={() => setResponseStatus("weird_or_wrong")}>
            <ThumbsDown size={15} /><span>Weird</span>
          </button>
        </div>
      </div>

      {(framingStatus === "incorrect" || responseStatus === "weird_or_wrong") && (
        <div className="fb-inline-fix">
          <input type="text" className="glass-input-sm" value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)} placeholder="True spoken words..." />
          <select className="glass-select-sm" value={expectedIntent} onChange={(e) => setExpectedIntent(e.target.value)}>
            {ALL_FRIDAY_INTENTS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <button type="button" className="glass-btn primary" onClick={() => handleSubmit(framingStatus, wakeWordStatus, responseStatus)}>
            <Save size={14} /><span>Save</span>
          </button>
        </div>
      )}
    </div>
  );
};
