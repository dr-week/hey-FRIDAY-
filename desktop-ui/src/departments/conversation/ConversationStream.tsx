/**
 * Conversation Stream — violet/teal chat panel: Raw speech -> ✨ Reframed -> 💬 FRIDAY reply.
 * Includes a type-to-talk box and 1-tap "messy speech" presets for testing reframing.
 */
import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, MessageCircle, Send, Sparkles, Trash2, Wand2 } from "lucide-react";
import { clearConversation, getTurns, subscribeConversation } from "./conversationMemory.ts";
import "./ConversationStream.css";

const MESSY_PRESETS = [
  "um hey friday can you can you like mute the audio no wait actually increase the volume",
  "check weather in mumbai sorry I mean goa",
  "friday today umbrella goa rain tell me please",
  "uh so basically my my battery how much left check",
  "what about delhi",
  "my name is dev",
  "I'm feeling tired today",
  "yes",
  "what is 48 times 16",
  "take a note push release branch at 5pm",
  "what did I just ask",
  "tell me a joke",
];

interface Props { readonly onSend: (text: string) => void }

export function ConversationStream({ onSend }: Props) {
  const [turns, setTurns] = useState(() => [...getTurns()]);
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState("");

  useEffect(() => subscribeConversation(() => setTurns([...getTurns()])), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) { onSend(draft.trim()); setDraft(""); }
  };

  return (
    <section className="convo-zone">
      <header className="convo-head" onClick={() => setOpen((o) => !o)}>
        <MessageCircle size={16} />
        <h3>Conversation & Reframing</h3>
        <span className="convo-count">{turns.length}</span>
        <button type="button" title="Clear chat" className="convo-icon-btn"
          onClick={(e) => { e.stopPropagation(); clearConversation(); }}>
          <Trash2 size={14} />
        </button>
        <ChevronDown size={16} className={open ? "rot" : ""} />
      </header>

      {open && (
        <>
          <div className="convo-feed">
            {turns.length === 0 && <p className="convo-empty">Say or type anything — even messy rambling.</p>}
            {turns.map((t) => (
              <div key={t.id} className="convo-turn">
                <div className="bubble user">
                  {t.reframeChanged && <s className="raw">{t.raw}</s>}
                  <span>{t.reframeChanged && <Sparkles size={12} />} {t.reframed}</span>
                </div>
                <div className="bubble friday">
                  <span>{t.reply}</span>
                  <em className="intent-tag">{t.intent}</em>
                </div>
              </div>
            ))}
          </div>

          <form className="convo-input" onSubmit={submit}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type like you talk…" />
            <button type="submit" title="Send"><Send size={14} /></button>
          </form>

          <div className="convo-presets">
            <Wand2 size={13} />
            {MESSY_PRESETS.map((p) => (
              <button type="button" key={p} onClick={() => onSend(p)} title={p}>
                {p.length > 26 ? `${p.slice(0, 26)}…` : p}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
