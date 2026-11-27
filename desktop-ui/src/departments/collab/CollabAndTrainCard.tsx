import React from "react";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Gift,
  Globe2,
  Handshake,
  Radio,
  Sparkles,
} from "lucide-react";

/**
 * Collapsible Data Collaboration, Free Cloud GPU Training & Grants Hub
 * Department: Collab & Monetization (Rose-Coral Gradient Zone <115 lines).
 */

interface CollabPartner {
  readonly icon: React.FC<{ size?: number; className?: string }>;
  readonly name: string;
  readonly badge: string;
  readonly benefit: string;
  readonly url: string;
}

const COLLAB_PARTNERS: readonly CollabPartner[] = [
  {
    icon: Sparkles,
    name: "Laya & VegaML Studio",
    badge: "10k Free/mo",
    benefit: "Upload laya_training.csv for instant 9s calibration & 10k free decisions",
    url: "https://studio.embedding.in",
  },
  {
    icon: Cpu,
    name: "Hugging Face ZeroGPU",
    badge: "Free GPU Grant",
    benefit: "Publish voice framing CSV to get free NVIDIA Blackwell ZeroGPU compute",
    url: "https://huggingface.co/datasets",
  },
  {
    icon: Radio,
    name: "OpenWakeWord Cloud",
    badge: "Free ONNX Train",
    benefit: "1-click free cloud GPU training for custom 'hey_friday.onnx' wake model",
    url: "https://openwakeword.com/train",
  },
  {
    icon: Globe2,
    name: "AI4Bharat (Svarah) & Common Voice",
    badge: "Indic Grant",
    benefit: "Contribute en-IN noisy-to-gold ASR pairs for research grants & models",
    url: "https://huggingface.co/datasets/ai4bharat/Svarah",
  },
];

interface CollabAndTrainCardProps {
  readonly logCount: number;
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
  readonly onExportCsv: () => void;
}

export const CollabAndTrainCard: React.FC<CollabAndTrainCardProps> = ({
  logCount,
  isOpen,
  onToggleOpen,
  onExportCsv,
}) => {
  const readyPct = Math.min(100, Math.round((logCount / 35) * 100));

  return (
    <section className="glass-accordion zone-rose">
      <button type="button" className="accordion-header" onClick={onToggleOpen}>
        <div className="accordion-title-group">
          <span className="zone-icon-badge rose">
            <Handshake size={16} />
          </span>
          <div className="zone-heading">
            <span className="zone-kicker">04 • ECOSYSTEM &amp; MONETIZATION</span>
            <span>Collab, Free GPU Training &amp; Data Grants</span>
          </div>
          <span className="mini-pill">{readyPct}% Fit Ready</span>
        </div>
        {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {isOpen && (
        <div className="accordion-body">
          {/* Laya .fit() 35-Row Readiness Progress Bar */}
          <div className="bounty-meter-bar">
            <div className="bounty-info">
              <Award size={15} className="icon-rose" />
              <span>
                <strong>{logCount} / 35</strong> Gold Voice Rows for Laya <code>.fit()</code> &amp; HF Dataset Grant
              </span>
            </div>
            <button
              type="button"
              className="glass-btn rose-btn"
              onClick={onExportCsv}
              disabled={logCount === 0}
            >
              <Gift size={14} />
              <span>Package Dataset</span>
            </button>
          </div>

          {/* 4 Partner Cards */}
          <div className="collab-partner-grid">
            {COLLAB_PARTNERS.map(({ icon: Icon, name, badge, benefit, url }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="collab-card"
              >
                <div className="collab-card-top">
                  <span className="collab-name">
                    <Icon size={14} className="icon-rose" />
                    {name}
                  </span>
                  <span className="collab-badge">{badge}</span>
                </div>
                <p className="collab-desc">{benefit}</p>
                <span className="collab-link">
                  <span>Open Partner Portal</span>
                  <ExternalLink size={12} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
