export interface CrashEnvironmentInfo {
  readonly os: string;
  readonly platform: string;
  readonly arch: string;
  readonly runtimeVersion: string;
  readonly uptimeSeconds: number;
  readonly memory: {
    readonly heapUsedMb: number;
    readonly heapTotalMb: number;
    readonly rssMb: number;
  };
}

export interface StructuredCrashReport {
  readonly crashId: string;
  readonly timestamp: string;
  readonly epochMs: number;
  readonly runtime: "bun" | "python";
  readonly error: {
    readonly name: string;
    readonly message: string;
    readonly stack: string;
  };
  readonly environment: CrashEnvironmentInfo;
  readonly context: {
    readonly lastQuery?: string;
    readonly component: string;
    readonly extra?: Record<string, unknown>;
  };
  readonly diagnosticAdvice: string[];
}

export function buildCrashEnvironment(): CrashEnvironmentInfo {
  const mem = process.memoryUsage();
  return {
    os: `${process.platform} (${process.arch})`,
    platform: process.platform,
    arch: process.arch,
    runtimeVersion: `Bun ${typeof Bun !== "undefined" ? Bun.version : "unknown"}`,
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    },
  };
}

export function generateDiagnosticAdvice(message: string, stack: string): string[] {
  const advice: string[] = [];
  const msg = message.toLowerCase();
  const stk = stack.toLowerCase();

  if (msg.includes("enoent") || stk.includes("enoent")) {
    advice.push("Missing file or binary. Check relative paths or ensure .venv / bun paths exist.");
  }
  if (msg.includes("sqlite") || stk.includes("sqlite")) {
    advice.push("Database lock or schema issue. Verify data/friday.sqlite permissions.");
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("econnrefused")) {
    advice.push("Network connectivity failure to external API (e.g. Open-Meteo).");
  }
  if (msg.includes("laya") || stk.includes("laya")) {
    advice.push("Laya bridge IPC failure. Verify python virtual environment in .venv.");
  }
  if (advice.length === 0) {
    advice.push("Inspect stack trace and examine input parameters in context.");
  }
  return advice;
}
