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

export interface LayaAnswers {
  readonly intent: {
    readonly choice: FridayIntent;
    readonly confidence?: number;
  };
}

export interface LayaDecisionResult {
  readonly text: string;
  readonly answers: LayaAnswers;
  readonly modelUsed: string;
  readonly latencyMs: number;
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
