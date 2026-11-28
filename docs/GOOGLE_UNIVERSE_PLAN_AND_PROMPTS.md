# Hey FRIDAY: Google Universe Integration Masterplan & Prompts

A phased execution roadmap and ready-to-use operational prompts to connect Hey FRIDAY with Google tools for live dataset storage, reasoning, and automated training.

---

## 1. Architecture Topology: Google Ecosystem Integration

```
Hey FRIDAY (Client / Desktop / Android / Extension)
 ├── Speech-to-Text: Chrome USM (webkitSpeechRecognition) / Android SpeechRecognizer
 ├── On-Device Thinking: Chrome Built-in Prompt API (Gemini Nano)
 ├── Cloud Reasoning: Google AI Studio (Gemini 2.5 Flash / Flash Lite)
 ├── Realtime Feedback & Training:
 │    ├── Google Sheets CLI / API (Live feedback & disfluency correction spreadsheet)
 │    └── Google Drive API (JSONL dataset backups in "HeyFRIDAY-Training")
 ├── Automation & Training Pipeline:
 │    └── Google Colab (Free T4/TPU notebook fine-tuning custom intent embeddings)
 └── Productivity Assistant Skills:
      ├── Google Calendar (Schedule lookups & daily briefings)
      └── Google Tasks (Voice notes synchronization)
```

---

## 2. Phased Implementation Roadmap

### Phase A: Live Google Sheets Feedback & Training Pipeline
- **Goal**: Automatically log every user interaction, disfluency reframing, and thumbs-up/thumbs-down rating into a shared, live Google Sheet.
- **Tech Stack**: `gsheets` CLI + Google Sheets API V4 + `FeedbackButtonBar.tsx`.
- **Deliverables**:
  - Auto-created spreadsheet: `Hey FRIDAY Training Data Hub`.
  - Structured columns: `Timestamp`, `Raw Spoken`, `Reframed Utterance`, `Detected Intent`, `Rating`, `Corrected Text`, `Platform`.
  - Exportable directly as CSV / JSONL for training.

### Phase B: Gemini 2.5 Flash & Chrome Nano Hybrid Brain
- **Goal**: Seamless tiering between zero-latency offline on-device models and Google Cloud reasoning.
- **Tech Stack**: Chrome Prompt API (`window.ai` / `LanguageModel`) + Google AI Studio REST endpoint.
- **Deliverables**:
  - Sub-50ms local intent classification via Gemini Nano when offline.
  - Automatic fallback to Gemini 2.5 Flash for deep research, coding questions, and multi-step agent planning.

### Phase C: Google Colab Free GPU Model Fine-Tuning
- **Goal**: Train custom lightweight embeddings (e.g. `sentence-transformers` or OpenWakeWord) on user speech data at zero cost.
- **Tech Stack**: Google Colab (Free T4 GPU runtime) + PyTorch + ONNX Runtime.
- **Deliverables**:
  - `notebooks/Hey_FRIDAY_Model_Trainer.ipynb` ready to open in Google Colab with 1 click.
  - Automatically loads `HeyFRIDAY-Training` datasets from Google Drive, trains a quantized model, and outputs `.onnx` weights.

### Phase D: Google Calendar & Daily Briefing Skill
- **Goal**: Morning and evening voice briefings combining calendar events, local weather, hardware status, and git commits.
- **Tech Stack**: Google Calendar API + `assistantSkills.ts`.
- **Deliverables**:
  - Voice query: *"Hey Friday, give me my daily briefing"* or *"What's on my calendar today?"*.
  - Spoken audio briefing with natural female TTS.

---

## 3. Ready-to-Use Prompts

### Prompt 1: Activate Google Sheets Training Logger
Use this prompt to instruct Antigravity or any agent to initialize the live spreadsheet:

```markdown
Run the Google Sheets integration for Hey FRIDAY:
1. Use the pre-installed gsheets CLI to create a new spreadsheet titled "Hey FRIDAY Training Data Hub".
2. Set up headers in Row 1: [Timestamp, Raw Spoken, Reframed Utterance, Detected Intent, Rating, Corrected Text, Platform].
3. Apply styling: Bold header row, background color #10B981 (emerald), text color #FFFFFF.
4. Add an export script in scripts/google/sync_sheets.ts that syncs local data/feedback/training_feedback.jsonl to this sheet.
5. Provide the live Google Sheets URL for testing.
```

### Prompt 2: Deploy Google Colab Free Training Pipeline
Use this prompt to build the zero-cost model training notebook:

```markdown
Create a micro-modular Google Colab training notebook at notebooks/Hey_FRIDAY_Colab_Trainer.ipynb:
1. Mount Google Drive and locate the HeyFRIDAY-Training folder.
2. Load and parse the feedback JSONL and CSV training records.
3. Fine-tune a lightweight intent classification head using PyTorch and Hugging Face transformers.
4. Export the resulting model as an optimized ONNX model under 15 MB for zero-latency execution in Hey FRIDAY.
5. Add 1-click 'Open in Colab' badge to the README.
```

### Prompt 3: Add Google Calendar Morning Briefing Skill
Use this prompt to equip FRIDAY with daily schedule awareness:

```markdown
Implement the Google Calendar Assistant Skill in desktop-ui/src/departments/conversation/assistantSkills.ts:
1. Create a micro-modular calendar parser under 80 lines.
2. Recognize voice queries: "what's on my schedule today", "calendar check", "daily briefing".
3. Fetch upcoming events, format them into 1-2 spoken sentences with natural female TTS.
4. Integrate with the existing daily briefing pipeline alongside weather and system status.
```
