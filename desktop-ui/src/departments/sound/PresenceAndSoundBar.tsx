import React, { useEffect, useState } from "react";
import { Bell, Moon, Sparkles, Volume2, VolumeX, Waves } from "lucide-react";
import { isSoundEffectsMuted, playEarcon, setSoundEffectsMuted } from "./soothingSoundEngine.ts";
import {
  getPreferredVoiceName,
  listAvailableVoices,
  setPreferredVoiceName,
  speakWithNaturalVoice,
} from "./naturalTtsEngine.ts";

/**
 * Live Assistant Presence Orb + Soothing Sound & Voice Selector Bar (<135 lines).
 */
export type AssistantPresenceState = "sleeping" | "listening" | "awake" | "thinking" | "speaking";

interface PresenceAndSoundBarProps {
  readonly presence: AssistantPresenceState;
  readonly onToggleWakeState: () => void;
}

const PRESENCE_CONFIG: Record<
  AssistantPresenceState,
  { readonly title: string; readonly subtitle: string; readonly colorClass: string }
> = {
  sleeping: { title: "Sleeping", subtitle: "Tap orb or Mic to wake", colorClass: "state-sleeping" },
  listening: { title: "Listening", subtitle: "Say 'Hey Friday' or command", colorClass: "state-listening" },
  awake: { title: "Woke Up!", subtitle: "Listening closely (8s window)", colorClass: "state-awake" },
  thinking: { title: "Thinking...", subtitle: "Routing through Laya System-1", colorClass: "state-thinking" },
  speaking: { title: "Speaking", subtitle: "Replying aloud", colorClass: "state-speaking" },
};

export const PresenceAndSoundBar: React.FC<PresenceAndSoundBarProps> = ({
  presence,
  onToggleWakeState,
}) => {
  const [sfxMuted, setSfxMuted] = useState<boolean>(() => isSoundEffectsMuted());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => getPreferredVoiceName());

  useEffect(() => {
    const updateVoices = () => setVoices(listAvailableVoices().filter((v) => v.lang.startsWith("en")));
    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const cfg = PRESENCE_CONFIG[presence];

  const handleToggleSfx = () => {
    const next = setSoundEffectsMuted(!sfxMuted);
    setSfxMuted(next);
    if (!next) playEarcon("wake");
  };

  return (
    <div className={`presence-hero-card ${cfg.colorClass}`}>
      <button type="button" className="presence-orb-trigger" onClick={onToggleWakeState} title="Click to Wake or Sleep FRIDAY">
        <div className="orb-visual">
          <div className="orb-halo" />
          {presence === "sleeping" ? <Moon size={20} /> : presence === "speaking" ? <Volume2 size={20} /> : presence === "awake" ? <Sparkles size={20} /> : <Waves size={20} />}
        </div>
        <div className="presence-text">
          <span className="presence-title">{cfg.title}</span>
          <span className="presence-sub">{cfg.subtitle}</span>
        </div>
      </button>

      <div className="sound-studio-controls">
        <button type="button" className="glass-chip-btn" title="Preview Soothing Wake Chime" onClick={() => playEarcon("wake")}>
          <Bell size={13} className="icon-cyan" /><span>Wake Chime</span>
        </button>

        <button type="button" className="glass-chip-btn" title="Preview Soothing Sleep Lullaby" onClick={() => playEarcon("sleep")}>
          <Moon size={13} className="icon-muted" /><span>Sleep Chime</span>
        </button>

        <button type="button" className="glass-chip-btn" title="Test Natural Female Voice Reply"
          onClick={() => { playEarcon("reply"); speakWithNaturalVoice("Hi there! I am Friday, awake and ready to help you."); }}>
          <Volume2 size={13} className="icon-emerald" /><span>Voice Reply</span>
        </button>

        {voices.length > 0 && (
          <select className="glass-select-mini" value={selectedVoice} title="Choose Natural Female TTS Voice"
            onChange={(e) => { setSelectedVoice(e.target.value); setPreferredVoiceName(e.target.value); speakWithNaturalVoice("Voice updated!"); }}>
            <option value="">Auto Best Female Voice</option>
            {voices.slice(0, 14).map((v) => (
              <option key={v.name} value={v.name}>{v.name.replace(/Microsoft |Online \(Natural\) - /g, "")}</option>
            ))}
          </select>
        )}

        <button type="button" className="glass-btn icon-only" title={sfxMuted ? "Unmute Sound Effects" : "Mute Sound Effects"} onClick={handleToggleSfx}>
          {sfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="icon-cyan" />}
        </button>
      </div>
    </div>
  );
};
