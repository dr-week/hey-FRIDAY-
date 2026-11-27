# Conversation & Speech Reframing — Research + Phased Plan

## Why FRIDAY couldn't chat or handle messy speech
- **Stateless router**: every utterance was classified on its own. `smalltalk` returned one fixed sentence, and anything else came back as "Unrecognized".
- **Typo-only normalizer**: it fixed 9 phonetic typos but didn't handle disfluencies (self-corrections, stutters, filler words, scrambled word order).

## Techniques we adapted (open-source references)
| Technique | Source / inspiration | Where in FRIDAY |
|---|---|---|
| Reparandum → interregnum → repair model ("X *no wait* Y" → Y) | Shriberg disfluency model; Switchboard corpus; `pariajm/joint-disfluency-detector-and-parser`; `vickyzayats/switchboard_corrected_reannotated` | `reframing/disfluencyCleaner.ts` |
| Filler & stutter removal (n-gram dedupe, fragment drop) | Common ASR post-processing (Whisper / Vosk voice-assistant repos) | `disfluencyCleaner.ts` |
| Bag-of-concepts slot frames for broken grammar | Rasa / Snips NLU slot filling; OVOS `padatious` | `reframing/grammarReframer.ts` |
| Dialog state tracking (slots + last 10 turns, follow-up resolution) | Rasa trackers; Mycroft/OVOS conversational context | `conversation/conversationMemory.ts` |
| Pattern-based chit-chat with memory | ELIZA / AIML (ALICE); `Priler/jarvis` | `conversation/dialogueEngine.ts` |
| Offline utility skills (time, calculator, timer, notes) | Mycroft / OVOS skills; `Priler/jarvis` commands | `conversation/assistantSkills.ts` |

## Pipeline
```
raw speech → disfluencyCleaner → sentenceNormalizer → grammarReframer
          → resolveFollowUp (memory) → dialogue/skills ─┬─ reply (local)
                                                        └─ desktop command router (backend / browser Laya)
          → addTurn (memory) → ConversationStream UI
```

