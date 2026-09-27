import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const UI_DIST = join(process.cwd(), "desktop-ui", "dist");

function getContentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".json")) return "application/json";
  return "text/plain";
}

export function handleStaticRoute(url: URL): Response {
  let relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  let targetFile = join(UI_DIST, relativePath);

  // Fallback to index.html for Single Page Application routing
  if (!existsSync(targetFile)) {
    targetFile = join(UI_DIST, "index.html");
  }

  if (existsSync(targetFile)) {
    const fileContent = readFileSync(targetFile);
    return new Response(fileContent, {
      headers: {
        "Content-Type": getContentType(targetFile),
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new Response("Not Found", { status: 404 });
}
