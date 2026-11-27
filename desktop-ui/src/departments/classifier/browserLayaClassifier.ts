import type { ExecutionTelemetryMeta, FridayIntentType } from "../../types/widget.ts";
import { normalizeSpokenSentence } from "../speech/sentenceNormalizer.ts";

/**
 * In-Browser Laya System-1 Decision Emulator (Department: Classifier / Web Hosting)
 * Powers instant (<2ms) testing on GitHub Pages when local port 4141 is offline (<130 lines).
 */

interface IntentRule {
  readonly intent: FridayIntentType;
  readonly keywords: readonly string[];
  readonly response: string;
  readonly isDestructive?: boolean;
}

const BROWSER_INTENT_RULES: readonly IntentRule[] = [
  {
    intent: "voice_macro",
    keywords: ["focus mode", "standup prep", "coding mode"],
    response: 'Executed learned voice macro: Toggled system audio mute & verified git working tree clean.',
  },
  {
    intent: "system_volume_mute",
    keywords: ["mute audio", "mute sound", "unmute", "silence", "sound off", "mute"],
    response: "Toggled system audio mute (Win32 user32.dll FFI).",
  },
  {
    intent: "system_volume_up",
    keywords: ["volume up", "increase volume", "louder", "raise volume"],
    response: "Volume increased by 10%.",
  },
  {
    intent: "system_volume_down",
    keywords: ["volume down", "decrease volume", "softer", "lower sound"],
    response: "Volume decreased by 10%.",
  },
  {
    intent: "media_play_pause",
    keywords: ["pause music", "pause song", "play music", "resume music", "play song"],
    response: "Media play/pause toggled.",
  },
  {
    intent: "media_next",
    keywords: ["next song", "skip track", "next track"],
    response: "Skipped to next track.",
  },
  {
    intent: "media_prev",
    keywords: ["previous song", "restart track", "prev track", "previous track"],
    response: "Playing previous track.",
  },
  {
    intent: "system_lock",
    keywords: ["lock computer", "lock screen", "lock pc", "lock workstation"],
    response: "Locking workstation via user32.dll LockWorkStation.",
    isDestructive: true,
  },
  {
    intent: "system_empty_bin",
    keywords: ["empty recycle bin", "empty bin", "clear trash"],
    response: "Recycle bin emptied.",
    isDestructive: true,
  },
  {
    intent: "system_screenshot",
    keywords: ["take screenshot", "capture screen", "snip screen", "screenshot"],
    response: "Screenshot captured and saved to Pictures folder.",
  },
  {
    intent: "system_status",
    keywords: ["check system status", "system status", "battery status", "ram status", "hardware health"],
    response: "All systems operational. RAM: 3.8 GB of 16.0 GB used. Battery is at 94 percent.",
  },
  {
    intent: "dev_git_status",
    keywords: ["git status", "check git", "repo status"],
    response: "Git working tree clean. Branch main is up to date.",
  },
  {
    intent: "dev_run_tests",
    keywords: ["run test", "run tests", "test suite", "bun test"],
    response: "All 8 Bun test suites (33 assertions) passed cleanly with zero errors.",
  },
  {
    intent: "dev_port_check",
    keywords: ["check port", "server port", "port 4141"],
    response: "Port 4141 is active and listening.",
  },
  {
    intent: "weather_check",
    keywords: ["weather", "temperature", "umbrella", "forecast", "rain"],
    response: "In Goa (Panaji), it's currently 29.4 degrees Celsius and mainly clear. Rain probability is low (10%), no umbrella needed.",
  },
  {
    intent: "smalltalk",
    keywords: ["hello", "hi friday", "hey friday", "who are you", "how are you"],
    response: "Hey there! I am Friday, your zero-latency System-1 desktop command assistant.",
  },
];

export function evaluateInBrowserLaya(rawQuery: string): {
  readonly response: string;
  readonly meta: ExecutionTelemetryMeta;
} {
  const t0 = performance.now();
  const { normalizedText } = normalizeSpokenSentence(rawQuery);
  const lower = normalizedText.toLowerCase();

  for (const rule of BROWSER_INTENT_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const latencyMs = Math.max(1, Math.round((performance.now() - t0) * 100) / 100);
      return {
        response: rule.response,
        meta: {
          query: rawQuery,
          normalizedQuery: normalizedText,
          intent: rule.intent,
          response: rule.response,
          latencyMs,
          modelUsed: "browser_laya_system1",
          route: "auto",
          isDestructive: Boolean(rule.isDestructive),
        },
      };
    }
  }

  const fallbackResponse = `Unrecognized or ambiguous query: "${normalizedText}". Flagged for conformal review.`;
  return {
    response: fallbackResponse,
    meta: {
      query: rawQuery,
      normalizedQuery: normalizedText,
      intent: "unknown",
      response: fallbackResponse,
      latencyMs: 1,
      modelUsed: "browser_laya_system1",
      route: "review",
      isDestructive: false,
    },
  };
}
