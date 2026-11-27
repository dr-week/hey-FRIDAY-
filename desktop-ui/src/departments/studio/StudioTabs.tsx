/**
 * Studio Tabs — splits the Studio by FUNCTION:
 *   💬 Talk   — conversation stream + quick chat
 *   ⚡ Tasks  — one-tap desktop tasks + voice test bench
 *   🧠 Brain  — free AI providers, cloud training data
 */
import { useState, type ReactNode } from "react";
import { Brain, MessageCircle, Zap } from "lucide-react";
import { ConversationStream } from "../conversation/ConversationStream.tsx";
import { BrainAndCloudCard } from "../brain/BrainAndCloudCard.tsx";
import { QuickTaskGrid } from "./QuickTaskGrid.tsx";
import "./StudioTabs.css";

type Tab = "talk" | "tasks" | "brain";

const TABS: { id: Tab; icon: typeof Brain; label: string }[] = [
  { id: "talk", icon: MessageCircle, label: "Talk" },
  { id: "tasks", icon: Zap, label: "Tasks" },
  { id: "brain", icon: Brain, label: "Brain" },
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
            <Icon size={15} /> <span>{label}</span>
          </button>
        ))}
      </nav>
      {tab === "talk" && <ConversationStream onSend={onSend} />}
      {tab === "tasks" && (<><QuickTaskGrid onRun={onSend} />{labPanel}</>)}
      {tab === "brain" && <BrainAndCloudCard />}
    </div>
  );
}
