import React, { useState } from "react";
import {
  AudioLines, ChevronDown, ChevronUp, Globe, Mic, Plus, RotateCcw, ShieldCheck, Sparkles,
} from "lucide-react";
import {
  addCustomPhraseMapping,
  resetVoiceProfile,
  saveVoiceProfile,
  type VoiceProfileData,
} from "./voiceProfileStorage.ts";

/**
 * Collapsible Voice Calibration & Accent Studio (Emerald-Mint Gradient Zone <125 lines).
 */
interface VoiceCalibrationCardProps {
  readonly profile: VoiceProfileData;
  readonly isCalibratingWake: boolean;
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
  readonly onStartWakeCalibration: () => void;
  readonly onProfileUpdated: (next: VoiceProfileData) => void;
}

export const VoiceCalibrationCard: React.FC<VoiceCalibrationCardProps> = ({
  profile,
  isCalibratingWake,
  isOpen,
  onToggleOpen,
  onStartWakeCalibration,
  onProfileUpdated,
}) => {
  const [spokenInput, setSpokenInput] = useState("");
  const [targetCommand, setTargetCommand] = useState("git status");

  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spokenInput.trim()) return;
    onProfileUpdated(addCustomPhraseMapping(spokenInput, targetCommand));
    setSpokenInput("");
  };

  return (
    <section className="glass-accordion zone-emerald">
      <button type="button" className="accordion-header" onClick={onToggleOpen}>
        <div className="accordion-title-group">
          <span className="zone-icon-badge emerald">
            <AudioLines size={16} />
          </span>
          <div className="zone-heading">
            <span className="zone-kicker">01 • PERSONAL VOICE &amp; ACCENT</span>
            <span>Voice Calibration &amp; Wake Aliases</span>
          </div>
          <span className="mini-pill">{profile.wakeAliases.length} aliases</span>
          <span className="mini-pill">{profile.speechLang}</span>
        </div>
        {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {isOpen && (
        <div className="accordion-body">
          <div className="calib-controls-row">
            <button type="button" className={`glass-btn emerald-btn ${isCalibratingWake ? "pulsing" : ""}`} onClick={onStartWakeCalibration}>
              <Mic size={15} />
              <span>{isCalibratingWake ? "Speak 'Hey Friday' Now..." : "Teach My Voice"}</span>
            </button>

            <button
              type="button"
              className={`glass-btn ${!profile.requireWakeWord ? "active-teal" : ""}`}
              onClick={() => onProfileUpdated(saveVoiceProfile({ ...profile, requireWakeWord: !profile.requireWakeWord }))}
              title="Direct Mode responds without requiring 'Hey Friday' first"
            >
              <ShieldCheck size={15} />
              <span>{profile.requireWakeWord ? "Wake Gate: Strict" : "Direct Talk: ON"}</span>
            </button>

            <div className="lang-select-wrap" title="Speech Accent Model">
              <Globe size={14} className="icon-emerald" />
              <select
                className="glass-select-mini"
                value={profile.speechLang}
                onChange={(e) => onProfileUpdated(saveVoiceProfile({ ...profile, speechLang: e.target.value as VoiceProfileData["speechLang"] }))}
              >
                <option value="en-IN">en-IN (India)</option>
                <option value="en-US">en-US (US)</option>
                <option value="en-GB">en-GB (UK)</option>
              </select>
            </div>

            <button type="button" className="glass-btn icon-only" title="Reset Voice Profile" onClick={() => onProfileUpdated(resetVoiceProfile())}>
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="alias-chip-list">
            <Sparkles size={13} className="icon-emerald" />
            {profile.wakeAliases.map((alias) => (
              <span key={alias} className="alias-tag">"{alias}"</span>
            ))}
          </div>

          <form className="custom-map-form" onSubmit={handleAddMapping}>
            <input type="text" className="glass-input-sm" value={spokenInput}
              onChange={(e) => setSpokenInput(e.target.value)} placeholder="When browser hears (e.g. 'check get statues')..." />
            <select className="glass-select-sm" value={targetCommand} onChange={(e) => setTargetCommand(e.target.value)}>
              <option value="git status">→ git status</option>
              <option value="mute audio">→ mute audio</option>
              <option value="check system status">→ system status</option>
              <option value="do I need an umbrella in Goa today">→ Goa weather</option>
              <option value="focus mode">→ focus mode</option>
              <option value="lock computer">→ lock PC</option>
            </select>
            <button type="submit" className="glass-btn emerald-btn" title="Save Custom Voice Mapping">
              <Plus size={15} /><span>Map</span>
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
