/**
 * Cute & Soothing WebAudio Earcon Synthesizer (Department: Sound / Earcons)
 * Inspired by `sukelully/unwind-chimes`, `mandip42/earcons-mini-500`, and `GenX0Gravity/Echoes`.
 * Synthesizes warm, musical kalimba/marimba chimes in 0ms with zero external audio files (<125 lines).
 */

export type FridayEarconType = "wake" | "listen" | "sleep" | "success" | "reply" | "gentle_error";

const SOUND_MUTE_KEY = "hey_friday_sfx_muted";
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function isSoundEffectsMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_MUTE_KEY) === "true";
}

export function setSoundEffectsMuted(muted: boolean): boolean {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SOUND_MUTE_KEY, muted ? "true" : "false");
  }
  return muted;
}

/**
 * Plays a single warm marimba/kalimba harmonic note with ADSR decay and low-pass filtering
 */
function playSoothingNote(
  ctx: AudioContext,
  freqHz: number,
  startOffsetSec: number,
  durationSec: number,
  peakGain: number = 0.14
): void {
  const now = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const subOsc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  // Warm fundamental sine + subtle octave harmonic triangle
  osc.type = "sine";
  osc.frequency.setValueAtTime(freqHz, now);
  subOsc.type = "triangle";
  subOsc.frequency.setValueAtTime(freqHz * 1.5, now);

  // Warmth filter removes harsh digital treble
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1850, now);

  // Soft attack (14ms) + natural exponential bell decay
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.016);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(peakGain * 0.18, now);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 0.7);

  osc.connect(filter);
  subOsc.connect(subGain);
  subGain.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  subOsc.start(now);
  osc.stop(now + durationSec + 0.02);
  subOsc.stop(now + durationSec + 0.02);
}

export function playEarcon(type: FridayEarconType): void {
  if (isSoundEffectsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (type) {
    case "wake":
      // Cute ascending pentatonic bloom (C5 -> E5 -> G5 -> A5)
      playSoothingNote(ctx, 523.25, 0.0, 0.24, 0.13);
      playSoothingNote(ctx, 659.25, 0.07, 0.26, 0.14);
      playSoothingNote(ctx, 783.99, 0.14, 0.34, 0.15);
      playSoothingNote(ctx, 880.0, 0.21, 0.45, 0.13);
      break;

    case "listen":
      // Gentle water-drop dual chime (D5 -> A5)
      playSoothingNote(ctx, 587.33, 0.0, 0.22, 0.12);
      playSoothingNote(ctx, 880.0, 0.08, 0.32, 0.13);
      break;

    case "sleep":
      // Soft descending lullaby chord (G5 -> E5 -> C5)
      playSoothingNote(ctx, 783.99, 0.0, 0.22, 0.11);
      playSoothingNote(ctx, 659.25, 0.09, 0.25, 0.11);
      playSoothingNote(ctx, 523.25, 0.18, 0.38, 0.1);
      break;

    case "success":
    case "reply":
      // Sparkling major confirmation bell (E5 -> B5)
      playSoothingNote(ctx, 659.25, 0.0, 0.2, 0.11);
      playSoothingNote(ctx, 987.77, 0.06, 0.34, 0.12);
      break;

    case "gentle_error":
      // Warm wooden double-tap (F4 -> D4) — never harsh
      playSoothingNote(ctx, 349.23, 0.0, 0.18, 0.11);
      playSoothingNote(ctx, 293.66, 0.11, 0.26, 0.11);
      break;
  }
}
