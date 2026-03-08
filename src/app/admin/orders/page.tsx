import { Search, Filter, Eye } from "lucide-react";
import styles from "../products/page.module.css";

const ORDERS = [
    { id: "#ORD-1921", customer: "Alex Johnson", email: "alex@example.com", product: "Sony WH-1000XM5", amount: "$398.00", date: "Mar 8, 2026", status: "delivered" },
    { id: "#ORD-1920", customer: "Maria Garcia", email: "maria@example.com", product: "Mechanical Keyboard", amount: "$159.99", date: "Mar 8, 2026", status: "processing" },
    { id: "#ORD-1919", customer: "James Lee", email: "james@example.com", product: "Smart Home Speaker", amount: "$249.50", date: "Mar 7, 2026", status: "shipped" },
    { id: "#ORD-1918", customer: "Sarah Kim", email: "sarah@example.com", product: "Ceramic Table Lamp", amount: "$89.00", date: "Mar 7, 2026", status: "pending" },
    { id: "#ORD-1917", customer: "Mike Torres", email: "mike@example.com", product: "Laptop Stand Pro", amount: "$79.99", date: "Mar 6, 2026", status: "delivered" },
    { id: "#ORD-1916", customer: "Lisa Wang", email: "lisa@example.com", product: "Wireless Earbuds", amount: "$199.00", date: "Mar 6, 2026", status: "cancelled" },
];

const STATUS_MAP: Record<string, string> = {
    delivered: "badge-green",
    processing: "badge-blue",
    shipped: "badge-yellow",
    pending: "badge-red",
    cancelled: "badge-red",
};

export default function AdminOrdersPage() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Orders</h1>
                    <p className={styles.pageSubtitle}>{ORDERS.length} orders this week</p>
                </div>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search orders..." className={`input ${styles.searchInput}`} />
                </div>
                <button className="btn btn-secondary"><Filter size={15} /> Filter</button>
            </div>
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ORDERS.map((o) => (
                                <tr key={o.id} className={styles.tableRow}>
                                    <td><span className={styles.orderId}>{o.id}</span></td>
                                    <td>
                                        <div>
                                            <div className={styles.customer}>{o.customer}</div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{o.email}</div>
                                        </div>
                                    </td>
                                    <td className={styles.productName}>{o.product}</td>
                                    <td>{o.date}</td>
                                    <td><span className={styles.amount}>{o.amount}</span></td>
                                    <td><span className={`badge ${STATUS_MAP[o.status]}`}>{o.status}</span></td>
                                    <td>
                                        <button className={styles.actionBtn} aria-label="View order"><Eye size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
