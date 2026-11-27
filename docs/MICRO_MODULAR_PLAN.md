# 🧩 Micro-Modular Web Lab, Feedback Training Loop & GitHub Pages Architecture

> **Project**: Hey FRIDAY (`dr-week/hey-FRIDAY-`)  
> **Code Invariant**: **Strict Micro-Modularity** — Every source file across `bridge/`, `src/`, and `desktop-ui/src/` must remain **≤ 120–150 lines of code**, organized into domain & sub-department folders.

---

## 1. What Is Required to Test & Train Voice Framing on GitHub Pages?

To test whether spoken English sentences and *"Hey Friday"* wake-word calls are framed and classified accurately—both on **GitHub Pages (serverless browser)** and on **local Windows Desktop (`127.0.0.1:4141`)**—we need **5 core capabilities**:

1. **Dual-Engine Browser + Local Execution (`desktop-ui/src/departments/classifier/`)**:
   - GitHub Pages hosts static assets (`https://dr-week.github.io/hey-FRIDAY-/`), meaning there is no Python/Bun server running inside GitHub's static CDN.
   - Therefore, the Web UI includes an **in-browser System-1 Laya Emulator & Phonetic Normalizer** that runs automatically when `127.0.0.1:4141` is unreachable, plus browser `window.speechSynthesis` TTS and live Open-Meteo weather fetching!
2. **Phonetic Wake-Word & Sentence Framing Inspector (`desktop-ui/src/departments/speech/`)**:
   - Captures `SpeechRecognition` with `maxAlternatives = 3` and `interimResults = true`.
   - Displays **Raw Spoken Transcript**, **Normalized/Framed Sentence** (fixing Windows/Web Speech quirks like *"get statues"* → *"git status"*), **Wake-Word Gate Status** (`Matched`, `6s Armed Session`, or `Rejected Chatter`), and **Predicted Intent + Latency**.
3. **Dedicated Multi-Button Feedback Controls (`desktop-ui/src/departments/feedback/`)**:
   - Separate 1-click evaluation buttons on every voice or text test:
     - `[✅ Framing Correct]` vs `[❌ Framing / Text Wrong]` (with inline correction editor for what you *actually* said)
     - `[🎙️ Wake-Word OK]` vs `[🔇 False Wake / Missed Wake]`
     - `[🎯 AI Response Correct]` vs `[⚠️ Weird / Wrong Intent]` (with a dropdown of all 16 `FridayIntent` choices to tag the true gold label)
4. **Training Feedback Dataset & Export Pipeline (`data/feedback/` & Local Storage)**:
   - Every feedback submission is saved both to browser `localStorage` (for GitHub Pages testing) and synced via `POST /api/feedback` to local SQLite (`feedback_logs` table) and `data/feedback/training_feedback.jsonl`.
   - One-click **Export Laya `.fit()` CSV** and **Export JSONL** buttons in the Web UI allow you to download your labeled voice tests directly from GitHub Pages and feed them into `laya.Agent().fit("routing_labels.csv")`!
5. **Automated GitHub Pages CI/CD (`.github/workflows/deploy-pages.yml`)**:
   - Builds `desktop-ui` with Vite relative base path (`base: "./"`) and deploys automatically to GitHub Pages on every push to `main`.

---

## 2. Micro-Modular Department & Sub-Folder Topology (All Files ≤ 150 Lines)

