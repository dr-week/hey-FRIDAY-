/**
 * Department Database Card
 * Explorer for learned knowledge database, verification, and department metrics (<130 lines).
 */
import { useState, useMemo } from "react";
import { CheckCircle2, ChevronDown, Database, Search, Sparkles } from "lucide-react";
import { departmentDb, type ClientKnowledgeItem } from "./departmentDb.ts";
import "./DepartmentDbCard.css";

export function DepartmentDbCard() {
  const [knowledge, setKnowledge] = useState<ClientKnowledgeItem[]>(() => departmentDb.getKnowledge());
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return knowledge;
    const q = search.toLowerCase();
    return knowledge.filter((k) => k.query_pattern.toLowerCase().includes(q) || k.answer.toLowerCase().includes(q));
  }, [knowledge, search]);

  const handleToggleVerify = (id: string) => {
    departmentDb.toggleVerifyKnowledge(id);
    setKnowledge(departmentDb.getKnowledge());
  };

  const tasks = departmentDb.getTasks();
  const decisions = departmentDb.getDecisions();

  return (
    <section className="dept-db-zone">
      <header onClick={() => setOpen((o) => !o)}>
        <Database size={16} />
        <h3>Department Database Framework</h3>
        <span className="db-badge">{knowledge.length} items</span>
        <ChevronDown size={16} className={open ? "rot" : ""} />
      </header>

      {open && (
        <div className="dept-db-body">
          <div className="db-stats-row">
            <div className="stat-box"><strong>{knowledge.length}</strong><small>Learned Q&A</small></div>
            <div className="stat-box"><strong>{tasks.length}</strong><small>Agent Tasks</small></div>
            <div className="stat-box"><strong>{decisions.length}</strong><small>Decisions</small></div>
          </div>

          <div className="db-search-bar">
            <Search size={13} />
            <input
              placeholder="Search learned questions & answers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="db-knowledge-list">
            {filtered.length === 0 && (
              <p className="db-empty">
                {search ? "No matching learned items." : "No learned answers yet. Ask complex questions to train!"}
              </p>
            )}
            {filtered.slice(0, 10).map((k) => (
              <div key={k.id} className={`knowledge-row ${k.verified ? "verified" : ""}`}>
                <div className="k-left">
                  <div className="k-query">
                    <Sparkles size={11} />
                    <strong>{k.query_pattern}</strong>
                    <span className="source-tag">{k.source}</span>
                  </div>
                  <p className="k-answer">{k.answer}</p>
                </div>
                <div className="k-right">
                  <span className="k-hits">{k.hit_count} hits</span>
                  <button
                    type="button"
                    className={`verify-btn ${k.verified ? "is-verified" : ""}`}
                    title={k.verified ? "Mark unverified" : "Verify answer"}
                    onClick={() => handleToggleVerify(k.id)}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
