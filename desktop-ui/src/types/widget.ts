export interface Position {
  readonly x: number;
  readonly y: number;
}

export type FridayIntentType =
  | "system_volume_mute"
  | "system_volume_up"
  | "system_volume_down"
  | "media_play_pause"
  | "media_next"
  | "media_prev"
  | "system_lock"
  | "system_empty_bin"
  | "system_screenshot"
  | "system_status"
  | "dev_git_status"
  | "dev_run_tests"
  | "dev_port_check"
  | "weather_check"
  | "smalltalk"
  | "voice_macro"
  | "unknown";

export const ALL_FRIDAY_INTENTS: readonly FridayIntentType[] = [
  "system_volume_mute",
  "system_volume_up",
  "system_volume_down",
  "media_play_pause",
  "media_next",
  "media_prev",
  "system_lock",
  "system_empty_bin",
  "system_screenshot",
  "system_status",
  "dev_git_status",
  "dev_run_tests",
  "dev_port_check",
  "weather_check",
  "smalltalk",
  "voice_macro",
  "unknown",
];

export type WakeGateMatchType =
  | "wake_word_inline"
  | "armed_session_followup"
  | "wake_word_only_armed"
  | "manual_push_to_talk"
  | "rejected_no_wake";

export interface ExecutionTelemetryMeta {
  readonly query: string;
  readonly rawSpokenText?: string;
  readonly normalizedQuery?: string;
  readonly wakeMatchType?: WakeGateMatchType;
  readonly intent: string;
  readonly response: string;
  readonly latencyMs: number;
  readonly modelUsed: string;
  readonly route: "auto" | "review";
  readonly isDestructive: boolean;
}

export type FramingFeedbackStatus = "correct" | "incorrect" | "unrated";
export type WakeWordFeedbackStatus = "responded_correctly" | "missed_wake" | "false_wake" | "unrated";
export type ResponseFeedbackStatus = "accurate" | "weird_or_wrong" | "unrated";

export interface FeedbackLogItem {
  readonly id?: number;
  readonly rawSpokenText: string;
  readonly normalizedText: string;
  readonly correctedText?: string;
  readonly detectedIntent: string;
  readonly expectedIntent: string;
  readonly aiResponse: string;
  readonly framingStatus: FramingFeedbackStatus;
  readonly wakeWordStatus: WakeWordFeedbackStatus;
  readonly responseStatus: ResponseFeedbackStatus;
  readonly notes?: string;
  readonly source?: "web-pages" | "desktop-local";
  readonly createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  readonly status: "ok" | "error" | "terminating";
  readonly query?: string;
  readonly response?: string;
  readonly meta?: ExecutionTelemetryMeta;
  readonly message?: string;
  readonly data?: T;
}
