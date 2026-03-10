"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { deleteProductImage } from "@/lib/supabase/storage";
import styles from "./page.module.css";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "badge-green" },
    low_stock: { label: "Low Stock", cls: "badge-yellow" },
    inactive: { label: "Inactive", cls: "badge-red" },
};

interface VendorProductRow {
    id: string;
    title: string;
    price: number | string;
    stock_quantity: number;
    image_url?: string | null;
    categories?: { name?: string | null } | null;
}

function toNumber(value: string | number | null | undefined) {
    return typeof value === "number" ? value : parseFloat(value?.toString() ?? "0");
}

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : String(err);
}

export default function VendorProductsPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<VendorProductRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMyProducts() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError("Not authenticated");
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from("products")
                    .select("*, categories(name)")
                    .eq("vendor_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setProducts(data || []);
            } catch (err) {
                console.error("Error fetching vendor products:", err);
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        }

        fetchMyProducts();
    }, [supabase]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;

        try {
            const productToDelete = products.find(p => p.id === id);

            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;

            // Delete associated image from Supabase Storage
            if (productToDelete?.image_url) {
                await deleteProductImage(supabase, productToDelete.image_url);
            }

            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            alert("Delete failed: " + getErrorMessage(err));
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>My Products</h1>
                    <p className={styles.pageSubtitle}>{loading ? "..." : products.length} products in your store</p>
                </div>
                <Link href="/vendor/products/new" className="btn btn-primary"><Plus size={16} /> Add Product</Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search your products..." className={`input ${styles.searchInput}`} />
                </div>
            </div>

            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading your products...</p>
                </div>
            ) : error ? (
                <div className={styles.errorState}>
                    <p>Error: {error}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-secondary">Retry</button>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => {
                                    const stockStatus = p.stock_quantity === 0 ? "inactive" : p.stock_quantity < 5 ? "low_stock" : "active";
                                    return (
                                        <tr key={p.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.productCell}>
                                                    {p.image_url ? (
                                                        <Image
                                                            src={p.image_url}
                                                            alt={p.title}
                                                            width={56}
                                                            height={56}
                                                            className={styles.productThumb}
                                                        />
                                                    ) : (
                                                        <div className={styles.productThumbPlaceholder}><Package size={14} /></div>
                                                    )}
                                                    <span className={styles.productName}>{p.title}</span>
                                                </div>
                                            </td>
                                            <td>{p.categories?.name || "Uncategorized"}</td>
                                            <td className={styles.price}>{formatCurrency(toNumber(p.price))}</td>
                                            <td className={p.stock_quantity === 0 ? styles.stockZero : p.stock_quantity < 5 ? styles.stockLow : styles.stockOk}>{p.stock_quantity}</td>
                                            <td><span className={`badge ${STATUS_MAP[stockStatus].cls}`}>{STATUS_MAP[stockStatus].label}</span></td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <Link href={`/vendor/products/edit/${p.id}`} className={styles.actionBtn} aria-label="Edit"><Edit size={14} /></Link>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        aria-label="Delete"
                                                        onClick={() => handleDelete(p.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.emptyCell}>You haven&apos;t added any products yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
