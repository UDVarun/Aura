"use client";

import { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";

const STATS = [
    { label: "Total Revenue", value: "₹48,252", change: "+12.5%", up: true, icon: TrendingUp, color: "blue" },
    { label: "Total Orders", value: "1,284", change: "+8.2%", up: true, icon: ShoppingBag, color: "green" },
    { label: "Total Users", value: "3,842", change: "+4.1%", up: true, icon: Users, color: "purple" },
    { label: "Products", value: "248", change: "-2.3%", up: false, icon: Package, color: "orange" },
];

const RECENT_ORDERS = [
    { id: "#ORD-1921", customer: "Alex Johnson", product: "Sony WH-1000XM5", amount: "₹29,999", status: "delivered" },
    { id: "#ORD-1920", customer: "Maria Garcia", product: "Mechanical Keyboard", amount: "₹12,999", status: "processing" },
    { id: "#ORD-1919", customer: "James Lee", product: "Smart Home Speaker", amount: "₹18,500", status: "shipped" },
    { id: "#ORD-1918", customer: "Sarah Kim", product: "Ceramic Table Lamp", amount: "₹3,450", status: "pending" },
    { id: "#ORD-1917", customer: "Mike Torres", product: "Laptop Stand Pro", amount: "₹8,999", status: "delivered" },
];

const STATUS_COLORS: Record<string, string> = {
    delivered: "badge-green",
    processing: "badge-blue",
    shipped: "badge-yellow",
    pending: "badge-red",
};

export default function AdminDashboardPage() {
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <p className={styles.pageSubtitle}>Welcome back! Here&apos;s what&apos;s happening with your store.</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.dateStr}>{today}</span>
                </div>
            </div>

            <div className={styles.statsGrid}>
                {STATS.map(({ label, value, change, up, icon: Icon, color }) => (
                    <div key={label} className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIconWrap} ${styles[`icon_${color}`]}`}>
                                <Icon size={20} />
                            </div>
                            <span className={`${styles.statChange} ${up ? styles.statUp : styles.statDown}`}>
                                {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {change}
                            </span>
                        </div>
                        <div className={styles.statValue}>{value}</div>
                        <div className={styles.statLabel}>{label}</div>
                    </div>
                ))}
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Recent Orders</h2>
                        <Link href="/admin/orders" className={styles.viewAll}>View all →</Link>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RECENT_ORDERS.map((order) => (
                                    <tr key={order.id} className={styles.tableRow}>
                                        <td><span className={styles.orderId}>{order.id}</span></td>
                                        <td>{order.customer}</td>
                                        <td className={styles.productCell}>{order.product}</td>
                                        <td><span className={styles.amount}>{order.amount}</span></td>
                                        <td><span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Escalated Disputes</h2>
                        <Link href="/admin/issues" className={styles.viewAll}>Manage all →</Link>
                    </div>
                    <AdminIssuesSummary />
                </div>
            </div>
        </div>
    );
}

function AdminIssuesSummary() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchIssues() {
            try {
                const res = await fetch("/api/issues");
                const data = await res.json();
                if (res.ok) {
                    setIssues(data.issues.filter((i: any) => i.status === "ESCALATED").slice(0, 5));
                }
            } finally {
                setLoading(false);
            }
        }
        fetchIssues();
    }, []);

    if (loading) return <div className={styles.emptyTable}>Loading disputes...</div>;
    if (issues.length === 0) return <div className={styles.emptyTable}>No escalated disputes.</div>;

    return (
        <div className={styles.miniList}>
            {issues.map(issue => (
                <Link key={issue.id} href={`/admin/issues/${issue.id}`} className={styles.miniItem}>
                    <div className={styles.miniMain}>
                        <div className={styles.miniTitle}>{issue.subject}</div>
                        <div className={styles.miniMeta}>Vendor: {issue.vendor?.full_name || issue.vendor_id?.slice(0, 8)}</div>
                    </div>
                    <div className={styles.miniPriority}>{issue.priority}</div>
                </Link>
            ))}
        </div>
    );
}
