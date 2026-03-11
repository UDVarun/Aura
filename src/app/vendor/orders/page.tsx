"use client";

import { Search, Loader2 } from "lucide-react";
import styles from "../products/page.module.css";
import { formatCurrency } from "@/lib/currency";
import { useVendor } from "@/context/VendorContext";

const STATUS_MAP: Record<string, string> = {
    delivered: "badge-green",
    processing: "badge-blue",
    shipped: "badge-yellow",
    placed: "badge-yellow",
    cancelled: "badge-red",
    disputed: "badge-red",
    refund_requested: "badge-red",
};

export default function VendorOrdersPage() {
    const { orders, loading } = useVendor();

    if (loading) {
        return (
            <div className={styles.page}>
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                    <Loader2 className="animate-spin" size={40} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>My Orders</h1>
                    <p className={styles.pageSubtitle}>{orders.length} order lines require vendor visibility.</p>
                </div>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search orders..." className={`input ${styles.searchInput}`} readOnly />
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
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const shipping = order.orders?.shipping_address;
                                const customerName = shipping 
                                    ? [shipping.firstName, shipping.lastName].filter(Boolean).join(" ") 
                                    : "Aura customer";
                                
                                return (
                                    <tr key={order.id} className={styles.tableRow}>
                                        <td><span className={styles.orderId}>{order.orders?.order_number ?? order.id}</span></td>
                                        <td>
                                            <div>
                                                <span className={styles.customer}>{customerName}</span>
                                                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{shipping?.email ?? ""}</div>
                                            </div>
                                        </td>
                                        <td className={styles.productName}>{order.product_title}</td>
                                        <td>{new Date(order.created_at).toLocaleDateString("en-IN")}</td>
                                        <td><span className={styles.amount}>{formatCurrency(order.line_total)}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[order.status] ?? "badge-blue"}`}>{order.shipment_status || order.status}</span></td>
                                    </tr>
                                );
                            })}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={styles.emptyCell}>No vendor orders yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
