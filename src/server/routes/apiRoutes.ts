import type { FridayAssistant } from "../../core/friday.ts";
import type { CrashLogger } from "../../services/crash_logger.ts";

export async function handleApiRoute(
  req: Request,
  url: URL,
  friday: FridayAssistant,
  crashLogger: CrashLogger
): Promise<Response | null> {
  // 0. Health & Identity Check Endpoint
  if (url.pathname === "/api/health" && req.method === "GET") {
    return Response.json({
      status: "ok",
      name: "heyFRIDAY",
      version: "1.0.0",
      projectRoot: process.cwd(),
      uptime: process.uptime(),
    });
  }

  // 1. Level-2 Query Execution Endpoint
  if (url.pathname === "/api/query" && req.method === "POST") {
    try {
      const body = (await req.json()) as { query?: string; speak?: boolean };
      const userQuery = body.query?.trim() || "check system status";
      const shouldSpeak = body.speak ?? true;
      const answer = await friday.processQuery(userQuery, shouldSpeak);
      return Response.json({ status: "ok", query: userQuery, response: answer });
    } catch (err) {
      crashLogger.recordCrash(err, "POST /api/query");
      return Response.json({ status: "error", message: String(err) }, { status: 500 });
    }
  }

  // 2. Direct Weather Shortcut Endpoint
  if (url.pathname === "/api/weather" && req.method === "GET") {
    try {
      const answer = await friday.processQuery("Hey Friday, do I need an umbrella in Goa today?", true);
      return Response.json({ status: "ok", response: answer });
    } catch (err) {
      return Response.json({ status: "error", message: String(err) }, { status: 500 });
    }
  }

  // 3. Application Termination Endpoint
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
