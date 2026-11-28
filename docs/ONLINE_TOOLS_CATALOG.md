# Online APIs & Web Services Catalog (100% Online, Free & Keyless)

A curated catalog of public online services, live data feeds, and free web APIs that Hey FRIDAY can call directly over HTTPS to answer questions, check live data, and speak results.

---

## 1. Zero-Key Online Web APIs (Instant HTTPS Calls)

| Category | API Endpoint | What Hey FRIDAY Can Do | Example Voice Query |
|---|---|---|---|
| **Live Tech News** | `https://hn.algolia.com/api/v1/search?tags=front_page` | Fetch top 3 trending tech headlines in real time. | *"What's the top tech news today?"* |
| **Live Currency Rates** | `https://open.er-api.com/v6/latest/USD` | Real-time currency conversion (USD, INR, EUR, GBP, JPY). | *"Convert 50 dollars to rupees"* |
| **Hyper-Local Weather** | `https://wttr.in/{city}?format=%C+%t` | Plaintext instant weather with temperature and conditions. | *"How is the weather in Delhi right now?"* |
| **Global Knowledge** | `https://en.wikipedia.org/api/rest_v1/page/summary/{topic}` | 2-sentence encyclopedic summaries with zero CORS blocks. | *"Who is Alan Turing?"* |
| **Word Definitions** | `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` | Phonetic pronunciation, part of speech, and exact meanings. | *"Define serendipity"* |
| **Jokes & Humor** | `https://official-joke-api.appspot.com/random_joke` | Setup and punchline programming & general humor. | *"Tell me a joke"* |
| **Public IP & Location** | `https://ipapi.co/json/` | Detect user's current city, country, and ISP automatically. | *"Where am I located right now?"* |
| **World Time & Sun** | `https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata` | Exact atomic time across world timezones. | *"What time is it in Tokyo?"* |

---

## 2. Free Cloud AI Inference Platforms (Online)

| Platform | Endpoint / Standard | Free Tier Quota | Best Used For |
|---|---|---|---|
| **Google AI Studio (Gemini 2.5 Flash)** | `https://generativelanguage.googleapis.com` | **15 RPM / 1,500 RPD free** | Deep general reasoning, code writing, multi-turn chat. |
| **Groq Cloud (Llama 3.1 8B)** | `https://api.groq.com/openai/v1` | **30 RPM / 14,400 RPD free** | Ultra-fast streaming answers (`<200ms` total latency). |
| **OpenRouter (:free tier)** | `https://openrouter.ai/api/v1` | **200+ requests/day free** | Access to `meta-llama/llama-3.3-70b:free`, `qwen-2.5:free`. |
| **Hugging Face Serverless API** | `https://api-inference.huggingface.co` | **Generous free monthly tier** | Access to specialized open-source models (Mistral, Gemma). |
| **Cloudflare Workers AI** | `https://api.cloudflare.com/client/v4/accounts/.../ai/run` | **10,000 requests/day free** | Global low-latency edge inference on 300+ edge locations. |

---

## 3. Online Storage, Synchronization & Collaboration

| Service | Protocol | How FRIDAY Connects |
|---|---|---|
| **Google Sheets API** | REST / OAuth2 | Logs feedback, voice corrections, and training pairs live into cloud spreadsheets. |
| **Google Drive API** | Multipart REST | Uploads consolidated `training.jsonl` backup datasets to cloud folders. |
| **GitHub Gists API** | REST API (`/gists`) | Backs up user voice macros, custom aliases, and settings to an anonymous or personal Gist. |
| **Puter.js Cloud Storage** | Browser JS SDK | Free client-side cloud key-value and file storage without managing a server. |

---

## 4. Master Prompt to Implement Online Skills in Hey FRIDAY

Copy and paste this prompt to execute the integration:

```markdown
Implement the Online Web Skills department in Hey FRIDAY:
1. Create desktop-ui/src/departments/knowledge/onlineSkills.ts (strictly ≤ 100 lines).
2. Wire up 3 free zero-key online APIs:
   - HackerNews Top Stories (Live tech news briefing)
   - Open.er-api (Instant currency conversion: USD to INR, EUR, etc.)
   - Official Joke API (Setup & punchline jokes)
3. Register these skills into the department router (DEPARTMENTS in departmentRegistry.ts).
4. When a user asks "what's the tech news", "convert 100 dollars to rupees", or "tell me a joke", fetch the live online data, format into 1-2 spoken sentences, speak with natural female TTS, and store in the knowledge database.
5. Add unit tests in tests/departments.test.ts and verify all Bun tests pass.
```
