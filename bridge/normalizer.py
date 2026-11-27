"""
Phonetic & Indian-English Sentence Normalizer for Hey FRIDAY.
Repairs common Windows/Web Speech ASR transcription errors before Laya routing.
"""

import re

PHONETIC_REPLACEMENTS = [
    (r"\b(get|git|good|kit)\s+(statues|status|stat|stats)\b", "git status"),
    (r"\b(un\s+mute|on\s+mute)\b", "unmute"),
    (r"\b(newt|miute|moot)\s+(audio|sound|pc|computer)\b", "mute audio"),
    (r"\b(weather|whether|feather)\b", "weather"),
    (r"\b(run\s+bun\s+test|bun\s+tests|project\s+test|run\s+text)\b", "run tests"),
    (r"\b(lock\s+work\s+station|log\s+workstation|lock\s+walk\s+station)\b", "lock workstation"),
    (r"\b(recycle\s+been|recycle\s+bean)\b", "recycle bin"),
    (r"\b(screen\s+shot|screen\s+short)\b", "screenshot"),
    (r"\b(hey\s+freddie|hay\s+friday|a\s+friday|he\s+friday|ok\s+friday)\b", "hey friday"),
]


def normalize_spoken_query(raw_query: str) -> str:
    """
    Cleans raw ASR speech output and fixes phonetic misspellings.
    """
    if not raw_query:
        return ""
    cleaned = raw_query.strip()
    for pattern, replacement in PHONETIC_REPLACEMENTS:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip()
