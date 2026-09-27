#!/usr/bin/env python3
"""
Laya System-1 Decision Bridge
Communicates with Bun TypeScript host via fast JSON Lines over stdin/stdout.
"""

import sys
import json
import time

def main():
    try:
        from laya import Router
        # Preload English decision model
        router = Router()
        has_laya = True
    except Exception as e:
        sys.stderr.write(f"Warning: Laya model initialization fallback: {e}\n")
        sys.stderr.flush()
        has_laya = False

    # Define Friday's System-1 decision schema
    decision_questions = {
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

    # Signal to TypeScript that Laya engine is ready
    sys.stdout.write(json.dumps({"status": "ready", "has_laya": has_laya}) + "\n")
    sys.stdout.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        if line == "EXIT":
            break

        try:
            req = json.loads(line)
            query = req.get("query", "")
            start_time = time.perf_counter()

            if has_laya:
                res = router.predict(query, decision_questions)
                latency = round((time.perf_counter() - start_time) * 1000, 2)
                
                output = {
                    "text": query,
                    "modelUsed": res.get("routing", {}).get("model", "laya"),
                    "latencyMs": latency,
                    "answers": {
                        "intent": {
                            "choice": res.get("answers", {}).get("intent", {}).get("choice", "unknown")
                        }
                    }
                }
            else:
                # Deterministic pattern fallback if model is still caching weights
                lower = query.lower()
                intent = "unknown"
                if "mute audio" in lower or "mute sound" in lower or "unmute" in lower or lower == "mute":
                    intent = "system_volume_mute"
                elif "volume up" in lower or "increase volume" in lower or "louder" in lower:
                    intent = "system_volume_up"
                elif "volume down" in lower or "decrease volume" in lower or "softer" in lower:
                    intent = "system_volume_down"
                elif "pause music" in lower or "pause song" in lower or "play music" in lower or "resume music" in lower:
                    intent = "media_play_pause"
                elif "next song" in lower or "skip track" in lower or "next track" in lower:
                    intent = "media_next"
                elif "previous song" in lower or "restart track" in lower or "prev track" in lower:
                    intent = "media_prev"
                elif "lock computer" in lower or "lock screen" in lower or "lock pc" in lower:
                    intent = "system_lock"
                elif "empty recycle bin" in lower or "empty bin" in lower or "clear trash" in lower:
                    intent = "system_empty_bin"
                elif "take screenshot" in lower or "capture screen" in lower or "snip screen" in lower:
                    intent = "system_screenshot"
                elif "check system status" in lower or "system status" in lower or "battery status" in lower or "ram status" in lower:
                    intent = "system_status"
                elif "git status" in lower or "check git" in lower:
                    intent = "dev_git_status"
                elif "run test" in lower or "run tests" in lower or "test suite" in lower:
                    intent = "dev_run_tests"
                elif "check port" in lower or "server port" in lower:
                    intent = "dev_port_check"
                elif "weather" in lower or "temperature" in lower or "umbrella" in lower:
                    intent = "weather_check"
                elif "hello" in lower or "hi friday" in lower or "hey friday" in lower:
                    intent = "smalltalk"

                latency = round((time.perf_counter() - start_time) * 1000, 2)
                output = {
                    "text": query,
                    "modelUsed": "fast_heuristic",
                    "latencyMs": latency,
                    "answers": {
                        "intent": { "choice": intent }
                    }
                }

            sys.stdout.write(json.dumps(output) + "\n")
            sys.stdout.flush()

        except Exception as err:
            err_output = {
                "error": str(err),
                "query": query
            }
            sys.stdout.write(json.dumps(err_output) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
