/**
 * Communication Corpus — offline dictionary of ~1.7k everyday Q→A pairs
 * (greetings, emotions, humor, small talk, tech support...), built from
 * gunthercox/chatterbot-corpus (BSD-3-Clause). Lazy-loaded, fuzzy token matching.
 */

interface Pair { readonly q: string; readonly a: string; readonly cat: string }
interface Indexed extends Pair { readonly toks: Set<string> }

export interface CorpusMatch { readonly reply: string; readonly score: number; readonly category: string }

const STOP = new Set(["the", "a", "an", "is", "are", "to", "of", "do", "does", "you", "your", "i", "me", "my", "it", "and", "in", "what", "can"]);
let index: Indexed[] | null = null;
let loading: Promise<Indexed[]> | null = null;

const tokens = (s: string): string[] =>
  s.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);

function keyTokens(s: string): Set<string> {
  const all = tokens(s);
  const key = all.filter((t) => !STOP.has(t));
  return new Set(key.length ? key : all);
}

export function loadCorpus(): Promise<Indexed[]> {
  if (index) return Promise.resolve(index);
  if (!loading) {
    const base = (import.meta as any).env?.BASE_URL ?? "/";
    loading = fetch(`${base}corpus/communication.json`)
      .then((r) => r.json())
      .then((d: { pairs: Pair[] }) => (index = d.pairs.map((p) => ({ ...p, toks: keyTokens(p.q) }))))
      .catch(() => (index = []));
  }
  return loading;
}

/** Dice similarity on content tokens + exact-phrase bonus. */
function score(q: Set<string>, rawQ: string, p: Indexed): number {
  if (!p.toks.size || !q.size) return 0;
  let inter = 0;
  q.forEach((t) => { if (p.toks.has(t)) inter++; });
  const dice = (2 * inter) / (q.size + p.toks.size);
  const exact = p.q.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim() === rawQ ? 0.3 : 0;
  return Math.min(1, dice + exact);
}

export async function matchCorpus(text: string, minScore = 0.5): Promise<CorpusMatch | null> {
  const idx = await loadCorpus();
  const q = keyTokens(text);
  const rawQ = tokens(text).join(" ");
  let best: Indexed | null = null;
  let bestScore = 0;
  for (const p of idx) {
    const s = score(q, rawQ, p);
    if (s > bestScore) { bestScore = s; best = p; }
  }
  if (!best || bestScore < minScore) return null;
  // Pick a random answer among equally-good questions for variety.
  const ties = idx.filter((p) => p.q === best!.q);
  const chosen = ties[Math.floor(Math.random() * ties.length)];
  return { reply: chosen.a, score: Math.round(bestScore * 100) / 100, category: chosen.cat };
}

export async function corpusStats(): Promise<Record<string, number>> {
  const idx = await loadCorpus();
  return idx.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.cat]: (acc[p.cat] ?? 0) + 1 }), {});
}
