import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

export class CrashLogger {
  private static instance: CrashLogger | null = null;
  private readonly crashesDir: string;
  private lastQuery: string = "";

  private constructor(crashesDir: string = "data/crashes") {
    this.crashesDir = crashesDir;
    if (!existsSync(this.crashesDir)) {
      mkdirSync(this.crashesDir, { recursive: true });
    }
  }

  public static initialize(crashesDir: string = "data/crashes"): CrashLogger {
    if (!CrashLogger.instance) {
      CrashLogger.instance = new CrashLogger(crashesDir);
      CrashLogger.instance.attachGlobalHandlers();
    }
    return CrashLogger.instance;
  }

  public setLastQuery(query: string): void {
    this.lastQuery = query;
  }

  public recordCrash(
    error: Error | unknown,
    component: string = "core",
    extraContext?: Record<string, unknown>
  ): string {
    const epoch = Date.now();
    const isoDate = new Date(epoch).toISOString();
    const crashId = `crash_${epoch}_${Math.random().toString(36).substring(2, 7)}`;
    const filename = `${crashId}.json`;
    const filePath = join(this.crashesDir, filename);

    const errObj = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack ?? "" }
      : { name: "NonErrorThrown", message: String(error), stack: "" };

    const mem = process.memoryUsage();
    const envInfo: CrashEnvironmentInfo = {
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

    // Automated diagnostic recommendations
    const advice: string[] = [];
    const msg = errObj.message.toLowerCase();
    const stack = errObj.stack.toLowerCase();

    if (msg.includes("enoent") || stack.includes("enoent")) {
      advice.push("Missing file or binary. Check relative paths or ensure .venv / bun paths exist.");
    }
    if (msg.includes("sqlite") || stack.includes("sqlite")) {
      advice.push("Database lock or schema issue. Verify data/friday.sqlite permissions.");
    }
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("econnrefused")) {
      advice.push("Network connectivity failure to external API (e.g. Open-Meteo).");
    }
    if (msg.includes("laya") || stack.includes("laya")) {
      advice.push("Laya bridge IPC failure. Verify python virtual environment in .venv.");
    }
    if (advice.length === 0) {
      advice.push("Inspect stack trace and examine input parameters in context.");
    }

    const report: StructuredCrashReport = {
      crashId,
      timestamp: isoDate,
      epochMs: epoch,
      runtime: "bun",
      error: errObj,
      environment: envInfo,
      context: {
        lastQuery: this.lastQuery || undefined,
        component,
        extra: extraContext,
      },
      diagnosticAdvice: advice,
    };

    try {
      writeFileSync(filePath, JSON.stringify(report, null, 2), "utf-8");
      this.rotateCrashes(20);
      console.error(`\n🚨 [CRASH DETECTED] Structured report written to: ${filePath}`);
    } catch (writeErr) {
      console.error("Failed to write crash log:", writeErr);
    }

    return filePath;
  }

  private attachGlobalHandlers(): void {
    process.on("uncaughtException", (err: Error) => {
      this.recordCrash(err, "uncaughtException");
    });

    process.on("unhandledRejection", (reason: unknown) => {
      this.recordCrash(reason, "unhandledRejection");
    });
  }

  private rotateCrashes(maxKeep: number): void {
    try {
      const files = readdirSync(this.crashesDir)
        .filter((f) => f.startsWith("crash_") && f.endsWith(".json"))
        .sort();

      while (files.length > maxKeep) {
        const oldest = files.shift();
        if (oldest) {
          unlinkSync(join(this.crashesDir, oldest));
        }
      }
    } catch {
      // Rotation best-effort
    }
  }
}
