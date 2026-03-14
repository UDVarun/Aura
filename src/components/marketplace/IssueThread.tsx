"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Send, User, Store, Shield } from "lucide-react";
import styles from "./IssueThread.module.css";

type Message = {
    id: string;
    sender_id: string;
    sender_role: "user" | "vendor" | "admin";
    message: string;
    created_at: string;
    sender?: {
        full_name: string;
        avatar_url: string | null;
    };
};

type IssueThreadProps = {
    issueId: string;
    initialMessages: Message[];
    currentUserId: string;
    role: "customer" | "vendor" | "admin";
};

export function IssueThread({ issueId, initialMessages, currentUserId, role }: IssueThreadProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch("/api/issues/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ issue_id: issueId, message: input })
            });
            const data = await res.json();
            if (res.ok) {
                setMessages([...messages, data.message]);
                setInput("");
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.thread}>
            <div className={styles.messageList} ref={scrollRef}>
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={clsx(
                            styles.messageGroup,
                            msg.sender_id === currentUserId ? styles.own : styles.other,
                            styles[msg.sender_role]
                        )}
                    >
                        <div className={styles.messageBubble}>
                            <div className={styles.messageMeta}>
                                <div className={styles.senderIcon}>
                                    {msg.sender_role === "user" ? <User size={12} /> : 
                                     msg.sender_role === "vendor" ? <Store size={12} /> : 
                                     <Shield size={12} />}
                                </div>
                                <strong>{msg.sender?.full_name || msg.sender_role.toUpperCase()}</strong>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={styles.messageBody}>{msg.message}</div>
                        </div>
                    </div>
                ))}
            </div>

            <form className={styles.composer} onSubmit={handleSend}>
                <textarea 
                    className={styles.input}
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                    rows={1}
                />
                <button 
                    type="submit" 
                    className={styles.sendBtn}
                    disabled={!input.trim() || sending}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
