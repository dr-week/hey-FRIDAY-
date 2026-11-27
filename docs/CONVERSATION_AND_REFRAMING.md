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
