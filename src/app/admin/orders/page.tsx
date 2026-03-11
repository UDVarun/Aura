import { Search, Filter } from "lucide-react";
import styles from "../products/page.module.css";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatCurrency, parsePriceValue } from "@/lib/currency";

interface AdminOrderRow {
    id: string;
    product_title: string;
    line_total: number;
    status: string;
    shipment_status: string;
    created_at: string;
    orders?: {
        order_number?: string | null;
        shipping_address?: {
            firstName?: string;
            lastName?: string;
            email?: string;
        } | null;
    } | null;
}

const STATUS_MAP: Record<string, string> = {
    delivered: "badge-green",
    processing: "badge-blue",
    shipped: "badge-yellow",
    placed: "badge-yellow",
    cancelled: "badge-red",
    disputed: "badge-red",
    refund_requested: "badge-red",
};

export default async function AdminOrdersPage() {
    const supabase = await createServerSupabase();
    const { data } = await supabase
        .from("order_items")
        .select("id, product_title, line_total, status, shipment_status, created_at, orders(order_number, shipping_address)")
        .order("created_at", { ascending: false })
        .limit(100);

    const orders = (data as AdminOrderRow[] | null) ?? [];

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Orders</h1>
                    <p className={styles.pageSubtitle}>{orders.length} tracked order lines across the marketplace</p>
                </div>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search orders..." className={`input ${styles.searchInput}`} readOnly />
                </div>
                <button className="btn btn-secondary"><Filter size={15} /> Live queue</button>
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
                                const customerName = [shipping?.firstName, shipping?.lastName].filter(Boolean).join(" ") || "Aura customer";
                                return (
                                    <tr key={order.id} className={styles.tableRow}>
                                        <td><span className={styles.orderId}>{order.orders?.order_number ?? order.id}</span></td>
                                        <td>
                                            <div>
                                                <div className={styles.customer}>{customerName}</div>
                                                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{shipping?.email ?? ""}</div>
                                            </div>
                                        </td>
                                        <td className={styles.productName}>{order.product_title}</td>
                                        <td>{new Date(order.created_at).toLocaleDateString("en-IN")}</td>
                                        <td><span className={styles.amount}>{formatCurrency(parsePriceValue(order.line_total))}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[order.status] ?? "badge-blue"}`}>{order.status}</span></td>
                                    </tr>
                                );
                            })}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={styles.emptyCell}>No orders have been placed yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
