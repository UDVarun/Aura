"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, AlertCircle } from "lucide-react";
import { IssueCard } from "@/components/marketplace/IssueCard";
import styles from "./page.module.css";

export default function CustomerIssuesPage() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchIssues() {
            try {
                const res = await fetch("/api/issues");
                const data = await res.json();
                if (res.ok) {
                    setIssues(data.issues);
                } else {
                    setError(data.error);
                }
            } catch (err) {
                setError("Failed to load issues");
            } finally {
                setLoading(false);
            }
        }
        fetchIssues();
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Support Issues</h1>
                    <p className={styles.subtitle}>Track and manage your order issues</p>
                </div>
                {/* We can add a "Create Issue" button here if we want, but usually it's from order page */}
            </header>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Loading issues...</div>
                ) : error ? (
                    <div className={styles.errorState}>
                        <AlertCircle size={48} />
                        <h3>Error Loading Issues</h3>
                        <p>{error}</p>
                    </div>
                ) : issues.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🎫</div>
                        <h3>No issues found</h3>
                        <p>You haven't reported any issues yet.</p>
                        <Link href="/account/orders" className="btn btn-primary">
                            Go to Orders
                        </Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {issues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} role="customer" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
