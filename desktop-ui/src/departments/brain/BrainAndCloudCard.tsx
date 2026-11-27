/**
 * Brain & Cloud Card — amber/indigo glass panel: free AI keys, provider tests, Drive sync.
 */
import { useState } from "react";
import { Brain, ChevronDown, CloudUpload, Download, ExternalLink, KeyRound, Zap } from "lucide-react";
import { loadBrainSettings, PROVIDER_INFO, saveBrainSettings, type BrainProvider } from "./brainSettings.ts";
import { testProvider } from "./thinkingBrain.ts";
import { downloadTrainingJsonl, uploadTrainingToDrive } from "../storage/cloudTrainingStorage.ts";
import "./BrainCard.css";

const KEY_FIELDS: { p: BrainProvider; key: "geminiKey" | "groqKey" | "openrouterKey"; model: "geminiModel" | "groqModel" | "openrouterModel" }[] = [
  { p: "gemini", key: "geminiKey", model: "geminiModel" },
  { p: "groq", key: "groqKey", model: "groqModel" },
  { p: "openrouter", key: "openrouterKey", model: "openrouterModel" },
];

export function BrainAndCloudCard() {
  const [s, setS] = useState(loadBrainSettings);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Record<string, string>>({});
  const set = (patch: Parameters<typeof saveBrainSettings>[0]) => setS(saveBrainSettings(patch));
  const test = async (p: BrainProvider) => {
    setStatus((x) => ({ ...x, [p]: "…" }));
    const r = await testProvider(p);
    setStatus((x) => ({ ...x, [p]: r }));
  };
  const drive = async () => {
    setStatus((x) => ({ ...x, drive: "Uploading…" }));
    try { setStatus((x) => ({ ...x, drive: "" })); window.open(await uploadTrainingToDrive(), "_blank"); }
    catch (e) { setStatus((x) => ({ ...x, drive: `❌ ${(e as Error).message}` })); }
  };

  return (
    <section className="brain-zone">
      <header onClick={() => setOpen((o) => !o)}>
        <Brain size={16} />
        <h3>Thinking AI & Cloud Data</h3>
        <label className="brain-switch" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={s.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          <Zap size={12} />
        </label>
        <ChevronDown size={16} className={open ? "rot" : ""} />
      </header>

      {open && (
        <div className="brain-body">
          <p className="brain-hint"><KeyRound size={12} /> Keys stay in this browser only.</p>
          <div className="brain-row">
            <span>{PROVIDER_INFO.chrome_builtin.label}</span>
            <button type="button" onClick={() => test("chrome_builtin")}>Test</button>
            <small>{status.chrome_builtin}</small>
          </div>
          {KEY_FIELDS.map(({ p, key, model }) => (
            <div className="brain-row" key={p}>
              <a href={PROVIDER_INFO[p].keyUrl} target="_blank" rel="noreferrer">
                {PROVIDER_INFO[p].label} <ExternalLink size={11} />
              </a>
              <input type="password" placeholder="API key" value={s[key]} onChange={(e) => set({ [key]: e.target.value.trim() })} />
              <input placeholder="model" value={s[model]} onChange={(e) => set({ [model]: e.target.value.trim() })} />
              <button type="button" onClick={() => test(p)}>Test</button>
              <small>{status[p]}</small>
            </div>
          ))}

          <h4><CloudUpload size={13} /> Training data</h4>
          <div className="brain-row">
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
              Google OAuth Client ID <ExternalLink size={11} />
            </a>
            <input placeholder="xxxx.apps.googleusercontent.com" value={s.driveClientId}
              onChange={(e) => set({ driveClientId: e.target.value.trim() })} />
          </div>
          <div className="brain-actions">
            <button type="button" onClick={drive}><CloudUpload size={13} /> Save to Drive</button>
            <button type="button" onClick={downloadTrainingJsonl}><Download size={13} /> JSONL</button>
            <small>{status.drive}</small>
          </div>
        </div>
      )}
    </section>
  );
}
