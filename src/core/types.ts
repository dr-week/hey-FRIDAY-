/**
 * Strict TypeScript Domain Definitions for Hey Friday
 * Zero loose types, zero `any`.
 */

export type FridayIntent = 
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
  | "unknown";

export interface DecisionQuery {
  readonly rawText: string;
  readonly timestamp: number;
}

export interface LayaIntentAnswer {
  readonly choice: FridayIntent;
  readonly confidence?: number;
  readonly predictionSet?: readonly FridayIntent[];
  readonly abstain?: boolean;
  readonly unbound?: boolean;
  readonly route?: "auto" | "review";
}

export interface LayaSafetyGateAnswer {
  readonly isDestructive: boolean;
  readonly probability: number;
}

export interface LayaAnswers {
  readonly intent: LayaIntentAnswer;
  readonly safetyGate?: LayaSafetyGateAnswer;
}

export interface LayaDecisionResult {
  readonly requestId?: string;
  readonly text: string;
  readonly normalizedText?: string;
  readonly answers: LayaAnswers;
  readonly modelUsed: string;
  readonly latencyMs: number;
}

export interface VoiceMacro {
  readonly id?: number;
  readonly triggerPhrase: string;
  readonly steps: readonly string[];
  readonly description: string;
  readonly createdAt?: string;
}

export interface QueryExecutionMeta {
  readonly query: string;
  readonly normalizedQuery?: string;
  readonly intent: FridayIntent | "voice_macro";
  readonly response: string;
  readonly latencyMs: number;
  readonly modelUsed: string;
  readonly route: "auto" | "review";
  readonly isDestructive: boolean;
}

export type FramingFeedbackStatus = "correct" | "incorrect" | "unrated";
export type WakeWordFeedbackStatus = "responded_correctly" | "missed_wake" | "false_wake" | "unrated";
export type ResponseFeedbackStatus = "accurate" | "weird_or_wrong" | "unrated";

export interface FeedbackLogEntry {
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

export interface WeatherData {
  readonly city: string;
  readonly temperatureC: number;
  readonly weatherCode: number;
  readonly isRaining: boolean;
  readonly rainProbability: number;
  readonly summary: string;
}

export interface UserPreferences {
  readonly defaultCity: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly speechSpeed: number;
}
