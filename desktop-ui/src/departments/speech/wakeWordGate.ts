import type { WakeGateMatchType } from "../../types/widget.ts";
import { normalizeSpokenSentence } from "./sentenceNormalizer.ts";

/**
 * Conversational Two-Turn Wake-Word Gate (Department: Speech / Wake Protocol)
 * Solves the problem where a user says "Hey Friday" (pauses) and then speaks the command,
 * or puts filler words ("so hey friday can you mute audio") before the wake word (<90 lines).
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

const WAKE_ONLY_REGEX = /^(?:so\s+|um\s+|uh\s+|well\s+)?(?:hey\s+friday|friday|ok\s+friday|hi\s+friday)[.!?,]*$/i;
const WAKE_INLINE_REGEX = /(?:^|\b)(?:hey\s+friday|friday|ok\s+friday|hi\s+friday)[\s,.!?]+(.+)$/i;

export function evaluateWakeWordGate(
  rawTranscript: string,
  options: {
    readonly isManualTrigger: boolean;
    readonly isArmedWindowActive: boolean;
  }
): WakeGateEvaluation {
  const { rawText, normalizedText, wasRepaired } = normalizeSpokenSentence(rawTranscript);

  // 1. User just said "Hey Friday" by itself -> Arm 6-second listening window!
  if (WAKE_ONLY_REGEX.test(normalizedText)) {
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

  // 2. Wake word + command spoken in the same sentence ("Hey Friday check git status")
  const inlineMatch = normalizedText.match(WAKE_INLINE_REGEX);
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

  // 3. Manual Push-to-Talk (Mic click or Ctrl+Shift+Space)
  if (options.isManualTrigger) {
    const clean = normalizedText.replace(/^(?:hey\s+)?friday[,.\s]*/i, "").trim();
    return {
      accepted: clean.length > 0,
      commandText: clean || normalizedText,
      rawText,
      normalizedText,
      wasRepaired,
      matchType: "manual_push_to_talk",
      shouldArmFollowupWindow: false,
    };
  }

  // 4. Armed 6-second conversational follow-up window after saying "Hey Friday"
  if (options.isArmedWindowActive && normalizedText.length > 0) {
    return {
      accepted: true,
      commandText: normalizedText,
      rawText,
      normalizedText,
      wasRepaired,
      matchType: "armed_session_followup",
      shouldArmFollowupWindow: false,
    };
  }

  // 5. Rejected ambient chatter (no wake word detected)
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
