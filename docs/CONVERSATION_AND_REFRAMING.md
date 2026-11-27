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
