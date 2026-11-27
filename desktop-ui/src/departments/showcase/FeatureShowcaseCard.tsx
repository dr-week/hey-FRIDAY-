/**
 * Feature Showcase & Release Downloads Card (<130 lines)
 * Displays app capabilities, APK direct download, and browser extension install.
 */
import { useState } from "react";
import { Download, ExternalLink, Globe, Layers, Mic, Smartphone, Sparkles, Zap } from "lucide-react";
import "./FeatureShowcaseCard.css";

const FEATURES = [
  { icon: Mic, title: "Zero-Latency Voice", desc: "Native Win32 keybd_event & System-1 Laya neural router (<1ms)." },
  { icon: Sparkles, title: "Disfluency Reframer", desc: "Cleans rambles, removes filler words ('um', 'like'), and fixes stutters." },
  { icon: Layers, title: "Access Point Hub", desc: "Delegates tasks to other AI agents & evaluates Microsoft environment decisions." },
  { icon: Globe, title: "Online Web Knowledge", desc: "Wikipedia, Free Dictionary, and DuckDuckGo lookups with natural female TTS." },
];

export function FeatureShowcaseCard() {
  const [downloadMsg, setDownloadMsg] = useState("");
  const apkUrl = "./downloads/hey-friday-latest.apk";
  const extUrl = "./downloads/hey-friday-extension.zip";

  return (
    <section className="showcase-zone">
      <div className="showcase-header">
        <Sparkles size={16} />
        <div>
          <h3>Hey FRIDAY v2.1.0 Hub</h3>
          <p>Micro-modular voice assistant, multi-agent access point & downloads</p>
        </div>
      </div>

      <div className="features-grid">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="feature-item">
            <Icon size={16} className="feature-icon" />
            <div>
              <strong>{title}</strong>
              <small>{desc}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="download-actions-grid">
        <a href={apkUrl} download className="btn-dl btn-apk" onClick={() => setDownloadMsg("Downloading Android APK...")}>
          <Smartphone size={16} />
          <div className="dl-text">
            <span>Download Android APK</span>
            <small>v2.1.0 • Release Signed • Universal</small>
          </div>
          <Download size={14} />
        </a>

        <a href={extUrl} download className="btn-dl btn-ext" onClick={() => setDownloadMsg("Downloading Browser Extension...")}>
          <Zap size={16} />
          <div className="dl-text">
            <span>Browser Extension</span>
            <small>Chrome / Edge / Firefox • Manifest V3</small>
          </div>
          <Download size={14} />
        </a>
      </div>

      {downloadMsg && <p className="dl-feedback-msg">{downloadMsg}</p>}

      <div className="release-meta-row">
        <span>📦 Version: <strong>2.1.0</strong></span>
        <span>⚡ Architecture: <strong>Micro-Modular</strong></span>
        <a href="https://github.com/dr-week/hey-FRIDAY-/releases" target="_blank" rel="noreferrer">
          GitHub Releases <ExternalLink size={11} />
        </a>
      </div>
    </section>
  );
}
