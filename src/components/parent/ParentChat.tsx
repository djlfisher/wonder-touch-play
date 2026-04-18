import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useParentChat } from "@/hooks/useParentChat";

interface Props {
  stats?: unknown;
}

const ParentChat = ({ stats }: Props) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { conversations, activeId, messages, streaming, send, openConversation, newConversation, deleteConversation } = useParentChat();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const submit = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    await send(text, stats);
  };

  return (
    <section className="mb-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm border border-border"
        style={{ minHeight: 56 }}
      >
        <span className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky rounded-xl flex items-center justify-center">
            <MessageCircle size={20} className="text-primary-foreground" />
          </div>
          <span className="font-nunito font-semibold text-foreground">Ask about my child</span>
        </span>
        {open ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-3 p-4 bg-card rounded-2xl shadow-sm border border-border">
          {/* Header: history toggle + new */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="text-xs font-nunito font-semibold text-muted-foreground hover:text-foreground"
              style={{ minHeight: 32 }}
            >
              {showHistory ? "Hide history" : `History (${conversations.length})`}
            </button>
            <button
              onClick={() => { newConversation(); setShowHistory(false); }}
              className="text-xs font-nunito font-semibold text-primary flex items-center gap-1"
              style={{ minHeight: 32 }}
            >
              <Plus size={12} /> New chat
            </button>
          </div>

          {showHistory && (
            <div className="mb-3 max-h-40 overflow-y-auto space-y-1 border border-border rounded-xl p-2">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground font-nunito p-2">No past conversations.</p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer ${activeId === c.id ? "bg-muted" : "hover:bg-muted/50"}`}
                >
                  <button
                    onClick={() => { openConversation(c.id); setShowHistory(false); }}
                    className="flex-1 text-left text-xs font-nunito text-foreground truncate"
                    style={{ minHeight: 28 }}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => deleteConversation(c.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div ref={scrollRef} className="max-h-72 overflow-y-auto space-y-3 mb-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground font-nunito">
                Try: "What worlds is my child enjoying most?" or "How can I encourage shape learning?"
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block px-3 py-2 rounded-2xl max-w-[85%] text-sm font-nunito ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  {m.role === "assistant"
                    ? <div className="prose prose-sm max-w-none [&>*]:my-1"><ReactMarkdown>{m.content || "…"}</ReactMarkdown></div>
                    : m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ask a question…"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={streaming}
              style={{ minHeight: 44 }}
            />
            <button
              onClick={submit}
              disabled={streaming || !input.trim()}
              className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ParentChat;