## Phases
1. ✅ **Reframing engine**: self-corrections, fillers, stutters, concept frames.
2. ✅ **Conversation memory**: name, mood, last city/intent, notes; "what about Delhi", "again", "what did I just ask".
3. ✅ **New skills**: time and date, calculator and percentages, focus/pomodoro timer with chime, voice notes, jokes, empathy replies.
4. ✅ **UI**: violet→teal Conversation & Reframing panel (raw text crossed out, then ✨ reframed text, then FRIDAY's reply), type-to-talk box, presets of messy speech.
5. ⏭ **Next**: port the reframer to `bridge/reframer.py`; optional local LLM fallback (Ollama `qwen2.5:0.5b` / `phi-3-mini`) for open-ended chat; daily briefing; feed reframe corrections from feedback logs back into the concept frames.

## Phase 6: Free "thinking" AI + cloud training storage
**Order the AI options are tried** (`departments/brain/`). FRIDAY only uses these when the offline chat replies and the command router can't answer:
| Provider | Cost | Key |
|---|---|---|
| Chrome built-in Gemini Nano (Prompt API) | Free, on-device | None |
| Google Gemini via AI Studio (`gemini-2.5-flash`) | Free tier | https://aistudio.google.com/apikey |
| Groq (`llama-3.1-8b-instant`) | Free tier, very fast | https://console.groq.com/keys |
| OpenRouter `:free` models | Free | https://openrouter.ai/keys |

Other free options to add later: Hugging Face Inference, Cloudflare Workers AI, Ollama (local), Puter.js.

**Training data** (`departments/storage/`): one-click JSONL download, or upload to **Google Drive** (`My Drive/HeyFRIDAY-Training`) using the minimal `drive.file` scope.
Later: a Hugging Face Datasets repo for sharing data publicly, plus GitHub Gist or Releases.
API keys are stored only in the browser's localStorage.

## Phase 7: Communication dictionary + UI split by function
- **Phrase dictionary**: `desktop-ui/public/corpus/communication.json` holds 1,766 question → answer pairs from [gunthercox/chatterbot-corpus](https://github.com/gunthercox/chatterbot-corpus) (BSD-3-Clause license). It covers greetings, conversations, emotion, humor, bot profile, AI, computers, coding, tech support, psychology, food and health. The matcher is `conversation/communicationCorpus.ts`.
- **What answers when FRIDAY doesn't recognize a command**: a near-exact dictionary match first, then the free AI services, then a looser dictionary match, then a friendly "didn't get that".
- **Studio tabs** (`departments/studio/`): 💬 Talk (violet→teal), ⚡ Tasks (sky→cyan icon grid plus the test bench), 🧠 Brain (amber→indigo).
- **More open datasets to add next**: Microsoft personality chit-chat (MIT license), DailyDialog, EmpatheticDialogues, Hugging Face `bavard/personachat_truecased`.

## Phase 8: FRIDAY as an "access point" that hands requests to department agents
`departments/agents/` is a supervisor/router setup, modeled on CrewAI/LangGraph supervisors and semantic-router. FRIDAY offers each request to departments in a fixed order. Free, offline ones go first; network ones go last.

| # | Department | What it handles | Data / API |
|---|---|---|---|
| 1 | conversation | Chat, empathy, memory, time, maths, timers, notes | `dialogueEngine`, `assistantSkills` |
| 2 | memory | Answers she already learned | `knowledge/knowledgeCache.ts` (localStorage, max 500) |
| 3 | tasks | Windows/desktop control | Local Bun backend or the in-browser Laya command classifier |
| 4 | communication | Near-exact match in the phrase dictionary | chatterbot-corpus, 2,305 pairs from 20 categories |
| 5 | brain | Free AI models | Chrome Nano → Gemini → Groq → OpenRouter |
| 6 | knowledge | Online lookup, for questions only | dictionaryapi.dev → DuckDuckGo Instant Answer → Wikipedia (no keys, browser-safe) |
| 7 | communication~ | Looser match in the phrase dictionary | chatterbot-corpus |

- Answers from the brain or knowledge departments are saved to memory, so the next time the same question is answered instantly and offline.
- The reply is spoken exactly once, by the pipeline.
- Each turn records which departments were tried (the `trace`).
- **Next departments**: `agents_delegate` (send work to external agents over an MCP/webhook), `windows_decide` (actions that need confirmation), `storage` (save to Drive or OneDrive on command).

## Phase 9: Access Point Hub, Structured Department Database Framework & Microsoft Decisions

### 1. FRIDAY as an Access Point & Agent Delegator
- **Access Point Orchestrator** (`departments/agents/agentDelegator.ts`):
  - Acts as an access point to any external AI agent, MCP tool, or autonomous worker.
  - Recognizes voice and text triggers: *"tell agent to [task]"*, *"ask agent to [task]"*, *"delegate task [task]"*.
  - Dispatches tasks via configurable custom Webhook / MCP URL or the fallback thinking AI brain.
  - Automatically records tasks with lifecycle states: `pending` → `running` → `completed` / `failed`.

### 2. Microsoft & Windows Environment Decisions
- **Decision Engine** (`departments/tasks/microsoftDecisions.ts`):
  - Classifies actions by risk level (`low`, `medium`, `high`) in the Microsoft/Windows environment.
  - Safely handles file saves (*"save this to file transcript.txt"*), exports, and script decisions.
  - Destructive or high-risk actions prompt an interactive review approval gate before execution.

### 3. Unified Department Database Framework
- **Backend SQLite Repositories** (`src/services/db/`):
  - `department_knowledge` (`knowledgeRepo.ts`): Learned Q&A pairs with hit counts, sources, and verification flags.
  - `department_agent_tasks` (`agentTasksRepo.ts`): Delegated AI agent tasks with status and outputs.
  - `department_decisions` (`decisionsRepo.ts`): Microsoft environment decisions and approval states.
  - Coordinated by `FridayDatabase.ts` and exposed via `/api/departments/*` in `src/server/routes/departmentRoutes.ts`.
- **Frontend Department Store** (`departments/database/departmentDb.ts`):
  - Persistent typed client database maintaining structured collections for knowledge, agent tasks, and decisions.
  - Auto-records answers learned from online search and thinking AI into the knowledge database.

### 4. 4-Tab Functional Studio
- 💬 **Talk**: Interactive conversation stream with disfluency reframing & audio reply.
- ⚡ **Tasks**: One-tap quick desktop actions + Voice test bench.
- 🤖 **Agents**: Access Point Hub (delegate tasks to other AI agents + Microsoft decision approval cards).
- 🧠 **Brain & DB**: Department Database Explorer (search/verify learned Q&A) + Free AI keys + Google Drive sync.

## Phase 10: Android APK Release, Browser Extension & Multi-Platform Showcase

### 1. Improved Scripts Architecture
- `scripts/supervisor/`:
  - `start_friday.ps1` (66 lines): Single-instance supervisor killing lingering port 4141 processes, isolated Hey Friday app windows, and python processes.
  - `start_friday.bat` (23 lines): Safe double-clickable launcher.
- `scripts/apk/`:
  - `build_apk.sh` (54 lines): Automated build tool using `aapt2`, `javac`, `d8`, `zipalign`, and `apksigner`.
- `scripts/extension/`:
  - `build_extension.sh` (20 lines): Packages the Manifest V3 browser extension into a zip for distribution.

### 2. Android Mobile APK (`android/`)
- Native lightweight WebView container with audio permission grants and zero-latency audio configuration.
- Packaged as a signed universal APK (`hey-friday-latest.apk`) in `desktop-ui/public/downloads/`.

### 3. Browser Extension (`browser-extension/`)
- Manifest V3 architecture with floating on-page trigger pill and popup interface.
- Communicates directly with local Hey Friday daemon on port 4141 or connects to GitHub Pages.

### 4. Live Showcase & Downloads Hub (`desktop-ui/src/departments/showcase/`)
- Integrated into the 5th tab (**Downloads**) of the Hey Friday Web Studio.
- Direct downloads for both Android APK (`hey-friday-latest.apk`) and Browser Extension (`hey-friday-extension.zip`).
- CI/CD release workflow via `.github/workflows/build-release.yml`.
