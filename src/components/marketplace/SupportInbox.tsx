"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import styles from "./SupportInbox.module.css";

type Role = "customer" | "vendor" | "admin";

type SupportCase = {
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

type SupportMessage = {
    id: string;
    sender_role: Role;
    body: string;
    is_internal: boolean;
    created_at: string;
};

type OrderOption = {
    id: string;
    label: string;
};

const STATUS_OPTIONS: Record<Role, string[]> = {
    customer: ["open", "escalated", "closed"],
    vendor: ["waiting_for_customer", "resolved"],
    admin: ["open", "escalated", "resolved", "closed"],
};

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function SupportInbox({
    role,
    title,
    subtitle,
    allowCreate = false,
    orderOptions = [],
}: {
    role: Role;
    title: string;
    subtitle: string;
    allowCreate?: boolean;
    orderOptions?: OrderOption[];
}) {
    const [cases, setCases] = useState<SupportCase[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [messageBody, setMessageBody] = useState("");
    const [status, setStatus] = useState("");
    const [feedback, setFeedback] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        category: "order_issue",
        subject: "",
        description: "",
        orderId: "",
        priority: "normal",
    });

    const selectedCase = useMemo(
        () => cases.find((item) => item.id === selectedCaseId) ?? null,
        [cases, selectedCaseId]
    );

    useEffect(() => {
        let active = true;

        async function bootstrap() {
            const response = await fetch("/api/support-cases");
            const payload = await response.json();
            if (!active) return;

            if (!response.ok) {
                setFeedback(payload.error || "Unable to load support cases.");
                setLoading(false);
                return;
            }

            const nextCases = payload.cases ?? [];
            setCases(nextCases);
            setSelectedCaseId((prev) => prev ?? nextCases[0]?.id ?? null);
            setLoading(false);
        }

        void bootstrap();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedCaseId) {
            return;
        }

        let active = true;
        async function bootstrapMessages() {
            const response = await fetch(`/api/support-cases/${selectedCaseId}/messages`);
            const payload = await response.json();
            if (!active) return;

            if (!response.ok) {
                setFeedback(payload.error || "Unable to load case messages.");
                return;
            }

            setMessages(payload.messages ?? []);
        }

        void bootstrapMessages();
        return () => {
            active = false;
        };
    }, [selectedCaseId]);

    const submitMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCaseId || !messageBody.trim()) return;

        setSubmitting(true);
        setFeedback("");

        const response = await fetch(`/api/support-cases/${selectedCaseId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: messageBody }),
        });
        const payload = await response.json();

        if (!response.ok) {
            setFeedback(payload.error || "Unable to send message.");
            setSubmitting(false);
            return;
        }

        setMessages((prev) => [...prev, payload.message]);
        setMessageBody("");
        setCases((prev) =>
            prev.map((item) =>
                item.id === selectedCaseId
                    ? { ...item, last_message_at: new Date().toISOString() }
                    : item
            )
        );
        setSubmitting(false);
    };

    const updateStatus = async () => {
        if (!selectedCaseId || !status) return;

        setSubmitting(true);
        setFeedback("");
        const response = await fetch(`/api/support-cases/${selectedCaseId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        const payload = await response.json();

        if (!response.ok) {
            setFeedback(payload.error || "Unable to update case status.");
            setSubmitting(false);
            return;
        }

        setStatus(payload.supportCase.status);
        setCases((prev) => prev.map((item) => (item.id === selectedCaseId ? payload.supportCase : item)));
        setSubmitting(false);
    };

    const createCase = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback("");

        const response = await fetch("/api/support-cases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                category: form.category,
                subject: form.subject,
                description: form.description,
                orderId: form.orderId || null,
                priority: form.priority,
            }),
        });
        const payload = await response.json();

        if (!response.ok) {
            setFeedback(payload.error || "Unable to create support case.");
            setSubmitting(false);
            return;
        }

        setForm({
            category: "order_issue",
            subject: "",
            description: "",
            orderId: "",
            priority: "normal",
        });
        setCases((prev) => [payload.supportCase, ...prev]);
        setSelectedCaseId(payload.supportCase.id);
        setMessages([]);
        setSubmitting(false);
    };

    return (
        <section className={styles.shell}>
            <aside className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div className={styles.panelTitle}>{title}</div>
                    <p className={styles.panelSubtitle}>{subtitle}</p>
                </div>
                {loading ? (
                    <div className={styles.emptyState}>Loading support workflow...</div>
                ) : cases.length === 0 ? (
                    <div className={styles.emptyState}>No cases yet.</div>
                ) : (
                    <div className={styles.caseList}>
                        {cases.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={clsx(styles.caseCard, { [styles.caseCardActive]: item.id === selectedCaseId })}
                                onClick={() => {
                                    setSelectedCaseId(item.id);
                                    setStatus("");
                                }}
                            >
                                <div className={styles.caseMeta}>
                                    <span className={styles.caseNumber}>{item.case_number}</span>
                                    <span className={`badge badge-blue`}>{item.status}</span>
                                </div>
                                <div className={styles.caseSubject}>{item.subject}</div>
                                <p className={styles.casePreview}>{item.category.replaceAll("_", " ")}</p>
                                <div className={styles.badgeRow}>
                                    <span className={`badge badge-yellow`}>{item.priority}</span>
                                    <span className={styles.caseNumber}>{formatDateTime(item.last_message_at)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {allowCreate && (
                    <form className={styles.form} onSubmit={createCase}>
                        <div className={styles.formTitle}>Open a new case</div>
                        <div className={styles.formGrid}>
                            <select
                                className="input"
                                value={form.category}
                                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="order_issue">Order issue</option>
                                <option value="refund_request">Refund request</option>
                                <option value="seller_report">Report seller</option>
                                <option value="product_issue">Product issue</option>
                            </select>
                            <select
                                className="input"
                                value={form.priority}
                                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                            >
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        {orderOptions.length > 0 && (
                            <select
                                className="input"
                                value={form.orderId}
                                onChange={(e) => setForm((prev) => ({ ...prev, orderId: e.target.value }))}
                            >
                                <option value="">Link an order (optional)</option>
                                {orderOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        <input
                            className="input"
                            value={form.subject}
                            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                            placeholder="Brief subject"
                            required
                        />
                        <textarea
                            className="input"
                            rows={5}
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe the issue, what happened, and what resolution you need."
                            required
                        />
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Submitting..." : "Create Case"}
                        </button>
                    </form>
                )}
            </aside>

            <div className={clsx(styles.panel, styles.threadPanel)}>
                {!selectedCase ? (
                    <div className={styles.emptyState}>Select a case to view the full conversation.</div>
                ) : (
                    <div className={styles.threadLayout}>
                        <div className={styles.threadHeader}>
                            <div className={styles.threadTitle}>{selectedCase.subject}</div>
                            <div className={styles.threadMeta}>
                                {selectedCase.case_number} • {selectedCase.category.replaceAll("_", " ")} • Opened {formatDateTime(selectedCase.created_at)}
                            </div>
                        </div>

                        <div className={styles.threadActions}>
                            <select
                                className={clsx("input", styles.statusSelect)}
                                value={status || selectedCase.status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                {STATUS_OPTIONS[role].map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="btn btn-secondary" onClick={updateStatus} disabled={submitting}>
                                Update Status
                            </button>
                            {selectedCase.resolution && (
                                <span className={styles.feedback}>Resolution: {selectedCase.resolution}</span>
                            )}
                        </div>

                        <div className={styles.messages}>
                            {messages.length === 0 ? (
                                <div className={styles.emptyState}>No messages yet.</div>
                            ) : (
                                messages.map((message) => (
                                    <article
                                        key={message.id}
                                        className={clsx(
                                            styles.message,
                                            message.sender_role === "customer" && styles.messageCustomer,
                                            message.sender_role === "vendor" && styles.messageVendor,
                                            message.sender_role === "admin" && styles.messageAdmin
                                        )}
                                    >
                                        <div className={styles.messageRole}>{message.sender_role}</div>
                                        <div className={styles.messageBody}>{message.body}</div>
                                        <div className={styles.messageTime}>{formatDateTime(message.created_at)}</div>
                                    </article>
                                ))
                            )}
                        </div>

                        <form className={styles.composer} onSubmit={submitMessage}>
                            <textarea
                                className="input"
                                rows={4}
                                value={messageBody}
                                onChange={(e) => setMessageBody(e.target.value)}
                                placeholder="Write the next update, decision, or request."
                                required
                            />
                            <div className={styles.composerRow}>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? "Sending..." : "Send Message"}
                                </button>
                                {feedback && <span className={styles.feedback}>{feedback}</span>}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );
}
