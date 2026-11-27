"""
Laya System-1 Decision Schema & Heuristic Fallback Classifier.
Strictly micro-modular (<110 lines).
"""

DECISION_QUESTIONS = {
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
    },
    "safety_gate": {
        "type": "noul",
        "instructions": "Does this command permanently delete files, empty trash, or lock the workstation session?"
    }
}

DESTRUCTIVE_INTENTS = {"system_lock", "system_empty_bin"}

HEURISTIC_PATTERNS = [
    ("system_volume_mute", ["mute audio", "mute sound", "unmute", "silence", "sound off"]),
    ("system_volume_up", ["volume up", "increase volume", "louder", "raise volume"]),
    ("system_volume_down", ["volume down", "decrease volume", "softer", "lower sound"]),
    ("media_play_pause", ["pause music", "pause song", "play music", "resume music", "play song"]),
    ("media_next", ["next song", "skip track", "next track"]),
    ("media_prev", ["previous song", "restart track", "prev track", "previous track"]),
    ("system_lock", ["lock computer", "lock screen", "lock pc", "lock workstation"]),
    ("system_empty_bin", ["empty recycle bin", "empty bin", "clear trash"]),
    ("system_screenshot", ["take screenshot", "capture screen", "snip screen", "screenshot"]),
    ("system_status", ["check system status", "system status", "battery status", "ram status", "hardware health"]),
    ("dev_git_status", ["git status", "check git", "repo status"]),
    ("dev_run_tests", ["run test", "run tests", "test suite", "bun test"]),
    ("dev_port_check", ["check port", "server port", "port 4141"]),
    ("weather_check", ["weather", "temperature", "umbrella", "forecast", "rain"]),
    ("smalltalk", ["hello", "hi friday", "hey friday", "who are you", "how are you"]),
]


def classify_heuristic(normalized_query: str) -> tuple[str, float]:
    """
    Fast deterministic pattern matcher used when neural weights are offline.
    """
    lower = normalized_query.lower().strip()
    if lower == "mute":
        return "system_volume_mute", 0.96

    for intent, keywords in HEURISTIC_PATTERNS:
        for kw in keywords:
            if kw in lower:
                return intent, 0.96

    return "unknown", 0.35
