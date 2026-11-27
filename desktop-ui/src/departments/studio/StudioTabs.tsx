/**
 * Studio Tabs — splits the Studio by FUNCTION:
 *   💬 Talk       — conversation stream & reframing
 *   ⚡ Tasks      — one-tap desktop tasks + voice test bench
 *   🤖 Agents     — access point delegator & Microsoft environment decisions
 *   🧠 Brain & DB — structured department database + free AI keys & cloud storage
 *   📱 Releases   — feature showcase & APK / Browser Extension downloads
 */
import { useState, type ReactNode } from "react";
import { Bot, Database, Download, MessageCircle, Zap } from "lucide-react";
import { ConversationStream } from "../conversation/ConversationStream.tsx";
import { BrainAndCloudCard } from "../brain/BrainAndCloudCard.tsx";
import { QuickTaskGrid } from "./QuickTaskGrid.tsx";
import { AgentHubCard } from "../agents/AgentHubCard.tsx";
import { DepartmentDbCard } from "../database/DepartmentDbCard.tsx";
import { FeatureShowcaseCard } from "../showcase/FeatureShowcaseCard.tsx";
import "./StudioTabs.css";

type Tab = "talk" | "tasks" | "agents" | "brain" | "releases";

const TABS: { id: Tab; icon: typeof Bot; label: string }[] = [
  { id: "talk", icon: MessageCircle, label: "Talk" },
  { id: "tasks", icon: Zap, label: "Tasks" },
  { id: "agents", icon: Bot, label: "Agents" },
  { id: "brain", icon: Database, label: "Brain & DB" },
  { id: "releases", icon: Download, label: "Downloads" },
];

interface Props {
  readonly onSend: (text: string) => void;
  readonly labPanel: ReactNode;
}

export function StudioTabs({ onSend, labPanel }: Props) {
  const [tab, setTab] = useState<Tab>(() => (localStorage.getItem("friday_tab") as Tab) || "talk");
  const pick = (t: Tab) => { setTab(t); localStorage.setItem("friday_tab", t); };

  return (
    <div className={`studio-tabs tab-${tab}`}>
      <nav className="studio-nav">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button type="button" key={id} className={tab === id ? "on" : ""} onClick={() => pick(id)}>
            <Icon size={14} /> <span>{label}</span>
          </button>
        ))}
      </nav>
      {tab === "talk" && <ConversationStream onSend={onSend} />}
      {tab === "tasks" && (<><QuickTaskGrid onRun={onSend} />{labPanel}</>)}
      {tab === "agents" && <AgentHubCard />}
      {tab === "brain" && (
        <>
          <DepartmentDbCard />
          <BrainAndCloudCard />
        </>
      )}
      {tab === "releases" && <FeatureShowcaseCard />}
    </div>
  );
}
