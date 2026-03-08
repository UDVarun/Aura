import { Search, Eye } from "lucide-react";
import styles from "../products/page.module.css";

const MY_ORDERS = [
    { id: "#ORD-1921", customer: "Alex Johnson", product: "Sony WH-1000XM5", amount: "$398.00", date: "Mar 8, 2026", status: "delivered" },
    { id: "#ORD-1920", customer: "Maria Garcia", product: "Smart Home Speaker", amount: "$249.50", date: "Mar 8, 2026", status: "processing" },
    { id: "#ORD-1917", customer: "Mike Torres", product: "Wireless Earbuds", amount: "$199.00", date: "Mar 6, 2026", status: "shipped" },
];

const STATUS_MAP: Record<string, string> = {
    delivered: "badge-green",
    processing: "badge-blue",
    shipped: "badge-yellow",
};

export default function VendorOrdersPage() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>My Orders</h1>
                    <p className={styles.pageSubtitle}>{MY_ORDERS.length} orders for your products</p>
                </div>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search orders..." className={`input ${styles.searchInput}`} />
                </div>
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
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {MY_ORDERS.map((o) => (
                                <tr key={o.id} className={styles.tableRow}>
                                    <td><span className={styles.orderId}>{o.id}</span></td>
                                    <td><span className={styles.customer}>{o.customer}</span></td>
                                    <td className={styles.productName}>{o.product}</td>
                                    <td>{o.date}</td>
                                    <td><span className={styles.amount}>{o.amount}</span></td>
                                    <td><span className={`badge ${STATUS_MAP[o.status]}`}>{o.status}</span></td>
                                    <td><button className={styles.actionBtn} aria-label="View"><Eye size={14} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
