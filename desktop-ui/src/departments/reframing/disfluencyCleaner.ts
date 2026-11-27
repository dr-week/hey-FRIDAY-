/**
 * Disfluency Cleaner — Reparandum / Interregnum / Repair model (Shriberg, Switchboard).
 * "mute the audio no wait actually increase the volume" -> "increase the volume"
 */

/** Interregnum markers: everything BEFORE the last one is the aborted clause (reparandum). */
const REPAIR_MARKERS = [
  "no wait", "wait no", "no no", "sorry i mean", "i mean", "i meant", "actually no",
  "scratch that", "forget that", "never mind", "nevermind", "rather", "or rather",
  "correction", "let me rephrase", "no sorry", "oops", "not that",
];

/** Spoken fillers / hedges that carry no intent. Longest first. */
const FILLERS = [
  "i was wondering if you could", "i was thinking", "could you please", "can you please",
  "would you please", "would you mind", "i want you to", "i need you to", "do me a favor and",
  "you know what", "you know", "i guess", "kind of", "sort of", "or something", "and stuff",
  "basically", "literally", "honestly", "actually", "just", "maybe", "please", "okay so",
  "ok so", "so yeah", "like", "um+", "uh+", "uhm+", "hmm+", "er+", "ah+", "yaar", "na", "haan",
];

export interface CleanResult {
  readonly cleaned: string;
  readonly removedFillers: string[];
  readonly repairApplied: boolean;
  readonly stuttersRemoved: number;
}

const esc = (s: string) => s.replace(/[.*?^${}()|[\]\\]/g, "\\$&");

/** Keep only the repair (text after the LAST repair marker), if it is non-trivial. */
export function resolveSelfCorrection(text: string): { text: string; applied: boolean } {
  let lastIdx = -1;
  let lastLen = 0;
  for (const m of REPAIR_MARKERS) {
    const re = new RegExp(`\\b${esc(m)}\\b`, "gi");
    let hit: RegExpExecArray | null;
    while ((hit = re.exec(text))) {
      const end = hit.index + hit[0].length;
      if (end > lastIdx + lastLen || (end === lastIdx + lastLen && hit.index < lastIdx)) {
        lastIdx = hit.index; lastLen = hit[0].length;
      }
    }
  }
  if (lastIdx < 0) return { text, applied: false };
  const repair = text.slice(lastIdx + lastLen).replace(/^[\s,.]+/, "").trim();
  if (repair.split(/\s+/).filter(Boolean).length < 1) return { text, applied: false };
  // Partial repair ("weather in Mumbai, I mean Goa") -> substitute the last word(s).
  const before = text.slice(0, lastIdx).replace(/[\s,.]+$/, "").trim();
  const repairWords = repair.split(/\s+/);
  if (repairWords.length <= 2 && before.split(/\s+/).length > 2) {
    const bw = before.split(/\s+/);
    return { text: [...bw.slice(0, bw.length - repairWords.length), ...repairWords].join(" "), applied: true };
  }
  return { text: repair, applied: true };
}

/** Collapse "can you can you" / "the the" repeated n-grams (n = 1..3). */
export function removeStutters(text: string): { text: string; count: number } {
  let words = text.split(/\s+/).filter(Boolean);
  let count = 0;
  for (let n = 3; n >= 1; n--) {
    const out: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const cur = words.slice(i, i + n).join(" ").toLowerCase();
      const prev = out.slice(-n).join(" ").toLowerCase();
      if (out.length >= n && cur === prev && i + n <= words.length) { i += n - 1; count++; continue; }
      out.push(words[i]);
    }
    words = out;
  }
  // Broken word fragments: "vol- volume", "sc screenshot"
  words = words.filter((w, i) => {
    const nx = words[i + 1]?.toLowerCase();
    const base = w.toLowerCase().replace(/-$/, "");
    if (nx && base.length >= 2 && base.length < nx.length && nx.startsWith(base)) { count++; return false; }
    return true;
  });
  return { text: words.join(" "), count };
}

export function stripFillers(text: string): { text: string; removed: string[] } {
  let out = ` ${text} `;
  const removed: string[] = [];
  for (const f of FILLERS) {
    const re = new RegExp(`(^|[\\s,])${f.includes("+") ? f : esc(f)}(?=[\\s,.!?]|$)`, "gi");
    if (re.test(out)) { removed.push(f.replace(/\+$/, "")); out = out.replace(re, " "); }
  }
  return { text: out.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim(), removed };
}

export function cleanDisfluencies(raw: string): CleanResult {
  const base = raw.replace(/[…]+/g, " ").replace(/\s+/g, " ").trim();
  const st = removeStutters(base);
  const rep = resolveSelfCorrection(st.text);
  const fil = stripFillers(rep.text);
  const st2 = removeStutters(fil.text);
  return {
    cleaned: st2.text.replace(/^[,.\s]+|[,\s]+$/g, ""),
    removedFillers: fil.removed,
    repairApplied: rep.applied,
    stuttersRemoved: st.count + st2.count,
  };
}
