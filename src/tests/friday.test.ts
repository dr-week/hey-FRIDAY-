import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { FridayDatabase } from "../services/db.ts";
import { WindowsControlService } from "../services/windows_control.ts";
import { CrashLogger } from "../services/crash_logger.ts";
import { FridayAssistant } from "../core/friday.ts";

describe("Hey Friday Test Suite: Architecture, Dataflow & Commands", () => {
  let db: FridayDatabase;
  let winControl: WindowsControlService;
  let crashLogger: CrashLogger;

  beforeAll(() => {
    db = new FridayDatabase();
    winControl = new WindowsControlService();
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
  });

  describe("2. Windows Native OS Control Service", () => {
    test("Should retrieve system hardware metrics (RAM & Battery)", async () => {
      const metrics = await winControl.getSystemMetrics();
      expect(typeof metrics).toBe("string");
      expect(metrics.length).toBeGreaterThan(5);
      expect(metrics).toContain("RAM");
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

  describe("4. End-to-End FridayAssistant Intent Execution", () => {
    let friday: FridayAssistant;

    beforeAll(async () => {
      friday = new FridayAssistant();
      await friday.initialize();
    }, 30000);

    afterAll(() => {
      friday.shutdown();
    });

    test("Should route multiple queries accurately through Laya System-1", async () => {
      // 1. System status
      const statusRes = await friday.processQuery("check system status", false);
      expect(typeof statusRes).toBe("string");
      expect(statusRes).toContain("operational");

      // 2. Greeting
      const greetRes = await friday.processQuery("hello Friday", false);
      expect(typeof greetRes).toBe("string");
      expect(greetRes.toLowerCase()).toContain("friday");

      // 3. Media control
      const mediaRes = await friday.processQuery("pause music", false);
      expect(typeof mediaRes).toBe("string");
      expect(mediaRes.toLowerCase()).toContain("media");

      // 4. Developer command (git status)
      const gitRes = await friday.processQuery("check git status", false);
      expect(typeof gitRes).toBe("string");
      expect(gitRes.toLowerCase()).toContain("git");
    }, 45000);
  });
});
