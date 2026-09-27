# 🚨 Automated Crash Reporting & Recovery Guide

Hey Friday includes an **automated, structured crash logging and diagnostic system** covering both the **TypeScript (Bun) core** and the **Python desktop/bridge processes**.

---

## 1. How the Automated Crash Pipeline Works

1. **Global Catch Hooks**:
   - **TypeScript / Bun (`src/services/crash_logger.ts`)**:
     - Listens to `process.on("uncaughtException")` and `process.on("unhandledRejection")`.
     - Intercepts query failures inside `FridayAssistant.processQuery()`.
   - **Python (`desktop/crash_handler.py`)**:
     - Hooks `sys.excepthook` and `threading.excepthook` to catch UI, WebView2, and hotkey crashes.
2. **Structured Log Generation**:
   - Automatically writes a timestamped JSON file to:
     ```
     data/crashes/crash_<epoch>_<id>.json
     ```
3. **Automatic Rotation**:
   - Maintains the last 20 incidents automatically, removing stale logs to prevent disk bloat.

---

## 2. Structure of a Crash Report

Each crash file contains rich diagnostic telemetry:

```json
{
  "crashId": "crash_1774510000000_abc12",
  "timestamp": "2026-09-25T13:30:00.000Z",
  "epochMs": 1774510000000,
  "runtime": "bun",
  "error": {
    "name": "TypeError",
    "message": "Detailed error message",
    "stack": "Call stack frames..."
  },
  "environment": {
    "os": "win32 (x64)",
    "platform": "win32",
    "arch": "x64",
    "runtimeVersion": "Bun 1.3.12",
    "uptimeSeconds": 142,
    "memory": {
      "heapUsedMb": 3.42,
      "heapTotalMb": 8.0,
      "rssMb": 18.5
    }
  },
  "context": {
    "lastQuery": "Hey Friday, do I need an umbrella today?",
    "component": "FridayAssistant.processQuery",
    "extra": {}
  },
  "diagnosticAdvice": [
    "Check network connectivity or external API endpoint."
  ]
}
```

---

## 3. How to Use It for Yourself (AI Assistants & Developers)

Whenever an unexpected failure or crash occurs:

### Step 1: Run the Automated Crash Analyzer
```powershell
bun run crash:analyze
```
The analyzer will:
- Locate the most recent incident in `data/crashes/`.
- Print the exact error, component, triggering user query, and memory state.
- Output **actionable diagnostic advice**.

### Step 2: Read Diagnostic Advice & Match Fixes

| Symptom / Error | Root Cause | Automated Recovery Action |
| :--- | :--- | :--- |
| `UnicodeEncodeError: 'charmap'` | Windows default `cp1252` encoding | Ensure `sys.stdout.reconfigure(encoding='utf-8')` is set in python scripts. |
| `CoreWebView2Controller / COM` | Cross-thread COM invocation | Do not call WebView window APIs from background threads without dispatching to UI. |
| `Missing .venv / laya` | Virtual environment uninitialized | Run `python -m venv .venv` and `pip install -r requirements.txt`. |
| `Database Locked` | SQLite concurrent write lock | Avoid opening multiple write connections simultaneously. |
| `fetch failed (Open-Meteo)` | No internet connection | System gracefully returns cached weather from `friday.sqlite`. |

### Step 3: Clear Resolved Crashes
```powershell
bun run crash:clear
```
Removes old crash files once investigated.
