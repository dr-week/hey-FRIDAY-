import { existsSync } from "node:fs";
import { join } from "node:path";

export function launchPillWindow(port: number): void {
  const edgePaths = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  const edgeExe = edgePaths.find((p) => existsSync(p));

  if (edgeExe) {
    console.log("🖥️  Launching Dedicated Floating App Window via Edge (Isolated Session)...");
    const isolatedUserDataDir = join(process.cwd(), "data", ".browser_profile");
    // Standalone clean app window without browser tabs, bookmarks, or address bar
    Bun.spawn([
      edgeExe,
      `--app=http://127.0.0.1:${port}`,
      `--user-data-dir=${isolatedUserDataDir}`,
      "--window-size=380,140",
      "--window-position=580,780",
      "--no-first-run",
      "--no-default-browser-check",
    ]);
  } else {
    console.log("🖥️  Opening in default browser...");
    Bun.spawn(["cmd.exe", "/c", "start", `http://127.0.0.1:${port}`]);
  }
}
