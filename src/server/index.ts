import { FridayAssistant } from "../core/friday.ts";
import { CrashLogger } from "../services/crash_logger.ts";
import { handleApiRoute } from "./routes/apiRoutes.ts";
import { handleStaticRoute } from "./routes/staticRoutes.ts";
import { launchPillWindow } from "./launcher/windowLauncher.ts";

const PORT = 4141;

export async function startServer(launchWindow: boolean = true): Promise<void> {
  const crashLogger = CrashLogger.initialize("data/crashes");
  const friday = new FridayAssistant();
  await friday.initialize();

  Bun.serve({
    port: PORT,
    hostname: "127.0.0.1",
    async fetch(req) {
      const url = new URL(req.url);

      // 1. CORS Preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // 2. Handle REST API Routes
      const apiResponse = await handleApiRoute(req, url, friday, crashLogger);
      if (apiResponse) {
        return apiResponse;
      }

      // 3. Handle Static React Production Files
      return handleStaticRoute(url);
    },
  });

  console.log(`\n=================================================`);
  console.log(`🚀 FRIDAY REACT DESKTOP SERVER: http://127.0.0.1:${PORT}`);
  console.log(`=================================================`);

  if (launchWindow) {
    launchPillWindow(PORT);
  }
}

if (import.meta.main) {
  startServer(true).catch((err) => {
    console.error("Server startup error:", err);
    process.exit(1);
  });
}
