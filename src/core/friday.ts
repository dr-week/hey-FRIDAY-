import { LayaEngine } from "./engine.ts";
import { executeIntentAction } from "./intentExecutor.ts";
import { WeatherService } from "../services/weather.ts";
import { FridayDatabase } from "../services/db.ts";
import { SpeechService } from "../services/speech.ts";
import { WindowsControlService } from "../services/windows_control.ts";
import { DevCommandService } from "../services/dev_service.ts";
import { CrashLogger } from "../services/crash_logger.ts";
import type { FeedbackLogEntry, FridayIntent, QueryExecutionMeta, VoiceMacro } from "./types.ts";

/**
 * Primary Assistant Orchestrator (Department: Core / Lifecycle)
 * Coordinates Laya System-1 engine, 0ms voice macros, feedback logs, and TTS (<145 lines).
 */
export class FridayAssistant {
  private readonly engine: LayaEngine;
  private readonly weather: WeatherService;
  private readonly db: FridayDatabase;
  private readonly speech: SpeechService;
  private readonly winControl: WindowsControlService;
  private readonly devService: DevCommandService;
  private readonly crashLogger: CrashLogger;
  private lastExecutionMeta: QueryExecutionMeta | null = null;

  constructor() {
    this.crashLogger = CrashLogger.initialize("data/crashes");
    this.engine = new LayaEngine();
    this.weather = new WeatherService();
    this.db = new FridayDatabase();
    this.speech = new SpeechService();
    this.winControl = new WindowsControlService();
    this.devService = new DevCommandService();
  }

  public async initialize(): Promise<void> {
    try {
      console.log("⚡ [FRIDAY] Initializing Laya System-1 Decision Engine...");
      await this.engine.start();
      const prefs = this.db.getPreferences();
      console.log(`⚡ [FRIDAY] Ready! Default location: ${prefs.defaultCity} (${prefs.latitude}, ${prefs.longitude})`);
    } catch (err) {
      this.crashLogger.recordCrash(err, "FridayAssistant.initialize");
      throw err;
    }
  }

  public getLastExecutionMeta(): QueryExecutionMeta | null { return this.lastExecutionMeta; }
  public getRecentHistory(limit: number = 10) { return this.db.getRecentDecisions(limit); }
  public listVoiceMacros(): VoiceMacro[] { return this.db.listMacros(); }
  public saveVoiceMacro(triggerPhrase: string, steps: readonly string[], description?: string): VoiceMacro {
    return this.db.saveMacro(triggerPhrase, steps, description);
  }
  public recordFeedback(entry: FeedbackLogEntry): FeedbackLogEntry { return this.db.recordFeedback(entry); }
  public listFeedback(limit: number = 30): FeedbackLogEntry[] { return this.db.listFeedback(limit); }
  public stopSpeaking(): void { this.speech.stopSpeaking(); }

  public async processQuery(query: string, speakResult: boolean = true, allowMacros: boolean = true): Promise<string> {
    this.crashLogger.setLastQuery(query);
    const startTime = performance.now();

    try {
      if (allowMacros) {
        const matchedMacro = this.db.findMatchingMacro(query);
        if (matchedMacro && matchedMacro.steps.length > 0) {
          const stepOutputs: string[] = [];
          for (const stepQuery of matchedMacro.steps) {
            stepOutputs.push(await this.processQuery(stepQuery, false, false));
          }
          const macroLatency = Math.round(performance.now() - startTime);
          const combinedResponse = `Executed "${matchedMacro.triggerPhrase}" macro: ${stepOutputs.join(" ")}`;
          this.db.logDecision(query, "voice_macro", macroLatency);
          this.lastExecutionMeta = {
            query,
            normalizedQuery: query,
            intent: "voice_macro",
            response: combinedResponse,
            latencyMs: macroLatency,
            modelUsed: "macro_memory_0ms",
            route: "auto",
            isDestructive: false,
          };
          if (speakResult) await this.speech.speak(combinedResponse);
          return combinedResponse;
        }
      }

      const decision = await this.engine.decide(query);
      const intent: FridayIntent = decision.answers.intent.choice;
      const route = decision.answers.intent.route ?? "auto";
      const isDestructive = decision.answers.safetyGate?.isDestructive ?? false;
      const latency = Math.round(performance.now() - startTime);

      this.db.logDecision(query, intent, latency);
      console.log(
        `\n🧠 [Laya Decision] Intent: "${intent}" | Route: ${route} | Destructive: ${isDestructive} | Model: ${decision.modelUsed} | Latency: ${decision.latencyMs}ms`
      );

      const responseText = await executeIntentAction(
        intent,
        query,
        this.winControl,
        this.devService,
        this.weather,
        this.db
      );

      this.lastExecutionMeta = {
        query,
        normalizedQuery: decision.normalizedText ?? query,
        intent,
        response: responseText,
        latencyMs: decision.latencyMs || latency,
        modelUsed: decision.modelUsed,
        route,
        isDestructive,
      };

      console.log(`🗣️ [FRIDAY Responds]: "${responseText}" (Total time: ${latency}ms)`);
      if (speakResult) await this.speech.speak(responseText);
      return responseText;
    } catch (error) {
      const crashFile = this.crashLogger.recordCrash(error, "FridayAssistant.processQuery", { query });
      const fallbackMsg = "I encountered an internal error. A structured crash log was recorded.";
      console.error(`[ERROR]: Query execution failed. Report saved to: ${crashFile}`);
      if (speakResult) await this.speech.speak(fallbackMsg);
      return fallbackMsg;
    }
  }

  public shutdown(): void {
    this.speech.stopSpeaking();
    this.engine.stop();
    this.db.close();
    console.log("⚡ [FRIDAY] Shutting down cleanly.");
  }
}
