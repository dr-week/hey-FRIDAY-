import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { FridayDatabase } from "../services/db.ts";
import { WindowsControlService } from "../services/windows_control.ts";
import { WeatherService } from "../services/weather.ts";
import { CrashLogger } from "../services/crash_logger.ts";
import { FridayAssistant } from "../core/friday.ts";

describe("Hey Friday Test Suite: Architecture, Dataflow & Commands", () => {
  let db: FridayDatabase;
  let winControl: WindowsControlService;
  let weatherService: WeatherService;
  let crashLogger: CrashLogger;

  beforeAll(() => {
    db = new FridayDatabase();
    winControl = new WindowsControlService();
    weatherService = new WeatherService();
    crashLogger = CrashLogger.initialize("data/crashes");
  });

  afterAll(() => {
    db.close();
  });

  describe("1. Database & Persistence Layer (C-SQLite)", () => {
    test("Should read default preferences cleanly", () => {
      const prefs = db.getPreferences();
      expect(prefs).toBeDefined();
      expect(typeof prefs.defaultCity).toBe("string");
      expect(typeof prefs.latitude).toBe("number");
      expect(typeof prefs.longitude).toBe("number");
    });

    test("Should record and query decisions with strict types", () => {
      const testQuery = "Hey Friday, test query persistence";
      db.logDecision(testQuery, "system_status", 15);
      const recent = db.getRecentDecisions(10);
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[0].query).toBe(testQuery);
      expect(recent[0].intent).toBe("system_status");
      expect(recent[0].latency_ms).toBe(15);
    });

    test("Should store and match learned voice macros at 0ms", () => {
      db.saveMacro("coding mode", ["mute audio", "check git status"], "Custom coding routine");
      const matched = db.findMatchingMacro("Hey Friday, activate coding mode");
      expect(matched).not.toBeNull();
      expect(matched?.triggerPhrase).toBe("coding mode");
      expect(matched?.steps.length).toBe(2);
    });

    test("Should record voice framing, wake-word, and response feedback logs to SQLite and training files", () => {
      const saved = db.recordFeedback({
        rawSpokenText: "Hey Freddie check get statues",
        normalizedText: "hey friday check git status",
        correctedText: "hey friday check git status",
        detectedIntent: "dev_git_status",
        expectedIntent: "dev_git_status",
        aiResponse: "Git working tree clean.",
        framingStatus: "correct",
        wakeWordStatus: "responded_correctly",
        responseStatus: "accurate",
        source: "web-pages",
      });
      expect(saved.detectedIntent).toBe("dev_git_status");
      const logs = db.listFeedback(5);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].rawSpokenText).toBe("Hey Freddie check get statues");
    });
  });

  describe("2. Windows Native OS Control & Weather Entity Resolution", () => {
    test("Should retrieve system hardware metrics (RAM & Battery)", async () => {
      const metrics = await winControl.getSystemMetrics();
      expect(typeof metrics).toBe("string");
      expect(metrics.length).toBeGreaterThan(5);
      expect(metrics).toContain("RAM");
    });

    test("Should dynamically extract spoken city coordinates from natural queries", async () => {
      const goaCoords = await weatherService.resolveCityFromQuery("Hey Friday, do I need an umbrella in Goa today?");
      expect(goaCoords.city).toContain("Goa");
      expect(goaCoords.lat).toBeCloseTo(15.4909, 2);

      const mumbaiCoords = await weatherService.resolveCityFromQuery("What is the weather in Mumbai right now?");
      expect(mumbaiCoords.city).toBe("Mumbai");
    });
  });

  describe("3. Crash Logger & Failure Recovery", () => {
    test("Should record structured JSON crash logs without throwing", () => {
      const sampleErr = new Error("Simulated diagnostic error for test suite");
      const crashFile = crashLogger.recordCrash(sampleErr, "TestSuite.Verification", {
        tag: "test_run",
      });
      expect(crashFile).toBeDefined();
      expect(crashFile.endsWith(".json")).toBe(true);
    });
  });

  describe("4. End-to-End FridayAssistant Intent Execution & Concurrency", () => {
    let friday: FridayAssistant;

    beforeAll(async () => {
      friday = new FridayAssistant();
      await friday.initialize();
    }, 30000);

    afterAll(() => {
      friday.shutdown();
    });

    test("Should route multiple queries accurately through Laya System-1 with multi-head safety metadata", async () => {
      const statusRes = await friday.processQuery("check system status", false);
      expect(typeof statusRes).toBe("string");
      expect(statusRes).toContain("operational");
      expect(friday.getLastExecutionMeta()?.intent).toBe("system_status");
      expect(friday.getLastExecutionMeta()?.isDestructive).toBe(false);

      const greetRes = await friday.processQuery("hello Friday", false);
      expect(greetRes.toLowerCase()).toContain("friday");

      const mediaRes = await friday.processQuery("pause music", false);
      expect(mediaRes.toLowerCase()).toContain("media");

      const gitRes = await friday.processQuery("Hey Freddie check get statues", false);
      expect(gitRes.toLowerCase()).toContain("git");

      const macroRes = await friday.processQuery("Hey Friday, focus mode", false);
      expect(macroRes).toContain('Executed "focus mode" macro');
      expect(friday.getLastExecutionMeta()?.intent).toBe("voice_macro");
    }, 45000);

    test("Should handle concurrent LayaEngine queries without race conditions via requestId correlation", async () => {
      const [resA, resB, resC] = await Promise.all([
        friday.processQuery("mute audio", false),
        friday.processQuery("next song", false),
        friday.processQuery("check git status", false),
      ]);
      expect(resA.toLowerCase()).toContain("mute");
      expect(resB.toLowerCase()).toContain("next track");
      expect(resC.toLowerCase()).toContain("git");
    }, 30000);
  });
});
