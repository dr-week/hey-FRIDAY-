import { FridayDatabase } from "../services/db.ts";
import { FridayAssistant } from "../core/friday.ts";

async function runGoa(): Promise<void> {
  const db = new FridayDatabase();
  // Ensure Panaji, Goa is default
  db.updateCity("Goa (Panaji)", 15.4909, 73.8278);

  const friday = new FridayAssistant();
  await friday.initialize();

  // Check if a specific query was passed via command line
  const passedQuery = process.argv.slice(2).join(" ").trim();

  if (passedQuery) {
    console.log(`\n🎙️ [QUERY]: "${passedQuery}"`);
    // Speak result out loud through Windows SpeechSynthesizer
    await friday.processQuery(passedQuery, true);
  } else {
    console.log("\n=======================================================");
    console.log("🌴 RUNNING HEY FRIDAY TEST FOR GOA");
    console.log("=======================================================");

    const queries = [
      "Hey Friday, what is the weather like today?",
      "Hey Friday, do I need to take an umbrella in Goa today?",
      "Hey Friday, check system status",
    ];

    for (const q of queries) {
      console.log(`\n🎙️ [QUERY]: "${q}"`);
      await friday.processQuery(q, false);
    }
  }

  friday.shutdown();
}

runGoa().catch(console.error);
