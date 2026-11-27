import { existsSync } from "node:fs";
import type { FridayAssistant } from "../../core/friday.ts";
import type { FeedbackLogEntry } from "../../core/types.ts";

/**
 * Feedback & RLHF Training Routes (Department: Server / Feedback Loop)
 * Handles GET/POST `/api/feedback` and `/api/feedback/export` (<80 lines).
 */
export async function handleFeedbackRoute(
  req: Request,
  url: URL,
  friday: FridayAssistant
): Promise<Response | null> {
  // 1. List recorded voice & framing feedback logs
  if (url.pathname === "/api/feedback" && req.method === "GET") {
    const limit = Number(url.searchParams.get("limit") || "50");
    return Response.json({
      status: "ok",
      feedback: friday.listFeedback(limit),
    });
  }

  // 2. Submit new voice framing, wake-word, or response feedback entry
  if (url.pathname === "/api/feedback" && req.method === "POST") {
    try {
      const body = (await req.json()) as Partial<FeedbackLogEntry>;
      const entry: FeedbackLogEntry = {
        rawSpokenText: body.rawSpokenText?.trim() || "(empty)",
        normalizedText: body.normalizedText?.trim() || body.rawSpokenText?.trim() || "(empty)",
        correctedText: body.correctedText?.trim() || "",
        detectedIntent: body.detectedIntent || "unknown",
        expectedIntent: body.expectedIntent || body.detectedIntent || "unknown",
        aiResponse: body.aiResponse || "",
        framingStatus: body.framingStatus || "unrated",
        wakeWordStatus: body.wakeWordStatus || "unrated",
        responseStatus: body.responseStatus || "unrated",
        notes: body.notes || "",
        source: body.source || "desktop-local",
      };
      const saved = friday.recordFeedback(entry);
      return Response.json({ status: "ok", entry: saved });
    } catch (err) {
      return Response.json({ status: "error", message: String(err) }, { status: 500 });
    }
  }

  // 3. Export Laya `.fit()` CSV training file directly
  if (url.pathname === "/api/feedback/export" && req.method === "GET") {
    const csvPath = "data/feedback/laya_training.csv";
    if (existsSync(csvPath)) {
      return new Response(Bun.file(csvPath), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="laya_training.csv"',
        },
      });
    }
    return new Response("state,intent,framing_status,wake_word_status,response_status\n", {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  }

  return null;
}
