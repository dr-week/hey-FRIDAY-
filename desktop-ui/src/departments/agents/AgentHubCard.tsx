/**
 * Agent Hub & Access Point Card
 * Allows delegating tasks to other AI agents and reviewing Microsoft environment decisions (<135 lines).
 */
import { useState, type FormEvent } from "react";
import { Bot, Check, ChevronDown, ExternalLink, Play, ShieldAlert, Sparkles, X } from "lucide-react";
import { departmentDb, type ClientAgentTask, type ClientDecisionItem } from "../database/departmentDb.ts";
import { dispatchAgentTask, loadAgentConfig, saveAgentConfig } from "./agentDelegator.ts";
import "./AgentHubCard.css";

export function AgentHubCard() {
  const [tasks, setTasks] = useState<ClientAgentTask[]>(() => departmentDb.getTasks());
  const [decisions, setDecisions] = useState<ClientDecisionItem[]>(() => departmentDb.getDecisions());
  const [config, setConfig] = useState(() => loadAgentConfig());
  const [instruction, setInstruction] = useState("");
  const [open, setOpen] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelegate = async (e: FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await dispatchAgentTask(instruction.trim());
      setTasks(departmentDb.getTasks());
      setInstruction("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveDecision = (id: string, approved: boolean) => {
    departmentDb.resolveDecision(id, approved);
    setDecisions(departmentDb.getDecisions());
  };

  return (
    <section className="agent-hub-zone">
      <header onClick={() => setOpen((o) => !o)}>
        <Bot size={16} />
        <h3>Access Point & Agent Hub</h3>
        <span className="hub-badge">{tasks.length} tasks</span>
        <button type="button" className="hub-cfg-btn" title="Endpoint config" onClick={(e) => { e.stopPropagation(); setShowConfig((s) => !s); }}>
          <ExternalLink size={13} />
        </button>
        <ChevronDown size={16} className={open ? "rot" : ""} />
      </header>

      {open && (
        <div className="hub-body">
          {showConfig && (
            <div className="hub-config-box">
              <label>Custom Agent / Webhook URL (MCP or REST):</label>
              <input
                placeholder="http://localhost:5000/agent or n8n webhook"
                value={config.endpointUrl ?? ""}
                onChange={(e) => setConfig(saveAgentConfig({ endpointUrl: e.target.value.trim() }))}
              />
            </div>
          )}

          <form className="hub-dispatch-form" onSubmit={handleDelegate}>
            <input
              placeholder="Tell other AI agents to do something (e.g. analyze codebase, scrape data)..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Sparkles size={14} className="spin" /> : <Play size={14} />}
              <span>Delegate</span>
            </button>
          </form>

          {decisions.length > 0 && (
            <div className="hub-decisions-sub">
              <h4><ShieldAlert size={13} /> Microsoft Environment Decisions</h4>
              {decisions.slice(0, 3).map((d) => (
                <div key={d.id} className={`decision-row risk-${d.risk_level}`}>
                  <div className="decision-info">
                    <strong>{d.action}</strong>
                    <small>{d.details} • <em>{d.environment}</em></small>
                  </div>
                  {d.status === "pending" ? (
                    <div className="decision-actions">
                      <button type="button" className="btn-approve" onClick={() => handleResolveDecision(d.id, true)}><Check size={12} /></button>
                      <button type="button" className="btn-reject" onClick={() => handleResolveDecision(d.id, false)}><X size={12} /></button>
                    </div>
                  ) : (
                    <span className={`status-pill ${d.status}`}>{d.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="hub-tasks-sub">
            <h4><Bot size={13} /> Delegated Agent Tasks</h4>
            {tasks.length === 0 && <p className="hub-empty">No tasks delegated yet. Type above or say "Tell agent to..."</p>}
            <div className="tasks-scroll">
              {tasks.slice(0, 6).map((t) => (
                <div key={t.id} className="task-item-card">
                  <div className="task-top">
                    <strong>{t.title}</strong>
                    <span className={`status-pill ${t.status}`}>{t.status}</span>
                  </div>
                  <small className="task-inst">{t.instruction}</small>
                  {t.result && <p className="task-res">↳ {t.result}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
