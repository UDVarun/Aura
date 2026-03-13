"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, User, Bot, ArrowLeft, RefreshCw, MessageSquare, Shield } from "lucide-react";
import styles from "./chat.module.css";

type Message = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm Aura's AI assistant. I can help you track orders, understand our policies, or solve issues. What's on your mind today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/support/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextEncoder();
      
      setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

      let assistantContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        assistantContent += chunk;
        
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.role === "assistant") {
            return [...prev.slice(0, -1), { ...last, content: assistantContent }];
          }
          return prev;
        });
      }

      setMessages(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      });

    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I'm having trouble connecting right now. Please try again or open a support ticket." }]);
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
              <span className={styles.status}>Online • Powered by AI</span>
            </div>
          </div>
          <button className={styles.resetBtn} onClick={() => setMessages([messages[0]])}>
            <RefreshCw size={16} />
          </button>
        </header>

        <div className={styles.messages} ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`${styles.messageRow} ${styles[msg.role]}`}>
              <div className={styles.messageAvatar}>
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={styles.messageBubble}>
                {msg.content}
                {msg.isStreaming && <span className={styles.cursor}></span>}
              </div>
            </div>
          ))}
          {isTyping && messages[messages.length-1].role === 'user' && (
            <div className={`${styles.messageRow} ${styles.assistant}`}>
              <div className={styles.messageAvatar}><Bot size={16} /></div>
              <div className={styles.typingIndicator}>
                <span></span><span></span><span></span>
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
            <button className={styles.sendBtn} onClick={handleSend} disabled={isTyping || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
          <p className={styles.disclaimer}>
            <Shield size={12} /> AI responses are generated for assistance. For order disputes, always refer to your <Link href="/customer-care">Support Dashboard</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
