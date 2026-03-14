"use client";

import Link from "next/link";
import clsx from "clsx";
import { Clock, AlertCircle, CheckCircle2, MessageSquare, ChevronRight } from "lucide-react";
import styles from "./IssueCard.module.css";

type IssueCardProps = {
    issue: any;
    role: "customer" | "vendor" | "admin";
};

export function IssueCard({ issue, role }: IssueCardProps) {
    const statusColors: Record<string, string> = {
        OPEN: "badge-blue",
        VENDOR_REVIEW: "badge-yellow",
        IN_PROGRESS: "badge-purple",
        ESCALATED: "badge-red",
        RESOLVED: "badge-green",
        CLOSED: "badge-gray",
    };

    const baseUrl = {
        customer: "/account/issues",
        vendor: "/vendor/issues",
        admin: "/admin/issues",
    }[role];

    return (
        <Link href={`${baseUrl}/${issue.id}`} className={styles.card}>
            <div className={styles.header}>
                <div className={styles.meta}>
                    <span className={clsx("badge", statusColors[issue.status])}>
                        {issue.status.replace("_", " ")}
                    </span>
                    <span className={styles.priority}>
                        {issue.priority}
                    </span>
                </div>
                <span className={styles.date}>
                    {new Date(issue.created_at).toLocaleDateString()}
                </span>
            </div>

            <h3 className={styles.subject}>{issue.subject}</h3>
            
            <div className={styles.footer}>
                <div className={styles.context}>
                    {issue.order?.order_number && (
                        <span className={styles.orderRef}>
                            Order: {issue.order.order_number}
                        </span>
                    )}
                </div>
                <div className={styles.action}>
                    View Details <ChevronRight size={16} />
                </div>
            </div>
        </Link>
    );
}
