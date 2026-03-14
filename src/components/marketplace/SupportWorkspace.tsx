"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { 
    Send, 
    Clock, 
    ChevronLeft, 
    MoreVertical, 
    Info, 
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    User,
    ShieldCheck,
    Store,
    FileText,
    Image as ImageIcon,
    Paperclip,
    ExternalLink
} from "lucide-react";

import { ActivityTimeline } from "./ActivityTimeline";
import { createClient } from "@/lib/supabase/client";
import { CSATFeedback } from "./CSATFeedback";
import { useNotifications } from "@/context/NotificationContext";
import styles from "./SupportWorkspace.module.css";





type Role = "customer" | "vendor" | "admin";

export type SupportCase = {
    id: string;
    case_number: string;
    category: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    last_message_at: string;
    order_id?: string | null;
    vendor_id?: string | null;
    resolution?: string | null;
};

export type SupportMessage = {
    id: string;
    sender_role: Role;
    body: string;
    attachments: any[];
    is_internal: boolean;
    created_at: string;
};

type SupportWorkspaceProps = {
    role: Role;
    title: string;
    subtitle: string;
    initialCases?: SupportCase[];
};

export function SupportWorkspace({
    role,
    title,
    subtitle,
    initialCases = []
}: SupportWorkspaceProps) {
    const [cases, setCases] = useState<SupportCase[]>(initialCases);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(initialCases.length === 0);
    const [messageBody, setMessageBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [activePanel, setActivePanel] = useState<"list" | "thread" | "details">("list");
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    
    const supabase = useMemo(() => createClient(), []);
    const { refreshNotifications } = useNotifications();



    // Filtering states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const matchesSearch = c.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 c.case_number.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || c.status === statusFilter;
            const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [cases, searchQuery, statusFilter, priorityFilter]);

    const selectedCase = useMemo(
        () => cases.find(c => c.id === selectedCaseId) || null,
        [cases, selectedCaseId]
    );


    useEffect(() => {
        if (initialCases.length > 0) return;

        async function fetchCases() {
            try {
                const res = await fetch("/api/support-cases");
                const data = await res.json();
                if (res.ok) {
                    setCases(data.cases || []);
                    if (data.cases?.length > 0) {
                        setSelectedCaseId(data.cases[0].id);
                        setActivePanel("thread");
                    }
                }
            } finally {
                setLoading(false);
            }
        }
        fetchCases();
    }, [initialCases.length]);

    useEffect(() => {
        if (!selectedCaseId) return;

        async function fetchMessages() {
            const res = await fetch(`/api/support-cases/${selectedCaseId}/messages`);
            const data = await res.json();
            if (res.ok) {
                setMessages(data.messages || []);
            }
        }
        fetchMessages();

        // Realtime subscription
        const channel = supabase.channel(`case:${selectedCaseId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "support_case_messages",
                    filter: `case_id=eq.${selectedCaseId}`
                },
                (payload) => {
                    const newMessage = payload.new as SupportMessage;
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            )
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                supabase.auth.getUser().then(({ data }) => {
                    const typing: Record<string, boolean> = {};
                    const userId = data.user?.id;
                    Object.values(state).forEach((presences: any) => {
                        presences.forEach((p: any) => {
                            if (p.isTyping && p.userId !== userId) {
                                typing[p.role] = true;
                            }
                        });
                    });
                    setTypingUsers(typing);
                });
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    // console.log("Subscribed to realtime messages");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedCaseId, supabase]);

    const handleTyping = (isTyping: boolean) => {
        if (!selectedCaseId) return;
        supabase.channel(`case:${selectedCaseId}`).track({
            isTyping,
            role,
            userId: "temp" // In a real app, use auth user ID
        });
    };


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageBody.trim() || !selectedCaseId || submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/support-cases/${selectedCaseId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: messageBody })
            });
            const data = await res.json();
            if (res.ok) {
                // Safeguard against duplicate addition if realtime event already fired
                setMessages(prev => {
                    if (prev.find(m => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
                setMessageBody("");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedCaseId || submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/issues/${selectedCaseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setCases(prev => prev.map(c => c.id === selectedCaseId ? { ...c, status: newStatus } : c));
                // Add a local history item or just let realtime handle it if implemented
                // For now, manual update is safer for UI feedback
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case "OPEN": return "badge-blue";
            case "VENDOR_REVIEW": return "badge-yellow";
            case "IN_PROGRESS": return "badge-purple";
            case "ESCALATED": return "badge-red";
            case "RESOLVED": return "badge-green";
            case "CLOSED": return "badge-gray";
            default: return "badge-blue";
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className={styles.workspace}>
            {/* 1. Case List Panel */}
            <aside className={clsx(styles.panel, activePanel === "list" && styles.active)}>
                <header className={styles.panelHeader}>
                    <div className={styles.panelTitle}>Support Queue</div>
                    <div className={styles.filterSection}>
                        <input 
                            className={clsx("input", styles.searchInput)}
                            placeholder="Search case # or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className={styles.filterRow}>
                            <select 
                                className={styles.filterSelect}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="waiting_for_vendor">Waiting for Vendor</option>
                                <option value="under_review">Under Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            <select 
                                className={styles.filterSelect}
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="all">All Priority</option>
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                </header>
                <div className={styles.scrollArea}>
                    <div className={styles.caseList}>
                        {loading ? (
                            <div className="flex-center" style={{ padding: "2rem" }}>
                                <div className="animate-spin">⏳</div>
                            </div>
                        ) : filteredCases.length === 0 ? (
                            <div className={styles.emptyState}>No activity found.</div>
                        ) : (
                            filteredCases.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedCaseId(c.id);
                                        setActivePanel("thread");
                                    }}
                                    className={clsx(styles.caseCard, selectedCaseId === c.id && styles.caseCardActive)}
                                >
                                    <div className={styles.caseMeta}>
                                        <span className={styles.caseNumber}>{c.case_number}</span>
                                        <span className={clsx("badge", getStatusColor(c.status))}>{c.status.replace(/_/g, " ")}</span>
                                    </div>
                                    <div className={styles.caseSubject}>{c.subject}</div>
                                    <div className={styles.caseFooter}>
                                        <span>{c.category.replace(/_/g, " ")}</span>
                                        <span>{formatDate(c.last_message_at)}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    {Object.keys(typingUsers).length > 0 && (
                        <div className={styles.typingIndicator}>
                            {Object.keys(typingUsers).map(r => r.toUpperCase()).join(", ")} is typing
                        </div>
                    )}
                </div>
            </aside>

            {/* 2. Conversation Workspace */}
            <main className={clsx(styles.conversation, activePanel === "thread" && styles.active)}>
                <header className={styles.panelHeader}>
                    <div className="flex-between">
                        <div className="flex-center" style={{ gap: "0.75rem" }}>
                            <button 
                                className="btn btn-secondary btn-icon md-only" 
                                onClick={() => setActivePanel("list")}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className={styles.panelTitle}>
                                {selectedCase ? selectedCase.subject : "Support Case"}
                            </div>
                        </div>
                        <button 
                            className="btn btn-secondary btn-icon md-only"
                            onClick={() => setShowMobileDetails(!showMobileDetails)}
                        >
                            <Info size={20} />
                        </button>
                    </div>
                </header>

                <div className={styles.messagesList}>
                    {!selectedCase ? (
                        <div className="flex-center" style={{ height: "100%", color: "var(--muted)" }}>
                            Select a case to view conversation
                        </div>
                    ) : (
                        <>
                            {messages.map(m => (
                                <div 
                                    key={m.id} 
                                    className={clsx(
                                        styles.messageGroup, 
                                        m.sender_role === "customer" ? styles.msgCustomer : 
                                        m.sender_role === "vendor" ? styles.msgVendor : styles.msgAdmin
                                    )}
                                >
                                    <div className={styles.messageMeta}>
                                        <strong>{m.sender_role.toUpperCase()}</strong>
                                        <span>•</span>
                                        <span>{formatDate(m.created_at)}</span>
                                    </div>
                                    <div className={styles.messageBubble}>
                                        <div className={styles.messageBody}>
                                            {m.body}
                                            {m.attachments && m.attachments.length > 0 && (
                                                <div className={styles.attachmentsGrid}>
                                                    {m.attachments.map((att: any, idx: number) => (
                                                        <a 
                                                            key={idx} 
                                                            href={att.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className={styles.attachmentBadge}
                                                        >
                                                            {att.type?.startsWith("image/") ? <ImageIcon size={14} /> : <FileText size={14} />}
                                                            <span>{att.name}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {selectedCase && selectedCase.status === "resolved" && role === "customer" && (
                                <CSATFeedback 
                                    caseId={selectedCase.id} 
                                    onComplete={() => refreshNotifications()} 
                                />
                            )}
                        </>
                    )}
                </div>

                {selectedCase && selectedCase.status !== "closed" && (
                    <div className={styles.composer}>
                        <form onSubmit={handleSendMessage} className={styles.composerRow}>
                            <button type="button" className="btn btn-secondary btn-icon">
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                className={clsx("input", styles.composerInput)}
                                value={messageBody}
                                onChange={(e) => {
                                    setMessageBody(e.target.value);
                                    handleTyping(e.target.value.length > 0);
                                }}
                                onBlur={() => handleTyping(false)}
                                placeholder="Type your response..."
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={submitting || !messageBody.trim()}
                            >
                                <Send size={18} />
                                <span className="lg-only">Send</span>
                            </button>
                        </form>
                    </div>
                )}
            </main>

            {/* 3. Case Info Panel */}
            <aside className={clsx(styles.panel, styles.details, (showMobileDetails || activePanel === "details") && styles.active)}>
                <header className={styles.panelHeader}>
                    <div className={styles.panelTitle}>Case Overview</div>
                </header>
                <div className={styles.scrollArea}>
                    {selectedCase ? (
                        <div className={styles.detailList}>
                            <div className={styles.detailSection}>
                                <div className={styles.detailLabel}>Status</div>
                                <div className={clsx("badge", getStatusColor(selectedCase.status))}>
                                    {selectedCase.status.replace(/_/g, " ")}
                                </div>
                            </div>
                            <div className={styles.detailSection}>
                                <div className={styles.detailLabel}>Priority</div>
                                <div className={styles.detailValue}>{selectedCase.priority.toUpperCase()}</div>
                            </div>
                            <div className={styles.detailSection}>
                                <div className={styles.detailLabel}>Case ID</div>
                                <div className={styles.detailValue}>{selectedCase.case_number}</div>
                            </div>
                            <div className={styles.detailSection}>
                                <div className={styles.detailLabel}>Order Reference</div>
                                <div className={styles.detailValue}>
                                    {selectedCase.order_id ? (
                                        <a 
                                           href={
                                               role === "customer" ? `/account/orders/${selectedCase.order_id}` :
                                               role === "vendor" ? `/vendor/orders?search=${selectedCase.order_id}` :
                                               `/admin/orders?search=${selectedCase.order_id}`
                                           } 
                                           className="flex-center" 
                                           style={{ gap: "0.25rem", color: "var(--primary)" }}
                                        >
                                            View Order <ExternalLink size={14} />
                                        </a>
                                    ) : (
                                        "No order linked"
                                    )}
                                </div>
                            </div>

                            {role !== "customer" && selectedCase.status !== "CLOSED" && (
                               <div className={styles.actionPanel}>
                                   <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "1rem 0" }} />
                                   <div className={styles.detailLabel} style={{ marginBottom: "0.75rem" }}>Actions</div>
                                   <div className="flex-center" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                                       {selectedCase.status !== "RESOLVED" && (
                                           <button 
                                               className="btn btn-primary btn-sm"
                                               onClick={() => handleUpdateStatus("RESOLVED")}
                                               disabled={submitting}
                                           >
                                               <CheckCircle2 size={14} /> Mark Resolved
                                           </button>
                                       )}
                                       <button 
                                           className="btn btn-secondary btn-sm"
                                           onClick={() => handleUpdateStatus("CLOSED")}
                                           disabled={submitting}
                                           style={{ color: "var(--danger)" }}
                                       >
                                           <AlertCircle size={14} /> Close Case
                                       </button>
                                   </div>
                               </div>
                            )}
                            
                            <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "1rem 0" }} />
                            
                            <section className={styles.infoSection}>
                            <h3 className={styles.sectionTitle}>Activity History</h3>
                            <ActivityTimeline caseId={selectedCase.id} />
                        </section>

                        <section className={styles.infoSection}>
                            <h3 className={styles.sectionTitle}>Evidence & Files</h3>
                            <div className={styles.evidenceList}>
                                {messages.filter(m => m.attachments && m.attachments.length > 0)
                                    .flatMap(m => m.attachments)
                                    .map((att: any, idx: number) => (
                                        <a 
                                            key={idx} 
                                            href={att.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={styles.evidenceItem}
                                        >
                                            <FileText size={16} />
                                            <div className={styles.evidenceInfo}>
                                                <div className={styles.evidenceName}>{att.name}</div>
                                                <div className={styles.evidenceMeta}>{att.type}</div>
                                            </div>
                                        </a>
                                    ))
                                }
                                {messages.every(m => !m.attachments || m.attachments.length === 0) && (
                                    <div className={styles.emptyText}>No evidence uploaded yet.</div>
                                )}
                            </div>
                        </section>

                        </div>
                    ) : (
                        <div style={{ color: "var(--muted)" }}>No case selected</div>
                    )}
                </div>
            </aside>
        </div>
    );
}
