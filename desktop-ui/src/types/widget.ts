export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface ApiResponse<T = unknown> {
  readonly status: "ok" | "error" | "terminating";
  readonly query?: string;
  readonly response?: string;
  readonly message?: string;
  readonly data?: T;
}
