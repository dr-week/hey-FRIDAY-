import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Isolated Floating Window Launcher (Department: Server / Desktop Shell)
 * Prefers Google Chrome (`chrome.exe`) first so `webkitSpeechRecognition` routes to
 * Google's high-accuracy Universal Speech Model (USM), falling back to Edge (`msedge.exe`).
 */
export function launchPillWindow(port: number): void {
  const localAppData = process.env.LOCALAPPDATA ?? "C:\\Users\\Default\\AppData\\Local";
  const browserCandidates = [
    { name: "Google Chrome (USM Speech Engine)", path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" },
    { name: "Google Chrome (x86)", path: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" },
    { name: "Google Chrome (User)", path: join(localAppData, "Google\\Chrome\\Application\\chrome.exe") },
    { name: "Microsoft Edge", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" },
    { name: "Microsoft Edge (x64)", path: "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" },
  ];

  const found = browserCandidates.find((b) => existsSync(b.path));

  if (found) {
    console.log(`🖥️  Launching Floating App Window via ${found.name} (Isolated Session)...`);
    const isolatedUserDataDir = join(process.cwd(), "data", ".browser_profile");
    Bun.spawn([
      found.path,
      `--app=http://127.0.0.1:${port}`,
      `--user-data-dir=${isolatedUserDataDir}`,
      "--window-size=420,180",
      "--window-position=580,760",
      "--no-first-run",
      "--no-default-browser-check",
    ]);
  } else {
    console.log("🖥️  Opening in default browser...");
    Bun.spawn(["cmd.exe", "/c", "start", `http://127.0.0.1:${port}`]);
  }
}
