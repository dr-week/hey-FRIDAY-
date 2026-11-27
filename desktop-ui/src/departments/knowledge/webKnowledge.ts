/**
 * Web Knowledge — free, key-less, browser-friendly (CORS) lookups:
 *   • Wikipedia search + REST summary  (origin=* CORS)
 *   • Free Dictionary API (dictionaryapi.dev) for "define X" / "meaning of X"
 *   • DuckDuckGo Instant Answer (best-effort; may be CORS-blocked → skipped)
 */

export interface WebAnswer { readonly text: string; readonly source: string; readonly url?: string }

const TIMEOUT = 6000;

async function getJson(url: string): Promise<any> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const firstSentences = (s: string, n = 2) => (s.match(/[^.!?]+[.!?]+/g) ?? [s]).slice(0, n).join(" ").trim();

export async function defineWord(text: string): Promise<WebAnswer | null> {
  const m = text.match(/\b(?:define|definition of|meaning of|what does)\s+([a-z-]+)(?:\s+mean)?/i);
  if (!m) return null;
  try {
    const d = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(m[1])}`);
    const meaning = d?.[0]?.meanings?.[0];
    const def = meaning?.definitions?.[0]?.definition;
    return def ? { text: `${m[1]} (${meaning.partOfSpeech}): ${def}`, source: "Free Dictionary" } : null;
  } catch { return null; }
}

/** Strip question words so "who is APJ Abdul Kalam" → "APJ Abdul Kalam". */
export function toSearchTopic(text: string): string {
  return text
    .replace(/^(search( online)?( for)?|look up|google|tell me about|do you know|can you tell me)\s+/i, "")
    .replace(/^(who|what|where|when|which)\s+(is|are|was|were)\s+(the\s+)?/i, "")
    .replace(/^(how (does|do|did)|why (is|does|do))\s+/i, "")
    .replace(/[?.!]+$/, "")
    .trim();
}

export async function searchWikipedia(text: string): Promise<WebAnswer | null> {
  const topic = toSearchTopic(text);
  if (topic.length < 2) return null;
  try {
    const s = await getJson(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(topic)}`
    );
    const title = s?.query?.search?.[0]?.title;
    if (!title) return null;
    const sum = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!sum?.extract) return null;
    return { text: firstSentences(sum.extract), source: "Wikipedia", url: sum.content_urls?.desktop?.page };
  } catch { return null; }
}

export async function searchDuckDuckGo(text: string): Promise<WebAnswer | null> {
  try {
    const d = await getJson(`https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=${encodeURIComponent(toSearchTopic(text))}`);
    const t = d?.Answer || d?.AbstractText || d?.Definition;
    return t ? { text: firstSentences(String(t)), source: "DuckDuckGo", url: d.AbstractURL } : null;
  } catch { return null; }
}

export async function searchOnline(text: string): Promise<WebAnswer | null> {
  return (await defineWord(text)) ?? (await searchDuckDuckGo(text)) ?? (await searchWikipedia(text));
}

/** Is this an information-seeking question worth looking up? */
export const isKnowledgeQuestion = (t: string): boolean =>
  /^(who|what|where|when|which|why|how|define|meaning|search|look up|google|tell me about|do you know)\b/i.test(t.trim());
