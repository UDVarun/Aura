"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, AlertCircle, Send } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import styles from "./page.module.css";

function NewIssueContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    
    const [orders, setOrders] = useState<any[]>([]);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState(orderId || "");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("NORMAL");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchOrders() {
            const res = await fetch("/api/orders/me");
            const data = await res.json();
            if (res.ok) setOrders(data.orders || []);
        }
        fetchOrders();
    }, []);

    useEffect(() => {
        if (!selectedOrderId || orders.length === 0) {
            setOrderItems([]);
            setSelectedProductId("");
            return;
        }

        const order = orders.find((o: any) => o.id === selectedOrderId);
        if (order && order.items) {
            setOrderItems(order.items);
        } else {
            setOrderItems([]);
        }
    }, [selectedOrderId, orders]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderId || !subject || !description) {
            setError("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const selectedItem = orderItems.find(item => item.product_id === selectedProductId);
            
            const res = await fetch("/api/issues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: selectedOrderId,
                    product_id: selectedProductId || null,
                    vendor_id: selectedItem?.products?.vendor_id || null,
                    subject,
                    description,
                    priority,
                })
            });

            const data = await res.json();
            if (res.ok) {
                router.push(`/account/issues/${data.issue.id}`);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <Link href="/account/issues" className={styles.backLink}>
                <ChevronLeft size={16} /> Back
            </Link>

            <div className={styles.formCard}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Report a Problem</h1>
                    <p className={styles.subtitle}>Let us know what's wrong with your order</p>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorAlert}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div className={styles.field}>
                        <label>Select Order</label>
                        <select 
                            value={selectedOrderId} 
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">Select an order...</option>
                            {orders.map(o => (
                                <option key={o.id} value={o.id}>
                                    Order #{o.order_number} ({new Date(o.placed_at).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {orderItems.length > 0 && (
                        <div className={styles.field}>
                            <label>Specific Product (Optional)</label>
                            <select 
                                value={selectedProductId} 
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Entire Order / General</option>
                                {orderItems.map(item => (
                                    <option key={item.id} value={item.product_id}>
                                        {item.products?.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.field}>
                        <label>Subject</label>
                        <input 
                            type="text" 
                            className={styles.input}
                            placeholder="Brief summary of the issue (e.g., Damaged item, missing parts)"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Description</label>
                        <textarea 
                            className={styles.textarea}
                            placeholder="Please provide details about the problem. Be as specific as possible."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Priority</label>
                        <div className={styles.priorityGrid}>
                            {["LOW", "NORMAL", "HIGH", "URGENT"].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    className={clsx(styles.priorityBtn, priority === p && styles.active)}
                                    onClick={() => setPriority(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={clsx("btn btn-primary", styles.submitBtn)}
                        disabled={submitting}
                    >
                        {submitting ? "Submitting..." : (
                            <>
                                Submit Report <Send size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function NewIssuePage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.formCard}>
                    <p>Loading form...</p>
                </div>
            </div>
        }>
            <NewIssueContent />
        </Suspense>
    );
}
