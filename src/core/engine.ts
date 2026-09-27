import type { LayaDecisionResult } from "./types.ts";

/**
 * Strict TypeScript Controller for Laya Decision Engine
 * Communicates with Laya via sub-millisecond local stdio stream.
 */
export class LayaEngine {
  private proc: ReturnType<typeof Bun.spawn> | null = null;
  private isReady: boolean = false;
  private pendingResolver: ((result: LayaDecisionResult) => void) | null = null;
  private readerPromise: Promise<void> | null = null;

  public async start(): Promise<void> {
    const pythonExe = process.platform === "win32"
      ? ".\\.venv\\Scripts\\python.exe"
      : "./.venv/bin/python";

    this.proc = Bun.spawn([pythonExe, "bridge/laya_bridge.py"], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "inherit",
    });

    this.readerPromise = this.listenToOutput();

    // Wait until bridge reports ready
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isReady) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 20);
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
        // Keep the last partial line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed) as {
              status?: string;
              has_laya?: boolean;
            } & LayaDecisionResult;

            if (parsed.status === "ready") {
              this.isReady = true;
            } else if (this.pendingResolver) {
              const resolver = this.pendingResolver;
              this.pendingResolver = null;
              resolver(parsed as LayaDecisionResult);
            }
          } catch {
            // Non-JSON or debug log line
          }
        }
      }
    } catch {
      // Stream closed
    }
  }

  public async decide(query: string): Promise<LayaDecisionResult> {
    if (!this.proc || typeof this.proc.stdin !== "object" || !this.proc.stdin || !("write" in this.proc.stdin)) {
      throw new Error("LayaEngine process is not running or stdin is not piped. Call start() first.");
    }

    const payload = JSON.stringify({ query }) + "\n";
    const stdin = this.proc.stdin;

    return new Promise<LayaDecisionResult>((resolve) => {
      this.pendingResolver = resolve;
      stdin.write(new TextEncoder().encode(payload));
      stdin.flush();
    });
  }

  public stop(): void {
    if (this.proc && typeof this.proc.stdin === "object" && this.proc.stdin && "write" in this.proc.stdin) {
      try {
        this.proc.stdin.write(new TextEncoder().encode("EXIT\n"));
        this.proc.stdin.flush();
      } catch {
        // Ignore write error on exit
      }
      this.proc.kill();
    }
  }
}
