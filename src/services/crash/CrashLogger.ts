import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCrashEnvironment,
  generateDiagnosticAdvice,
  type StructuredCrashReport,
} from "./crashFormatter.ts";

/**
 * Self-Healing Crash Telemetry Service (Department: Reliability & Diagnostics)
 * Micro-modular singleton (<95 lines).
 */
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
    const crashId = `crash_${epoch}_${Math.random().toString(36).substring(2, 7)}`;
    const filePath = join(this.crashesDir, `${crashId}.json`);

    const errObj =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack ?? "" }
        : { name: "NonErrorThrown", message: String(error), stack: "" };

    const report: StructuredCrashReport = {
      crashId,
      timestamp: new Date(epoch).toISOString(),
      epochMs: epoch,
      runtime: "bun",
      error: errObj,
      environment: buildCrashEnvironment(),
      context: {
        lastQuery: this.lastQuery || undefined,
        component,
        extra: extraContext,
      },
      diagnosticAdvice: generateDiagnosticAdvice(errObj.message, errObj.stack),
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
        if (oldest) unlinkSync(join(this.crashesDir, oldest));
      }
    } catch {
      // Rotation best-effort
    }
  }
}
