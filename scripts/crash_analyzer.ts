import { existsSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { StructuredCrashReport } from "../src/services/crash_logger.ts";

function analyzeCrashes(): void {
  const crashesDir = join(process.cwd(), "data", "crashes");

  if (!existsSync(crashesDir)) {
    console.log("✅ No crashes recorded. Directory does not exist yet.");
    return;
  }

  const files = readdirSync(crashesDir)
    .filter((f) => f.startsWith("crash_") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("✅ System Clean: Zero crash logs found in data/crashes/.");
    return;
  }

  const args = process.argv.slice(2);

  if (args.includes("--clear")) {
    for (const f of files) {
      unlinkSync(join(crashesDir, f));
    }
    console.log(`🧹 Cleared ${files.length} crash log(s).`);
    return;
  }

  console.log("=================================================");
  console.log(`🚨 HEY FRIDAY CRASH ANALYZER: ${files.length} Total Incident(s)`);
  console.log("=================================================\n");

  const latestFile = files[0];
  if (!latestFile) return;

  const content = readFileSync(join(crashesDir, latestFile), "utf-8");
  const report = JSON.parse(content) as StructuredCrashReport;

  console.log(`📄 Latest Incident File: data/crashes/${latestFile}`);
  console.log(`🕒 Timestamp:           ${report.timestamp}`);
  console.log(`⚙️  Runtime:             ${report.runtime.toUpperCase()} (${report.environment.runtimeVersion})`);
  console.log(`💻 OS / Architecture:   ${report.environment.os}`);
  console.log(`🧠 Memory at Crash:     Heap Used: ${report.environment.memory.heapUsedMb} MB / RSS: ${report.environment.memory.rssMb} MB`);
  console.log(`⏱️  Uptime:              ${report.environment.uptimeSeconds} seconds`);
  console.log(`📦 Component:           ${report.context.component}`);

  if (report.context.lastQuery) {
    console.log(`🎙️  Triggering Query:    "${report.context.lastQuery}"`);
  }

  console.log(`\n❌ Error [${report.error.name}]: ${report.error.message}`);
  
  if (report.error.stack) {
    console.log("\n📜 Stack Trace:");
    console.log(report.error.stack.trim());
  }

  console.log("\n💡 Diagnostic Advice / Self-Recovery Recommendations:");
  if (report.diagnosticAdvice && report.diagnosticAdvice.length > 0) {
    for (const advice of report.diagnosticAdvice) {
      console.log(`   👉 ${advice}`);
    }
  } else {
    console.log("   👉 Inspect stack trace and check recent code changes.");
  }

  console.log("\n-------------------------------------------------");
  console.log(`Tip: Run "bun run crash:clear" to purge crash logs.`);
}

analyzeCrashes();
