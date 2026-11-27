import type { FridayAssistant } from "../../core/friday.ts";
import type { CrashLogger } from "../../services/crash_logger.ts";
import { handleFeedbackRoute } from "./feedbackRoutes.ts";
import { handleDepartmentRoute } from "./departmentRoutes.ts";

export async function handleApiRoute(
  req: Request,
  url: URL,
  friday: FridayAssistant,
  crashLogger: CrashLogger
): Promise<Response | null> {
  // 0. Delegate Feedback & Department Routes
  const feedbackRes = await handleFeedbackRoute(req, url, friday);
  if (feedbackRes) return feedbackRes;

  const deptRes = await handleDepartmentRoute(req, url, friday);
  if (deptRes) return deptRes;

  // 1. Health & Identity Check Endpoint
  if (url.pathname === "/api/health" && req.method === "GET") {
    return Response.json({
      status: "ok",
      name: "heyFRIDAY",
      version: "2.0.0",
      projectRoot: process.cwd(),
      uptime: process.uptime(),
    });
  }

  // 1. Level-2 Query Execution Endpoint (with Laya System-1 telemetry metadata)
  if (url.pathname === "/api/query" && req.method === "POST") {
    try {
      const body = (await req.json()) as { query?: string; speak?: boolean };
      const userQuery = body.query?.trim() || "check system status";
      const shouldSpeak = body.speak ?? true;
      const answer = await friday.processQuery(userQuery, shouldSpeak);
      const meta = friday.getLastExecutionMeta();
      return Response.json({
        status: "ok",
        query: userQuery,
        response: answer,
        meta,
      });
    } catch (err) {
      crashLogger.recordCrash(err, "POST /api/query");
      return Response.json({ status: "error", message: String(err) }, { status: 500 });
    }
  }

  // 2. Direct Weather Shortcut Endpoint
  if (url.pathname === "/api/weather" && req.method === "GET") {
    try {
      const city = url.searchParams.get("city") || "Goa";
      const answer = await friday.processQuery(`Hey Friday, do I need an umbrella in ${city} today?`, true);
      return Response.json({ status: "ok", response: answer, meta: friday.getLastExecutionMeta() });
    } catch (err) {
      return Response.json({ status: "error", message: String(err) }, { status: 500 });
    }
  }

  // 3. Decision History Telemetry Endpoint
  if (url.pathname === "/api/history" && req.method === "GET") {
    const limit = Number(url.searchParams.get("limit") || "10");
    return Response.json({
      status: "ok",
      history: friday.getRecentHistory(limit),
    });
  }

  // 4. Learned Voice Macros Endpoint (GET list / POST create)
  if (url.pathname === "/api/macros" && req.method === "GET") {
    return Response.json({
      status: "ok",
      macros: friday.listVoiceMacros(),
    });
  }

  if (url.pathname === "/api/macros" && req.method === "POST") {
    try {
      const body = (await req.json()) as {
        triggerPhrase?: string;
        steps?: string[];
        description?: string;
      };
      if (!body.triggerPhrase || !Array.isArray(body.steps) || body.steps.length === 0) {
        return Response.json(
          { status: "error", message: "triggerPhrase and non-empty steps[] are required." },
          { status: 400 }
        );
      }
      const macro = friday.saveVoiceMacro(body.triggerPhrase, body.steps, body.description);
      return Response.json({ status: "ok", macro });
    } catch (err) {
      return Response.json({ status: "error", message: String(err) }, { status: 500 });
    }
  }

  // 5. Barge-In Speech Interrupt Endpoint
  if (url.pathname === "/api/speech/stop" && req.method === "POST") {
    friday.stopSpeaking();
    return Response.json({ status: "ok", message: "Speech interrupted." });
  }

  // 6. Application Termination Endpoint
  if (url.pathname === "/api/kill" && req.method === "POST") {
    console.log("🛑 [FRIDAY] Kill command received. Closing server...");
    setTimeout(() => {
      friday.shutdown();
      process.exit(0);
    }, 250);
    return Response.json({ status: "terminating" });
  }

  return null;
}
