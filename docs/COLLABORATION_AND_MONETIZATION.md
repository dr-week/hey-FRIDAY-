# 🤝 Data Collaboration, Free Cloud GPU Training & Grant Strategy

> **Project**: Hey FRIDAY (`dr-week/hey-FRIDAY-`)  
> **Department**: Data Collaboration & Training Ecosystem  
> **Goal**: Turn Hey FRIDAY’s voice framing & wake-word feedback logs (`laya_training.csv` & `training_feedback.jsonl`) into **free GPU training, ecosystem partnerships, and dataset grants/bounties**.

---

## 1. Why Hey FRIDAY's Feedback Dataset Is Valuable

Most public ASR and intent datasets (`LibriSpeech`, `Banking77`, `CLINC150`) contain **clean, scripted studio text**—not real-world **Indian-English (`en-IN`) spoken developer commands with ASR phonetic errors** (e.g., *"Hey Freddie check get statues"* → `dev_git_status`).

Every time you or a tester clicks **Exact / Fix / Woke / Missed / Good / Weird** in the Hey FRIDAY Studio, the app builds a triple-aligned dataset:
1. **Noisy ASR Spoken Input** (`raw_spoken`)
2. **Human-Verified Gold Framing** (`state`)
3. **Typed System-1 Intent + Wake-Word Evaluation** (`intent`, `wake_word_status`, `framing_status`)

---

## 2. Top 5 Collaboration, Free Training & Monetization Channels

| Partner / Platform | Program Type | What We Share / Contribute | What We Get (Free Training / Grants / Revenue) | Action Link |
| :--- | :--- | :--- | :--- | :--- |
| **1. VegaML & Laya (`studio.embedding.in`)** | **Direct Engine Author Collaboration** (`NandhaKishorM/laya`) | Share our `laya_training.csv` desktop voice-command benchmark & showcase Hey FRIDAY as a reference desktop client for Laya. | **10,000 free hosted decisions/mo** on `platform.embedding.in`, 9-second zero-GPU `.fit()` calibration heads, and featured ecosystem placement on Laya's 36k-star repo. | [studio.embedding.in](https://studio.embedding.in) • [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya) |
| **2. Hugging Face (`ZeroGPU` & Community Grants)** | **Free NVIDIA Blackwell GPU Grant** | Publish our anonymized `dr-week/indian-english-voice-commands` dataset on Hugging Face Datasets. | **Free Hugging Face ZeroGPU allocation** (dynamic NVIDIA RTX Pro 6000 GPUs) to host a live Laya + Whisper voice router Space at $0 cost, plus eligibility for Hugging Face Community Compute Grants. | [huggingface.co/datasets](https://huggingface.co/datasets) • [ZeroGPU Docs](https://huggingface.co/docs/hub/en/spaces-zerogpu) |
| **3. OpenWakeWord Training Center (`openwakeword.com`)** | **Free Custom ONNX Wake-Word Cloud Training** | Submit `"hey_friday"` wake phrase and positive/negative voice clips to the OpenWakeWord community library. | **1-click free cloud GPU training** producing a custom `hey_friday.onnx` wake-word model (<2MB) that works 100% offline with 100x fewer false positives. | [openwakeword.com/train](https://openwakeword.com/train) • [openwakeword.com/ecosystem](https://openwakeword.com/ecosystem) |
| **4. AI4Bharat (`Svarah` / IIT Madras) & Mozilla Common Voice** | **Academic & Open-Source Indic ASR Grants** | Contribute Indian-accented technical & developer voice framing pairs (`en-IN` noisy ASR → gold transcript). | Co-citation/featured dataset integration in `ai4bharat/Svarah`, access to fine-tuned Indic Whisper/Conformer checkpoints, and Mozilla Common Voice ecosystem grants. | [huggingface.co/datasets/ai4bharat/Svarah](https://huggingface.co/datasets/ai4bharat/Svarah) • [commonvoice.mozilla.org](https://commonvoice.mozilla.org) |
| **5. Commercial ASR Data Marketplaces & GitHub Sponsors** | **Dataset Licensing & Bounties** | Package verified 1,000+ row Indian-English Developer Voice Command corpus (commercial ASR datasets in India price at ₹3,200–₹11,000 per validated hour). | Direct dataset licensing to Indic voice-AI startups, plus **GitHub Sponsors / Ko-fi** enabled directly on the repo & Web Studio. | [github.com/sponsors](https://github.com/sponsors) |

---

## 3. Ready-to-Run Free Laya `.fit()` Training Recipe (Zero GPU Needed)

Once you export `laya_training.csv` from the **Training Logs & Export** section of the Web Studio (with at least 35 rows), you can train a custom calibrated head in **9 seconds on CPU** with zero cloud cost:

```python
import laya

questions = {
    "intent": {
        "type": "choice",
        "instructions": "What is the primary user action or operating system command?",
        "criteria": {
            "system_volume_mute": "mute audio, unmute, silence computer, sound off",
            "system_volume_up": "volume up, increase sound, louder, raise volume",
            "system_volume_down": "volume down, lower sound, softer, reduce volume",
            "media_play_pause": "pause music, play song, resume playback, toggle media",
            "media_next": "next song, skip track, next music",
            "media_prev": "previous song, restart track, back track",
            "system_lock": "lock computer, lock screen, lock workstation, secure pc",
            "system_empty_bin": "empty recycle bin, clear trash, clean recycle bin",
            "system_screenshot": "take screenshot, capture screen, snip screen",
            "system_status": "computer status, RAM, memory, battery, hardware health",
            "dev_git_status": "git status, check git, uncommitted changes, repo status",
            "dev_run_tests": "run tests, test suite, run bun test, check tests",
            "dev_port_check": "check port, server port, port listening, port 4141",
            "weather_check": "general weather, temperature, rain or umbrella forecast",
            "smalltalk": "greetings, hello, how are you, who are you",
            "unknown": "any other request or unrecognized query"
        }
    }
}

agent = laya.Agent(vegaml=True)
report = agent.fit("data/feedback/laya_training.csv", questions=questions)
print("Calibration report:", report)
agent.save_calibration("data/calibration/")
```
