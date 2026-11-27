import { existsSync } from "node:fs";
import type { LayaDecisionResult } from "./types.ts";

interface PendingRequest {
  readonly resolve: (result: LayaDecisionResult) => void;
  readonly reject: (err: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

/**
 * Strict TypeScript Controller for Laya Decision Engine (<140 lines).
 * Communicates with Laya via sub-millisecond local stdio stream with correlated request IDs.
 */
export class LayaEngine {
  private proc: ReturnType<typeof Bun.spawn> | null = null;
  private isReady: boolean = false;
  private requestCounter: number = 0;
  private readonly pendingMap: Map<string, PendingRequest> = new Map();
  private readerPromise: Promise<void> | null = null;

  private resolvePythonExecutable(): string {
    if (process.platform === "win32") {
      return existsSync(".\\.venv\\Scripts\\python.exe") ? ".\\.venv\\Scripts\\python.exe" : "python";
    }
    return existsSync("./.venv/bin/python") ? "./.venv/bin/python" : "python3";
  }

  public async start(): Promise<void> {
    this.proc = Bun.spawn([this.resolvePythonExecutable(), "bridge/laya_bridge.py"], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "inherit",
    });
    this.readerPromise = this.listenToOutput();

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("LayaEngine initialization timed out waiting for ready signal."));
      }, 15000);
      const checkInterval = setInterval(() => {
        if (this.isReady) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve();
        }
      }, 15);
    });
  }

  private async listenToOutput(): Promise<void> {
    if (!this.proc || typeof this.proc.stdout !== "object" || !this.proc.stdout || !("getReader" in this.proc.stdout)) {
      return;
    }
    const reader = this.proc.stdout.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as { status?: string; requestId?: string; error?: string } & LayaDecisionResult;
            if (parsed.status === "ready") {
              this.isReady = true;
              continue;
            }
            const targetId = parsed.requestId ?? this.pendingMap.keys().next().value;
            if (targetId && this.pendingMap.has(targetId)) {
              const entry = this.pendingMap.get(targetId)!;
              clearTimeout(entry.timer);
              this.pendingMap.delete(targetId);
              if (parsed.error) entry.reject(new Error(parsed.error));
              else entry.resolve(parsed as LayaDecisionResult);
            }
          } catch {
            // Non-JSON log line
          }
        }
      }
    } catch {
      // Stream closed
    }
  }

  public async decide(query: string, timeoutMs: number = 5000): Promise<LayaDecisionResult> {
    if (!this.proc || typeof this.proc.stdin !== "object" || !this.proc.stdin || !("write" in this.proc.stdin)) {
      throw new Error("LayaEngine process is not running. Call start() first.");
    }
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;
    const payload = JSON.stringify({ requestId, query }) + "\n";
    const stdin = this.proc.stdin;

    return new Promise<LayaDecisionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingMap.has(requestId)) {
          this.pendingMap.delete(requestId);
          reject(new Error(`Laya decision timed out after ${timeoutMs}ms for query: "${query}"`));
        }
      }, timeoutMs);
      this.pendingMap.set(requestId, { resolve, reject, timer });
      stdin.write(new TextEncoder().encode(payload));
      stdin.flush();
    });
  }

  public stop(): void {
    for (const [id, entry] of this.pendingMap.entries()) {
      clearTimeout(entry.timer);
      entry.reject(new Error("LayaEngine stopped."));
      this.pendingMap.delete(id);
    }
    if (this.proc && typeof this.proc.stdin === "object" && this.proc.stdin && "write" in this.proc.stdin) {
      try {
        this.proc.stdin.write(new TextEncoder().encode("EXIT\n"));
        this.proc.stdin.flush();
      } catch {}
      this.proc.kill();
    }
  }
}
