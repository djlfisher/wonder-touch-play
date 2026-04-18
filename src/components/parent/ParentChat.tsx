import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  stats?: unknown;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-parent-chat`;

const ParentChat = ({ stats }: Props) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setStreaming(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, stats }),
      });

      if (resp.status === 429) { toast({ title: "Slow down", description: "Too many requests — please wait." }); setStreaming(false); return; }
      if (resp.status === 402) { toast({ title: "AI credits needed", description: "Add credits in Settings → Workspace → Usage." }); setStreaming(false); return; }
      if (!resp.ok || !resp.body) { toast({ title: "Chat unavailable" }); setStreaming(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let assistantSoFar = "";
      let done = false;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantSoFar };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf; break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Chat error" });
    } finally {
      setStreaming(false);
    }
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
          <div ref={scrollRef} className="max-h-72 overflow-y-auto space-y-3 mb-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground font-nunito">
                Try asking: "What worlds is my child enjoying most?" or "How can I encourage shape learning?"
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
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question…"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={streaming}
              style={{ minHeight: 44 }}
            />
            <button
              onClick={send}
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
