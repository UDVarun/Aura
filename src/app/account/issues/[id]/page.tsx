"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ShieldAlert, Package, Store, Clock } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { IssueThread } from "@/components/marketplace/IssueThread";
import styles from "./page.module.css";

export default function CustomerIssueDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [issue, setIssue] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function fetchIssue() {
            try {
                const res = await fetch(`/api/issues/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setIssue(data.issue);
                } else {
                    setError(data.error);
                }
            } catch (err) {
                setError("Failed to load issue details");
            } finally {
                setLoading(false);
            }
        }
        fetchIssue();
    }, [id]);

    const handleEscalate = async () => {
        if (!confirm("Are you sure you want to escalate this to an admin? Only do this if the vendor is unresponsive.")) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/issues/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ESCALATED" })
            });
            if (res.ok) router.refresh();
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading issue...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <Link href="/account/issues" className={styles.backLink}>
                <ChevronLeft size={16} /> Back to Issues
            </Link>

            <div className={styles.layout}>
                <div className={styles.main}>
                    <header className={styles.header}>
                        <div className={styles.titleArea}>
                            <h1 className={styles.title}>{issue.subject}</h1>
                            <div className={styles.meta}>
                                <span className={clsx("badge", `badge-${issue.status.toLowerCase()}`)}>
                                    {issue.status.replace("_", " ")}
                                </span>
                                <span className={styles.issueId}>#{issue.id.slice(0, 8)}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            {issue.status !== "CLOSED" && issue.status !== "RESOLVED" && (
                                <button 
                                    className={clsx("btn btn-outline-danger", styles.escalateBtn)}
                                    onClick={handleEscalate}
                                    disabled={updating || issue.status === "ESCALATED"}
                                >
                                    <ShieldAlert size={16} /> Escalate to Admin
                                </button>
                            )}
                        </div>
                    </header>

                    <div className={styles.chatArea}>
                        <IssueThread 
                            issueId={issue.id} 
                            initialMessages={issue.messages} 
                            currentUserId={issue.user_id}
                            role="customer"
                        />
                    </div>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.card}>
                        <h3>Issue Details</h3>
                        <div className={styles.detailItem}>
                            <Clock size={16} />
                            <div>
                                <label>Opened on</label>
                                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className={styles.detailItem}>
                            <Package size={16} />
                            <div>
                                <label>Order Reference</label>
                                <Link href={`/account/orders/${issue.order_id}`}>
                                    {issue.order?.order_number || "View Order"}
                                </Link>
                            </div>
                        </div>
                        <div className={styles.detailItem}>
                            <Store size={16} />
                            <div>
                                <label>Vendor</label>
                                <span>{issue.vendor?.full_name || "Nexus Seller"}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.descriptionCard}>
                        <h3>Problem Description</h3>
                        <p>{issue.description}</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
