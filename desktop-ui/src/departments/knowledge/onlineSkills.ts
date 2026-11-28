/**
 * Online Web Skills Department (<95 lines)
 * Live zero-key HTTPS lookups: Tech News (HackerNews), Currency (Open.er-api), Jokes (Official Joke API).
 */
export interface OnlineSkillResult {
  readonly reply: string;
  readonly intent: string;
  readonly source: string;
}

const TIMEOUT_MS = 6000;

async function fetchJson(url: string): Promise<any> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** 1. Top Tech News via HackerNews Algolia API */
export async function fetchTechNews(): Promise<OnlineSkillResult | null> {
  try {
    const data = await fetchJson("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=3");
    const titles = data?.hits?.slice(0, 3).map((h: any) => h.title).filter(Boolean);
    if (!titles || titles.length === 0) return null;
    return {
      reply: `Here are the top tech headlines today: 1. ${titles[0]}. 2. ${titles[1]}. 3. ${titles[2]}.`,
      intent: "online_tech_news",
      source: "HackerNews",
    };
  } catch { return null; }
}

/** 2. Live Currency Converter via Open.er-api */
export async function convertCurrency(text: string): Promise<OnlineSkillResult | null> {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(dollars?|usd|rupees?|inr|euros?|eur|pounds?|gbp)\s*(?:in|to|into)\s*(rupees?|inr|dollars?|usd|euros?|eur|pounds?|gbp)/i);
  if (!match) return null;

  const amount = parseFloat(match[1]);
  const fromRaw = match[2].toLowerCase();
  const toRaw = match[3].toLowerCase();

  const codeMap: Record<string, string> = {
    dollar: "USD", dollars: "USD", usd: "USD",
    rupee: "INR", rupees: "INR", inr: "INR",
    euro: "EUR", euros: "EUR", eur: "EUR",
    pound: "GBP", pounds: "GBP", gbp: "GBP",
  };

  const fromCode = codeMap[fromRaw] || "USD";
  const toCode = codeMap[toRaw] || "INR";

  try {
    const data = await fetchJson(`https://open.er-api.com/v6/latest/${fromCode}`);
    const rate = data?.rates?.[toCode];
    if (!rate) return null;
    const converted = (amount * rate).toFixed(2);
    return {
      reply: `${amount} ${fromCode} is currently equal to ${converted} ${toCode}.`,
      intent: "online_currency_convert",
      source: "ExchangeRate-API",
    };
  } catch { return null; }
}

/** 3. Random Safe Joke via JokeAPI */
export async function fetchOnlineJoke(): Promise<OnlineSkillResult | null> {
  try {
    const data = await fetchJson("https://v2.jokeapi.dev/joke/Any?safe-mode");
    if (data?.type === "twopart" && data.setup && data.delivery) {
      return {
        reply: `${data.setup} ... ${data.delivery}`,
        intent: "online_joke",
        source: "JokeAPI",
      };
    }
    if (data?.type === "single" && data.joke) {
      return {
        reply: data.joke,
        intent: "online_joke",
        source: "JokeAPI",
      };
    }
  } catch { /* fallback to witty offline joke */ }
  return {
    reply: "Why do programmers prefer dark mode? Because light attracts bugs.",
    intent: "online_joke",
    source: "JokeFallback",
  };
}

export async function matchOnlineSkill(text: string): Promise<OnlineSkillResult | null> {
  const lower = text.toLowerCase().trim();
  if (/\b(?:tech news|technology news|top news|hacker news|tech headlines)\b/.test(lower)) {
    return await fetchTechNews();
  }
  if (/\b(?:convert|exchange rate|how much is)\b/i.test(lower) && /\b(?:dollars?|rupees?|euros?|pounds?|inr|usd|eur|gbp)\b/i.test(lower)) {
    return await convertCurrency(lower);
  }
  if (/\b(?:tell me a joke|another joke|make me laugh|funny joke)\b/.test(lower)) {
    return await fetchOnlineJoke();
  }
  return null;
}
