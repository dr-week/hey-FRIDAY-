import type { ApiResponse, ExecutionTelemetryMeta } from "../types/widget.ts";
import { evaluateInBrowserLaya } from "../departments/classifier/browserLayaClassifier.ts";

const API_BASE = "http://127.0.0.1:4141";

export interface QueryResult {
  readonly response: string;
  readonly meta?: ExecutionTelemetryMeta;
  readonly isLocalBackend: boolean;
}

function speakInBrowserFallback(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const ziraOrFemale = voices.find((v) => /zira|female|google|english/i.test(v.name));
    if (ziraOrFemale) utterance.voice = ziraOrFemale;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore browser speech errors
  }
}

export async function sendQuery(queryText: string): Promise<QueryResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1600);
    const res = await fetch(`${API_BASE}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryText }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as ApiResponse;
      return {
        response: data.response ?? "",
        meta: data.meta,
        isLocalBackend: true,
      };
    }
  } catch {
    // Local port 4141 offline (e.g. hosted on GitHub Pages) -> fallback to in-browser System-1
  }

  const browserRes = evaluateInBrowserLaya(queryText);
  speakInBrowserFallback(browserRes.response);
  return {
    response: browserRes.response,
    meta: browserRes.meta,
    isLocalBackend: false,
  };
}

export async function requestStopSpeech(): Promise<void> {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
  try {
    await fetch(`${API_BASE}/api/speech/stop`, { method: "POST" });
  } catch {
    // Best-effort barge-in
  }
}

export async function requestKillApp(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/kill`, { method: "POST" });
  } catch {
    // Best-effort during shutdown
  }
}
