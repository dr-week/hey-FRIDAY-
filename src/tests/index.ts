import { FridayAssistant } from "../core/friday.ts";
import { FridayDatabase } from "../services/db.ts";

async function main(): Promise<void> {
  console.log("=================================================");
  console.log("🚀 HEY FRIDAY: Zero-Latency System-1 Assistant");
  console.log("   Runtime: Bun (Strict TypeScript) + Laya + SQLite");
  console.log("=================================================\n");

  const friday = new FridayAssistant();
  await friday.initialize();

  // Test Sample Level-2 Decision Queries
  const queries = [
    "Hey Friday, do I need an umbrella today?",
    "Hey Friday, what is the weather like right now?",
    "Hey Friday, check system status",
  ];

  for (const q of queries) {
    console.log(`\n🎙️ [USER]: "${q}"`);
    await friday.processQuery(q, false); // speakResult: false for fast automated tests, true for audio
  }

  // Verify SQLite persistence
  const db = new FridayDatabase();
  console.log("\n📊 [SQLite History - Recent Decisions]:");
  console.table(db.getRecentDecisions(5));
  db.close();

  friday.shutdown();
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});