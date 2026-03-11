"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Filter, Package, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, parsePriceValue } from "@/lib/currency";
import { deleteProductImage } from "@/lib/supabase/storage";
import styles from "./page.module.css";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "badge-green" },
    out_of_stock: { label: "Out of Stock", cls: "badge-red" },
    low_stock: { label: "Low Stock", cls: "badge-yellow" },
};

interface AdminProductRow {
    id: string;
    title: string;
    price: number | string;
    stock_quantity: number;
    image_url?: string | null;
    categories?: { name?: string | null } | null;
}

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : String(err);
}

export default function AdminProductsPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<AdminProductRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("*, categories(name)")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setProducts(data || []);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [supabase]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

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
                    <h1 className={styles.pageTitle}>Products</h1>
                    <p className={styles.pageSubtitle}>{loading ? "..." : products.length} total products</p>
                </div>
                <Link href="/admin/products/new" className="btn btn-primary"><Plus size={16} /> Add Product</Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search products..." className={`input ${styles.searchInput}`} />
                </div>
                <button className="btn btn-secondary"><Filter size={15} /> Filter</button>
            </div>

            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading products...</p>
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
                                    const stockStatus = p.stock_quantity === 0 ? "out_of_stock" : p.stock_quantity < 5 ? "low_stock" : "active";
                                    const priceValue = parsePriceValue(p.price);
                                    return (
                                        <tr key={p.id} className={styles.tableRow}>
                                            <td className={styles.productCell}>
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
                                            </td>
                                            <td>{p.categories?.name || "Uncategorized"}</td>
                                            <td className={styles.price}>{formatCurrency(priceValue)}</td>
                                            <td className={p.stock_quantity === 0 ? styles.stockZero : p.stock_quantity < 5 ? styles.stockLow : styles.stockOk}>{p.stock_quantity}</td>
                                            <td><span className={`badge ${STATUS_MAP[stockStatus].cls}`}>{STATUS_MAP[stockStatus].label}</span></td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <Link href={`/admin/products/edit/${p.id}`} className={styles.actionBtn} aria-label="Edit"><Edit size={14} /></Link>
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
                                        <td colSpan={6} className={styles.emptyCell}>No products found. Click &quot;Add Product&quot; to get started.</td>
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
