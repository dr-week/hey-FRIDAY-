/**
 * Knowledge Cache — FRIDAY's learned-answers database (localStorage).
 * Answers found online / from AI are saved so the next ask is instant + offline.
 * Also exported with training data to Google Drive.
 */

export interface KnowledgeEntry {
  readonly q: string;
  readonly a: string;
  readonly source: string;
  readonly dept: string;
  readonly at: number;
  hits: number;
}

const KEY = "friday_knowledge_v1";
const MAX = 500;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

function load(): Record<string, KnowledgeEntry> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

function save(db: Record<string, KnowledgeEntry>): void {
  const entries = Object.entries(db);
  if (entries.length > MAX) {
    entries.sort((a, b) => b[1].hits - a[1].hits || b[1].at - a[1].at);
    db = Object.fromEntries(entries.slice(0, MAX));
  }
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* quota */ }
}

export function recallKnowledge(q: string): KnowledgeEntry | null {
  const db = load();
  const hit = db[norm(q)];
  if (!hit) return null;
  hit.hits++;
  save(db);
  return hit;
}

export function learnKnowledge(q: string, a: string, source: string, dept: string): void {
  if (!a || a.length < 3) return;
  const db = load();
  db[norm(q)] = { q, a, source, dept, at: Date.now(), hits: 0 };
  save(db);
}

/** User said "that's wrong" → forget so it re-asks next time. */
export function forgetKnowledge(q: string): void {
  const db = load();
  delete db[norm(q)];
  save(db);
}

export const allKnowledge = (): KnowledgeEntry[] => Object.values(load());
