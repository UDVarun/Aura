"use client";

import { useEffect, useState, Suspense } from "react";
import { Search, Filter, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import styles from "../products/page.module.css";
import { createClient } from "@/lib/supabase/client";
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

function AdminOrdersContent() {
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<AdminOrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const supabase = createClient();

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            const { data } = await supabase
                .from("order_items")
                .select("id, product_title, line_total, status, shipment_status, created_at, orders(order_number, shipping_address)")
                .order("created_at", { ascending: false })
                .limit(200);

            if (data) setOrders(data as any);
            setLoading(false);
        }
        fetchOrders();
    }, [supabase]);

    const filteredOrders = orders.filter(o => 
        (o.orders?.order_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.product_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.orders?.shipping_address?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.page}>
                <div className="flex-center" style={{ height: "400px" }}>
                    <Loader2 className="animate-spin" size={40} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Orders</h1>
                    <p className={styles.pageSubtitle}>{filteredOrders.length} tracked order lines match your view</p>
                </div>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input 
                        type="search" 
                        placeholder="Search orders, customers..." 
                        className={`input ${styles.searchInput}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                            {filteredOrders.map((order) => {
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
                                        <td><span className={`badge ${STATUS_MAP[order.status.toLowerCase()] ?? "badge-blue"}`}>{order.status}</span></td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={styles.emptyCell}>No orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={
            <div className={styles.page}>
                <div className="flex-center" style={{ height: "400px" }}>
                    <Loader2 className="animate-spin" size={40} />
                </div>
            </div>
        }>
            <AdminOrdersContent />
        </Suspense>
    );
}