```text
hey-FRIDAY-/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml                        # Automated GitHub Pages CI/CD pipeline
├── bridge/
│   ├── laya_bridge.py                              # Entry point stdio loop (<110 lines)
│   ├── normalizer.py                               # Indian-English & dev phonetic sentence normalizer (<75 lines)
│   └── schema.py                                   # Laya System-1 multi-head schema & heuristic router (<95 lines)
├── src/
│   ├── core/
│   │   ├── types.ts                                # Domain contracts & FeedbackLogEntry types (<110 lines)
│   │   ├── engine.ts                               # Correlated requestId Laya IPC controller (<130 lines)
│   │   ├── intentExecutor.ts                       # Maps FridayIntent to OS/Dev/Weather services (<110 lines)
│   │   └── friday.ts                               # High-level lifecycle, macro & feedback coordinator (<120 lines)
│   ├── services/
│   │   ├── db/
│   │   │   ├── FridayDatabase.ts                   # SQLite connection, schema init & preferences (<110 lines)
│   │   │   ├── macroRepo.ts                        # Learned voice macro storage & matching (<85 lines)
│   │   │   └── feedbackRepo.ts                     # Feedback SQLite + JSONL/CSV training file writer (<105 lines)
│   │   ├── windows/
│   │   │   ├── ffiBindings.ts                      # Direct Bun FFI user32.dll virtual key & lock (<80 lines)
│   │   │   └── WindowsControlService.ts            # High-level audio, media, screenshot & RAM metrics (<115 lines)
│   │   ├── weather/
│   │   │   ├── cityCatalog.ts                      # 0ms city coordinate dictionary & geocoder (<85 lines)
│   │   │   └── WeatherService.ts                   # Open-Meteo client & umbrella advice formatter (<105 lines)
│   │   ├── crash/
│   │   │   ├── crashFormatter.ts                   # Environment & diagnostic advice builder (<85 lines)
│   │   │   └── CrashLogger.ts                      # Singleton crash file writer & rotation (<95 lines)
│   │   ├── speech.ts                               # SAPI5 Zira TTS + barge-in cancellation (<75 lines)
│   │   └── dev_service.ts                          # Git status, test runner & port checker (<65 lines)
│   └── server/
│       ├── index.ts                                # Bun HTTP server bootstrap (<60 lines)
│       ├── launcher/
│       │   └── windowLauncher.ts                   # Prefers Chrome (Google USM) -> Edge fallback (<45 lines)
│       └── routes/
│           ├── apiRoutes.ts                        # Query, weather, macros & speech routes (<105 lines)
│           ├── feedbackRoutes.ts                   # GET/POST /api/feedback & CSV training export (<80 lines)
│           └── staticRoutes.ts                     # Production asset server (<40 lines)
└── desktop-ui/
    └── src/
        ├── types/
        │   └── widget.ts                           # UI, Telemetry & FeedbackLog types (<85 lines)
        ├── departments/
        │   ├── speech/
        │   │   ├── wakeWordGate.ts                 # Fuzzy wake-word & 6s armed session parser (<85 lines)
        │   │   ├── sentenceNormalizer.ts           # Phonetic dev/English framing normalizer (<80 lines)
        │   │   └── useGoogleSpeech.ts              # Web Speech hook (interim + alternatives + armed window) (<125 lines)
        │   ├── classifier/
        │   │   └── browserLayaClassifier.ts        # Client-side System-1 classifier for GitHub Pages (<125 lines)
        │   ├── feedback/
        │   │   ├── feedbackStorage.ts              # LocalStorage + API sync + CSV/JSONL downloader (<115 lines)
        │   │   ├── FeedbackButtonBar.tsx           # Separate 1-click buttons (Framing, Wake-Word, Response) (<120 lines)
        │   │   └── FeedbackHistoryDrawer.tsx       # Training dataset table & export controls (<115 lines)
        │   └── lab/
        │       └── VoiceTestBench.tsx              # Interactive GitHub Pages Voice & Wake-Word Test Console (<130 lines)
        ├── components/                             # Floating Pill Widget components (all <95 lines)
        ├── hooks/                                  # Drag & Keyboard shortcut hooks (all <95 lines)
        └── services/
            └── api.ts                              # Hybrid API client (Local Bun 4141 + GitHub Pages fallback) (<105 lines)
```

---

## 3. Phased Execution Plan

### Phase 1: Micro-Modular Backend & Python Bridge Refactor (All Files ≤ 150 Lines)
- Split [`bridge/laya_bridge.py`](../bridge/laya_bridge.py) into `schema.py`, `normalizer.py`, and `laya_bridge.py`.
- Split [`src/services/db.ts`](../src/services/db.ts), [`src/services/windows_control.ts`](../src/services/windows_control.ts), [`src/services/weather.ts`](../src/services/weather.ts), [`src/services/crash_logger.ts`](../src/services/crash_logger.ts), and [`src/core/friday.ts`](../src/core/friday.ts) into dedicated sub-department modules while keeping thin re-exports so all existing imports continue to work seamlessly.

### Phase 2: Feedback Training Loop & Persistence (`data/feedback/`)
- Create [`src/services/db/feedbackRepo.ts`](../src/services/db/feedbackRepo.ts) and [`src/server/routes/feedbackRoutes.ts`](../src/server/routes/feedbackRoutes.ts).
- Record every user rating (`framingCorrect`, `wakeWordStatus`, `responseStatus`, `correctedTranscript`, `expectedIntent`, `actualIntent`) to SQLite (`feedback_logs`) and append directly to `data/feedback/training_feedback.jsonl` + `data/feedback/laya_training.csv`.

### Phase 3: Micro-Modular Web Testing Lab & Multi-Button Feedback UI
- Upgrade [`wakeWordGate.ts`](../desktop-ui/src/departments/speech/wakeWordGate.ts) and [`sentenceNormalizer.ts`](../desktop-ui/src/departments/speech/sentenceNormalizer.ts) with fuzzy wake-word matching, 6-second armed conversational window (so saying *"Hey Friday"* then pausing works naturally), and phonetic repair.
- Build [`VoiceTestBench.tsx`](../desktop-ui/src/departments/lab/VoiceTestBench.tsx), [`FeedbackButtonBar.tsx`](../desktop-ui/src/departments/feedback/FeedbackButtonBar.tsx), and [`FeedbackHistoryDrawer.tsx`](../desktop-ui/src/departments/feedback/FeedbackHistoryDrawer.tsx) so you can toggle between **Compact Pill Overlay Mode** and **Full Voice & Framing Test Lab Mode**.

### Phase 4: GitHub Pages Hosting & Live Deployment
- Configure [`desktop-ui/vite.config.ts`](../desktop-ui/vite.config.ts) with `base: "./"` for portable GitHub Pages asset loading.
- Add [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) and deploy the compiled production bundle to GitHub Pages (`gh-pages` branch / GitHub Pages API) so it is live immediately at `https://dr-week.github.io/hey-FRIDAY-/`.
