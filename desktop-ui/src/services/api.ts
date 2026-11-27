import type { ApiResponse, ExecutionTelemetryMeta } from "../types/widget.ts";
import { evaluateInBrowserLaya } from "../departments/classifier/browserLayaClassifier.ts";
import {
  humanizeAssistantReply,
  speakWithNaturalVoice,
  stopNaturalVoice,
} from "../departments/sound/naturalTtsEngine.ts";

const API_BASE = "http://127.0.0.1:4141";

export interface QueryResult {
  readonly response: string;
  readonly meta?: ExecutionTelemetryMeta;
  readonly isLocalBackend: boolean;
}

export async function sendQuery(
  queryText: string,
  speechCallbacks?: {
    readonly onSpeakStart?: () => void;
    readonly onSpeakEnd?: () => void;
  }
): Promise<QueryResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1400);
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
    // Local port 4141 offline (hosted on GitHub Pages) -> fallback to in-browser System-1
  }

  const browserRes = evaluateInBrowserLaya(queryText);
  const conversationalReply = humanizeAssistantReply(browserRes.response, browserRes.meta.intent);
  speakWithNaturalVoice(conversationalReply, {
    onStart: speechCallbacks?.onSpeakStart,
    onEnd: speechCallbacks?.onSpeakEnd,
  });

  return {
    response: conversationalReply,
    meta: { ...browserRes.meta, response: conversationalReply },
    isLocalBackend: false,
  };
}

export async function requestStopSpeech(): Promise<void> {
  stopNaturalVoice();
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
