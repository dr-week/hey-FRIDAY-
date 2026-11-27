import type { WakeGateMatchType } from "../../types/widget.ts";
import { loadVoiceProfile } from "../calibration/voiceProfileStorage.ts";
import { normalizeSpokenSentence } from "./sentenceNormalizer.ts";

/**
 * Conversational Two-Turn Wake-Word Gate + Custom Voice Alias Matcher
 * Supports user-trained wake aliases, custom phrase mappings, and Direct-Talk mode (<105 lines).
 */

export interface WakeGateEvaluation {
  readonly accepted: boolean;
  readonly commandText: string;
  readonly rawText: string;
  readonly normalizedText: string;
  readonly wasRepaired: boolean;
  readonly matchType: WakeGateMatchType;
  readonly shouldArmFollowupWindow: boolean;
}

export function evaluateWakeWordGate(
  rawTranscript: string,
  options: {
    readonly isManualTrigger: boolean;
    readonly isArmedWindowActive: boolean;
  }
): WakeGateEvaluation {
  const profile = loadVoiceProfile();
  const { rawText, normalizedText: baseNormalized, wasRepaired: baseRepaired } =
    normalizeSpokenSentence(rawTranscript);

  let normalizedText = baseNormalized;
  let wasRepaired = baseRepaired;
  const lower = normalizedText.toLowerCase();

  // 0. Apply user's learned custom command mappings
  for (const mapping of profile.customMappings) {
    if (lower.includes(mapping.spokenPhrase)) {
      normalizedText = mapping.targetCommand;
      wasRepaired = true;
      break;
    }
  }

  // Build dynamic regex from user's calibrated wake aliases
  const escapedAliases = profile.wakeAliases
    .map((a) => a.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter(Boolean);
  const aliasGroup = escapedAliases.join("|") || "hey\\s+friday|friday";

  const wakeOnlyRegex = new RegExp(`^(?:so\\s+|um\\s+|uh\\s+|well\\s+)?(?:${aliasGroup})[.!?,]*$`, "i");
  const wakeInlineRegex = new RegExp(`(?:^|\\b)(?:${aliasGroup})[\\s,.!?]+(.+)$`, "i");

  // 1. User just said "Hey Friday" (or their calibrated wake alias) -> Arm 8s follow-up window!
  if (wakeOnlyRegex.test(normalizedText)) {
    return {
      accepted: false,
      commandText: "",
      rawText,
      normalizedText,
      wasRepaired,
      matchType: "wake_word_only_armed",
      shouldArmFollowupWindow: true,
    };
  }

  // 2. Wake word + command spoken in one sentence ("Hey Friday mute audio")
  const inlineMatch = normalizedText.match(wakeInlineRegex);
  if (inlineMatch && inlineMatch[1]) {
    return {
      accepted: true,
      commandText: inlineMatch[1].trim(),
      rawText,
      normalizedText,
      wasRepaired,
      matchType: "wake_word_inline",
      shouldArmFollowupWindow: false,
    };
  }

  // 3. Direct Mode (requireWakeWord === false) OR Manual Push-to-Talk OR 8s Armed Window
  if (!profile.requireWakeWord || options.isManualTrigger || options.isArmedWindowActive) {
    const clean = normalizedText.replace(new RegExp(`^(?:${aliasGroup})[,.\\s]*`, "i"), "").trim();
    return {
      accepted: clean.length > 0,
      commandText: clean || normalizedText,
      rawText,
      normalizedText,
      wasRepaired,
      matchType: options.isArmedWindowActive ? "armed_session_followup" : "manual_push_to_talk",
      shouldArmFollowupWindow: false,
    };
  }

  // 4. Strict Wake Mode enabled and no wake word matched
  return {
    accepted: false,
    commandText: "",
    rawText,
    normalizedText,
    wasRepaired,
    matchType: "rejected_no_wake",
    shouldArmFollowupWindow: false,
  };
}
