import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAppSessionId } from "@/lib/session";
import { toast } from "@/hooks/use-toast";

export type Msg = { role: "user" | "assistant"; content: string };
export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-parent-chat`;

export const useParentChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const sid = await getAppSessionId();
    if (!sid) { setLoading(false); return; }
    const { data } = await supabase
      .from("parent_conversations")
      .select("id,title,updated_at")
      .eq("session_id", sid)
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    const { data } = await supabase
      .from("parent_messages")
      .select("role,content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []).map((m) => ({ role: m.role as Msg["role"], content: m.content })));
  }, []);

  const newConversation = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  const send = useCallback(async (text: string, stats?: unknown) => {
    if (!text.trim() || streaming) return;
    const sid = await getAppSessionId();
    if (!sid) { toast({ title: "Not signed in" }); return; }

    let convId = activeId;
    if (!convId) {
      const title = text.trim().slice(0, 50);
      const { data, error } = await supabase
        .from("parent_conversations")
        .insert({ session_id: sid, title })
        .select("id,title,updated_at")
        .single();
      if (error || !data) { toast({ title: "Couldn't start conversation" }); return; }
      convId = data.id;
      setActiveId(convId);
      setConversations((prev) => [data, ...prev]);
    }

    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setStreaming(true);

    // Persist user message
    await supabase.from("parent_messages").insert({ conversation_id: convId, role: "user", content: text });

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
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (assistantSoFar) {
        await supabase.from("parent_messages").insert({ conversation_id: convId, role: "assistant", content: assistantSoFar });
        await supabase.from("parent_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
        setConversations((prev) => {
          const found = prev.find((c) => c.id === convId);
          if (!found) return prev;
          const others = prev.filter((c) => c.id !== convId);
          return [{ ...found, updated_at: new Date().toISOString() }, ...others];
        });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Chat error" });
    } finally {
      setStreaming(false);
    }
  }, [activeId, messages, streaming]);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("parent_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  }, [activeId]);

  return { conversations, activeId, messages, streaming, loading, send, openConversation, newConversation, deleteConversation };
};
