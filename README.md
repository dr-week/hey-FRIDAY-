# HEY FRIDAY: Zero-Latency System-1 Desktop Assistant

> **An ultra-lightweight, zero-cloud-cost, background voice & OS automation assistant for Windows.**

---

## 🧭 Executive Summary & Core Baseline

### 1. The Core Problem with Standard AI Assistants
Traditional LLMs (ChatGPT, Claude, Copilot) are **generative auto-regressive models**. When you speak a simple desktop command like *"mute audio"* or *"lock my screen"*:
- They generate tokens word-by-word sequentially.
- They incur **800ms–3000ms latency**.
- They consume costly cloud API tokens and burn high compute.
- They can hallucinate and misunderstand basic deterministic commands.

### 2. The Non-Autoregressive System-1 Solution
Hey Friday uses [NandhaKishorM/laya](https://github.com/NandhaKishorM/laya) as a **System-1 decision engine**:
- **Single Forward Pass Execution**: Evaluates the entire prompt at once in **sub-30ms**.
- **Deterministic Typed Decisions**: Directly routes to exact TypeScript enums (`FridayIntent`) without token generation overhead.
- **Zero Cloud Cost**: 100% offline, local ONNX/PyTorch neural weights.
- **Zero Background Mic Blocking**: Uses Windows Shared Audio streams, keeping your microphone free for Discord, WhatsApp calls, and games.

---

## 🏗️ Architecture & Component Topology

```
[User Voice Input / Push-To-Talk: Ctrl+Shift+Space]
                     │
                     ▼
[Google Speech Recognition Hook (en-IN)]
      │ (Continuous background stream with "Hey Friday" wake-word gating)
      ▼
[React 19 Floating Pill UI (Vite + Strict TS)]
      │ (Glassmorphic, Draggable, 60px Magnetic Edge Snapping)
      ▼ HTTP POST /api/query { query: string, speak: boolean }
[Bun HTTP Server (src/server/index.ts - Port 4141)]
      │
      ▼
[FridayAssistant Core Orchestrator (src/core/friday.ts)]
      ├──▶ [LayaEngine (bridge/laya_bridge.py)] ────────── sub-30ms Intent Routing
      ├──▶ [WindowsControlService (Win32/PowerShell)] ──── Volume, Media, Lock, Screenshot, RAM
      ├──▶ [DevCommandService (src/services/dev_service)] ─ Git status, Bun test runner, Port audit
      ├──▶ [FridayDatabase (bun:sqlite)] ──────────────── Local C-SQLite history & preferences
      └──▶ [SpeechService (src/services/speech.ts)] ────── Microsoft Zira natural female TTS
```

---

## 💻 As a Software Engineer: What You Need to Know

### 1. Single-Instance Process Lifecycle (The Launcher Pattern)
In production desktop software, spawning multiple server instances causes **port collisions (EADDRINUSE)**, corrupted SQLite locks, and multiple background audio capture processes.
- **What this process is called**: **Single-Instance Mutex & Process Lifecycle Supervisor**.
- **How our launcher enforces this**:
  - Checks if port `4141` is occupied. If yes, it terminates the existing PID.
  - Cleans up any dangling `laya_bridge.py` worker processes.
  - Releases network sockets before spawning the fresh instance.
  - Pipes stderr to `data/crashes/launcher.log` on unexpected exits.

### 2. Unidirectional Data Flow
- **Input**: The React UI never interacts directly with Python or Win32 APIs. It sends clean REST payloads to the Bun server.
- **Processing**: The Bun orchestrator passes the query string via stdio stream (`stdin/stdout`) to `bridge/laya_bridge.py`.
- **Execution**: The orchestrator triggers the native service and stores the decision in SQLite.
- **Output**: The frontend receives the response text, updates the glass subtitle toast, and the voice synthesizer speaks aloud.

### 3. Fail-Safe Dual Gating
To guarantee that background chatter or room noise never triggers random actions:
1. **Gate 1 (Acoustic Wake-Word Filter)**: `useGoogleSpeech.ts` discards any audio stream that does not begin with `"Hey Friday"` or `"Friday"`.
2. **Gate 2 (Strict Intent Classification)**: If an unrecognized phrase passes Gate 1, Laya routes it to `unknown` with zero OS side effects.

---

## 📂 Codebase Directory Layout

```text
heyFRIDAY/
├── bridge/                     # Python AI decision engine bridge
│   └── laya_bridge.py          # Laya System-1 non-autoregressive classifier
├── data/                       # Local persistent data storage
│   ├── crashes/                # Automated structured JSON crash telemetry
│   │   └── launcher.log        # BAT supervisor lifecycle log
│   └── friday.sqlite           # Embedded C-SQLite database
├── desktop-ui/                 # Industrial React 19 + Strict TypeScript UI
│   ├── src/
│   │   ├── components/         # PillWidget, MicButton, ActionButton, CloseButton, SpeechToast
│   │   ├── hooks/              # useGoogleSpeech (wake-word gating), useDraggablePill (magnetic edge snap)
│   │   ├── services/           # api.ts (HTTP client to Bun server)
│   │   ├── App.css             # Glassmorphic neon CSS & physics-based spring animations
│   │   └── App.tsx             # Root UI orchestrator
│   └── dist/                   # Production-compiled Vite bundle
├── docs/                       # Diagnostic guides & architecture runbooks
│   └── CRASH_RECOVERY.md       # Self-healing and diagnostic CLI documentation
├── scripts/                    # Launchers & operations
│   ├── start_friday.bat        # Windows BAT Single-Instance Supervisor Launcher
│   ├── start_friday.ps1        # PowerShell alternative launcher
│   └── crash_analyzer.ts       # Interactive CLI crash log reader
├── src/                        # Bun Backend Core (Strict TypeScript)
│   ├── core/                   # friday.ts (orchestrator), engine.ts (stdio IPC), types.ts
│   ├── server/                 # index.ts (Bun.serve), apiRoutes.ts, staticRoutes.ts, windowLauncher.ts
│   ├── services/               # windows_control.ts, dev_service.ts, speech.ts, db.ts, crash_logger.ts
│   └── tests/                  # Automated test suite (friday.test.ts)
├── package.json
└── tsconfig.json
```

---

## 🚀 How to Run

### 1. Standard Single-Instance Launch (Recommended)
Double-click `scripts/start_friday.bat` or run:
```cmd
scripts\start_friday.bat
```
*(Automatically terminates any existing instance, prevents port collisions, and logs errors).*

### 2. Run with Bun CLI
```bash
bun run server
```

### 3. Open Widget UI Directly
```powershell
Start-Process "http://127.0.0.1:4141"
```

### 4. Run Automated Regression Test Suite
```bash
bun test
```

---

## 🎙️ Control & Interaction Guide

| Action | How to Trigger | What Happens |
|---|---|---|
| **Voice Wake Word** | Say *"Hey Friday, ... "* | Gated speech recognition activates, parses command, executes action. |
| **Whisper Push-To-Talk**| Press **`Ctrl + Shift + Space`** | Wakes mic instantly without saying "Hey Friday". |
| **Mute / Unmute** | Click `VolumeX` icon or say *"Hey Friday, mute audio"* | Toggles Windows audio mute via Win32 ComObject. |
| **Snip / Screenshot** | Click `Camera` icon or say *"Hey Friday, take screenshot"* | Captures primary display and saves to Pictures folder. |
| **Git Status** | Click `GitBranch` icon or say *"Hey Friday, check git status"*| Runs `git status -s` in under 30ms. |
| **Run Test Suite** | Say *"Hey Friday, run tests"* | Spawns Bun automated test suite and reports status. |
| **Lock Workstation** | Click `Lock` icon or say *"Hey Friday, lock computer"* | Calls `user32.dll,LockWorkStation`. |
| **Exit / Terminate** | Click crimson `X` icon or press **`Escape`** | Shuts down Bun server, closes SQLite, terminates Laya. |

---

## 🖥️ Production Native Overlay Architecture (No Browser Needed)

In development, Hey Friday renders via an isolated frameless window. In **production standalone mode**, Hey Friday compiles into a zero-browser native OS overlay using:

```
┌────────────────────────────────────────────────────────┐
│            Native Windows Desktop Workspace            │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Frameless Layered Transparent Overlay            │  │
│  │ [Drag] [Mute] [Snip] [Mic] [~~~WAVE~~~] [Git] [X]│  │
│  └──────────────────────────────────────────────────┘  │
│          ▲                                             │
│          │ Win32 WS_EX_LAYERED + WS_EX_TOPMOST        │
│          │ Magnetic Edge & Wall Docking (Snaps <70px) │
└──────────┴─────────────────────────────────────────────┘
```

### 1. Zero-Browser Overlay Target (Tauri v2 / Native Win32)
- **Tauri v2 (Rust + WebView2 Runtime)**: Zero Node.js runtime, generates a compiled single executable (~12MB) with:
  - Transparent window background (`transparent: true`, `decorations: false`).
  - Native Windows taskbar tray icon and global OS hotkey hook.
  - Native `SetWindowPos(HWND_TOPMOST)` ensuring it floats over full-screen games, IDEs, and code editors.
- **Node-Independent Process**: Spawns Bun and Python as background child worker threads or bundles ONNX runtime directly without external browser windows.

### 2. Magnetic Wall Docking & Edge Snapping
- **Perimeter Edge Detection**: When dragged within **70px** of any monitor edge (left, right, top, bottom), the widget automatically docks and straightens against the wall.
- **Visual Dock State**: The touching border highlights with an accent glow (`docked-left`, `docked-right`, `docked-top`, `docked-bottom`).

### 3. Active Glowing Audio Waveform Visualizer
- **Visual Feedback for Voice Activity**:
  - **Standby (Idle)**: Gentle subtle breathing pulse (slate grey).
  - **Listening (Active Stream)**: Vibrant cyan/blue glowing 7-bar dynamic audio frequency animation indicating active microphone capture.
  - **Processing Intent**: Violet/magenta waveform sweep during sub-30ms decision execution.

---

## 🔮 Roadmap: Full-Sentence Restructuring ASR

To advance beyond streaming phrase capture, the project is structured to adopt **Full-Sentence Restructuring**:
1. **Acoustic Transcription**: Local embedded `whisper.cpp` (or `faster-whisper distil-small.en`) to buffer and transcribe complete waveforms.
2. **Intent Restructuring**: Pass the raw sentence through Laya's single-pass decision model, which discards disfluencies and filler words (*"uh, can you please like..."*) and extracts the canonical command.

