/**
 * Microsoft & Windows Decisions Department
 * Evaluates environment actions, safe storage decisions, and approval gates (<100 lines).
 */
import { departmentDb, type ClientDecisionItem } from "../database/departmentDb.ts";

export interface DecisionEvaluation {
  isDecision: boolean;
  action: string;
  details: string;
  risk: "low" | "medium" | "high";
  env: "windows" | "microsoft" | "cloud";
}

const HIGH_RISK_RE = /\b(delete|remove|kill|format|shutdown|reboot|erase|wipe|override|registry)\b/i;
const SAVE_FILE_RE = /\b(?:save|store|export) (?:this |the )?(?:to|as|in) (?:file |disk |storage )?([a-z0-9_.-]+)\b/i;

export function evaluateEnvironmentDecision(text: string): DecisionEvaluation {
  const saveMatch = text.match(SAVE_FILE_RE);
  if (saveMatch) {
    const filename = saveMatch[1].trim();
    return {
      isDecision: true,
      action: `Save to file: ${filename}`,
      details: `Persist current session text or transcript to disk as ${filename}`,
      risk: "low",
      env: "windows",
    };
  }

  const isExplicit = /\b(?:decide to|make a decision|approve action|take decision)\b/i.test(text);
  const isHighRisk = HIGH_RISK_RE.test(text);

  if (isExplicit || isHighRisk) {
    return {
      isDecision: true,
      action: text.replace(/^(?:decide to|make a decision|take decision)\s*/i, ""),
      details: `Evaluate execution in Windows environment: "${text}"`,
      risk: isHighRisk ? "high" : "medium",
      env: "windows",
    };
  }

  return { isDecision: false, action: "", details: "", risk: "low", env: "windows" };
}

export function executeFileSaveDecision(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.includes(".") ? filename : `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function recordAndProposeDecision(evalResult: DecisionEvaluation): ClientDecisionItem {
  return departmentDb.proposeDecision(evalResult.action, evalResult.details, evalResult.risk, evalResult.env);
}
