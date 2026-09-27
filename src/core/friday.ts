import { LayaEngine } from "./engine.ts";
import { WeatherService } from "../services/weather.ts";
import { FridayDatabase } from "../services/db.ts";
import { SpeechService } from "../services/speech.ts";
import { WindowsControlService } from "../services/windows_control.ts";
import { DevCommandService } from "../services/dev_service.ts";
import { CrashLogger } from "../services/crash_logger.ts";
import type { FridayIntent, WeatherData } from "./types.ts";

export class FridayAssistant {
  private readonly engine: LayaEngine;
  private readonly weather: WeatherService;
  private readonly db: FridayDatabase;
  private readonly speech: SpeechService;
  private readonly winControl: WindowsControlService;
  private readonly devService: DevCommandService;
  private readonly crashLogger: CrashLogger;

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

  public async processQuery(query: string, speakResult: boolean = true): Promise<string> {
    this.crashLogger.setLastQuery(query);
    const startTime = performance.now();

    try {
      // Step 1: Laya evaluates the query in a single forward pass
      const decision = await this.engine.decide(query);
      const intent: FridayIntent = decision.answers.intent.choice;
      const latency = Math.round(performance.now() - startTime);

      // Step 2: Log decision to local SQLite
      this.db.logDecision(query, intent, latency);

      console.log(`\n🧠 [Laya Decision] Intent: "${intent}" | Model: ${decision.modelUsed} | Latency: ${decision.latencyMs}ms`);

      let responseText = "";

      // Step 3: Fast action execution based on intent
      switch (intent) {
        case "system_volume_mute": {
          responseText = await this.winControl.toggleMute();
          break;
        }

        case "system_volume_up": {
          responseText = await this.winControl.volumeUp();
          break;
        }

        case "system_volume_down": {
          responseText = await this.winControl.volumeDown();
          break;
        }

        case "media_play_pause": {
          responseText = await this.winControl.toggleMediaPlayPause();
          break;
        }

        case "media_next": {
          responseText = await this.winControl.nextTrack();
          break;
        }

        case "media_prev": {
          responseText = await this.winControl.prevTrack();
          break;
        }

        case "system_lock": {
          responseText = await this.winControl.lockWorkstation();
          break;
        }

        case "system_empty_bin": {
          responseText = await this.winControl.emptyRecycleBin();
          break;
        }

        case "system_screenshot": {
          responseText = await this.winControl.takeScreenshot();
          break;
        }

        case "system_status": {
          const sysMetrics = await this.winControl.getSystemMetrics();
          responseText = `All systems operational. ${sysMetrics}`;
          break;
        }

        case "dev_git_status": {
          responseText = await this.devService.getGitStatus();
          break;
        }

        case "dev_run_tests": {
          responseText = await this.devService.runProjectTests();
          break;
        }

        case "dev_port_check": {
          responseText = await this.devService.checkServerPort(4141);
          break;
        }

        case "weather_check": {
          const prefs = this.db.getPreferences();
          const w: WeatherData = await this.weather.getCurrentWeather(prefs.defaultCity, prefs.latitude, prefs.longitude);
          responseText = `In ${w.city}, it's currently ${w.temperatureC} degrees Celsius and ${w.summary.toLowerCase()}.`;
          break;
        }

        case "smalltalk": {
          responseText = "Hey there! I am Friday, your zero-latency desktop command assistant.";
          break;
        }

        default: {
          responseText = `I received your command: "${query}". Routing through System-1.`;
          break;
        }
      }

      console.log(`🗣️ [FRIDAY Responds]: "${responseText}" (Total time: ${latency}ms)`);

      if (speakResult) {
        await this.speech.speak(responseText);
      }

      return responseText;
    } catch (error) {
      const crashFile = this.crashLogger.recordCrash(error, "FridayAssistant.processQuery", { query });
      const fallbackMsg = "I encountered an internal error. A structured crash log was recorded.";
      console.error(`[ERROR]: Query execution failed. Report saved to: ${crashFile}`);
      if (speakResult) {
        await this.speech.speak(fallbackMsg);
      }
      return fallbackMsg;
    }
  }

  public shutdown(): void {
    this.engine.stop();
    this.db.close();
    console.log("⚡ [FRIDAY] Shutting down cleanly.");
  }
}
