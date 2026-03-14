"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, RefreshCw, Send, Shield, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./chat.module.css";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

export default function AIChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Aura's AI assistant. I can help you track orders, explain policies, and escalate unresolved issues.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const bootstrapConversation = async () => {
      try {
        const response = await fetch("/api/support/chat", { method: "POST" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to start support chat.");
        }

        setConversationId(payload.conversation.id as string);
      } catch (error) {
        console.error("Conversation bootstrap failed:", error);
      }
    };

    bootstrapConversation();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`support:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_role: "customer" | "ai" | "agent";
            content: string;
          };

          if (row.sender_role !== "agent") {
            return;
          }

          setMessages((prev) => {
            if (prev.some((message) => message.id === row.id)) {
              return prev;
            }

            return [...prev, { id: row.id, role: "assistant", content: row.content }];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !conversationId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/support/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId }),
      });

      if (!response.ok) {
        throw new Error("Support assistant request failed.");
      }

      if (!response.body) {
        throw new Error("No response body.");
      }

      const reader = response.body.getReader();
      setMessages((prev) => [
        ...prev,
        { id: `stream-${Date.now()}`, role: "assistant", content: "", isStreaming: true },
      ]);

      let assistantContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantContent += chunk;

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role !== "assistant") {
            return prev;
          }

          return [...prev.slice(0, -1), { ...last, content: assistantContent }];
        });
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      });
    } catch (error) {
      console.error("Chat failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Aura support could not complete that request right now. Please retry or open a case from Customer Care.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.chatContainer}>
        <header className={styles.header}>
          <Link href="/support" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>
              <Bot size={20} />
            </div>
            <div>
              <h3>Aura Assistant</h3>
              <span className={styles.status}>Online - Hybrid AI support</span>
            </div>
          </div>
          <button className={styles.resetBtn} onClick={() => setMessages([messages[0]])}>
            <RefreshCw size={16} />
          </button>
        </header>

        <div className={styles.messages} ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={msg.id ?? i} className={`${styles.messageRow} ${styles[msg.role]}`}>
              <div className={styles.messageAvatar}>
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={styles.messageBubble}>
                {msg.content}
                {msg.isStreaming && <span className={styles.cursor}></span>}
              </div>
            </div>
          ))}

          {isTyping && messages[messages.length - 1]?.role === "user" && (
            <div className={`${styles.messageRow} ${styles.assistant}`}>
              <div className={styles.messageAvatar}>
                <Bot size={16} />
              </div>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={isTyping || !input.trim() || !conversationId}>
              <Send size={18} />
            </button>
          </div>
          <p className={styles.disclaimer}>
            <Shield size={12} /> AI assistance uses Aura knowledge base and order context before escalating to a human queue.
          </p>
        </div>
      </div>
    </main>
  );
}
