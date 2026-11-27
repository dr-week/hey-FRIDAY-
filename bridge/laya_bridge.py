#!/usr/bin/env python3
"""
Laya System-1 Decision Bridge (Micro-Modular Entrypoint <110 lines)
Communicates with Bun TypeScript host via fast JSON Lines over stdin/stdout.
"""

import sys
import json
import time
from normalizer import normalize_spoken_query
from schema import DECISION_QUESTIONS, DESTRUCTIVE_INTENTS, classify_heuristic


def build_response(req_id, raw_query, normalized_query, choice, confidence, pred_set, abstain, unbound, route, noul_prob, model_used, latency):
    is_destructive = noul_prob >= 0.5 or choice in DESTRUCTIVE_INTENTS
    return {
        "requestId": req_id,
        "text": raw_query,
        "normalizedText": normalized_query,
        "modelUsed": model_used,
        "latencyMs": latency,
        "answers": {
            "intent": {
                "choice": choice,
                "confidence": round(float(confidence), 4),
                "predictionSet": pred_set,
                "abstain": abstain,
                "unbound": unbound,
                "route": route,
            },
            "safetyGate": {
                "isDestructive": is_destructive,
                "probability": round(float(noul_prob), 4),
            },
        },
    }


def main():
    try:
        from laya import Router
        router = Router()
        has_laya = True
    except Exception as e:
        sys.stderr.write(f"Warning: Laya model initialization fallback: {e}\n")
        sys.stderr.flush()
        has_laya = False

    sys.stdout.write(json.dumps({"status": "ready", "has_laya": has_laya}) + "\n")
    sys.stdout.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        if line == "EXIT":
            break

        req_id = None
        raw_query = ""
        try:
            req = json.loads(line)
            req_id = req.get("requestId")
            raw_query = req.get("query", "")
            normalized = normalize_spoken_query(raw_query)
            start_time = time.perf_counter()

            if has_laya:
                res = router.predict(normalized, DECISION_QUESTIONS)
                latency = round((time.perf_counter() - start_time) * 1000, 2)
                ans_intent = res.get("answers", {}).get("intent", {})
                ans_safety = res.get("answers", {}).get("safety_gate", {})
                choice = ans_intent.get("choice", "unknown")
                conf = ans_intent.get("answer_confidence", ans_intent.get("probabilities", {}).get(choice, 0.92))
                pred_set = ans_intent.get("prediction_set", [choice])
                abstain = bool(ans_intent.get("abstain", choice == "unknown"))
                unbound = bool(ans_intent.get("unbound", False))
                route = ans_intent.get("route", "review" if abstain else "auto")
                noul_prob = float(ans_safety.get("noul", 0.95 if choice in DESTRUCTIVE_INTENTS else 0.05))
                model_used = res.get("routing", {}).get("model", "laya")
            else:
                choice, conf = classify_heuristic(normalized)
                latency = round((time.perf_counter() - start_time) * 1000, 2)
                pred_set = [choice]
                abstain = choice == "unknown"
                unbound = abstain
                route = "review" if abstain else "auto"
                noul_prob = 0.94 if choice in DESTRUCTIVE_INTENTS else 0.04
                model_used = "fast_heuristic"

            output = build_response(
                req_id, raw_query, normalized, choice, conf, pred_set, abstain, unbound, route, noul_prob, model_used, latency
            )
            sys.stdout.write(json.dumps(output) + "\n")
            sys.stdout.flush()

        except Exception as err:
            sys.stdout.write(json.dumps({"requestId": req_id, "error": str(err), "query": raw_query}) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
