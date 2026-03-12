"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/context/AuthContext";
import { useVendor } from "@/context/VendorContext";
import { ArrowRight, Loader2, Star } from "lucide-react";
import { Stars } from "@/components/marketplace/Stars";

export default function VendorDashboardPage() {
    const { user } = useAuth();
    const { products, orders, loading, stats } = useVendor();

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loaderWrap}>
                    <Loader2 className="animate-spin" size={40} />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const quickActions = [
        {
            title: "Add product",
            description: "Create a new listing with images, INR pricing, and inventory.",
            href: "/vendor/products/new",
            label: "New listing",
        },
        {
            title: "Edit catalog",
            description: "Update titles, descriptions, and prices for your own products.",
            href: "/vendor/products",
            label: "Manage products",
        },
        {
            title: "Manage stock",
            description: `${stats.lowStockItems} low-stock items need attention right now.`,
            href: "/vendor/products",
            label: "Update stock",
        },
        {
            title: "View orders",
            description: "Track orders and revenue only for products sold by your store.",
            href: "/vendor/orders",
            label: "Open orders",
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Vendor Dashboard</h1>
                    <p className={styles.pageSubtitle}>
                        Manage your catalog and view a quick overview of your performance in real-time.
                    </p>
                </div>
                <Link href="/vendor/products" className={styles.heroButton}>
                    Manage Products
                    <ArrowRight size={16} />
                </Link>
            </div>

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.stat_blue}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Products</span>
                    </div>
                    <div className={styles.statValue}>{stats.productCount}</div>
                </div>
                <div className={`${styles.statCard} ${styles.stat_green}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Orders</span>
                    </div>
                    <div className={styles.statValue}>{stats.totalOrders}</div>
                </div>
                <div className={`${styles.statCard} ${styles.stat_purple}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Avg Rating</span>
                    </div>
                    <div className={styles.statValue}>{stats.averageRating.toFixed(1)}</div>
                </div>
                <div className={`${styles.statCard} ${styles.stat_gold}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Revenue</span>
                    </div>
                    <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
                </div>
            </div>

            <div className={styles.quickActionGrid}>
                {quickActions.map((action) => (
                    <section key={action.title} className={styles.actionCard}>
                        <div className={styles.actionBody}>
                            <p className={styles.actionEyebrow}>Vendor feature</p>
                            <h3 className={styles.actionTitle}>{action.title}</h3>
                            <p className={styles.actionDescription}>{action.description}</p>
                        </div>
                        <Link href={action.href} className={styles.actionLink}>
                            {action.label}
                            <ArrowRight size={15} />
                        </Link>
                    </section>
                ))}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Top products</h2>
                    <Link href="/vendor/products" className={styles.viewAll}>
                        View all
                    </Link>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.slice(0, 5).map((product) => (
                                <tr key={product.id} className={styles.tableRow}>
                                    <td>{product.title}</td>
                                    <td>{formatCurrency(product.price)}</td>
                                    <td>{product.stock_quantity}</td>
                                    <td>
                                        <Stars 
                                            rating={product.avg_rating || 0} 
                                            count={product.review_count || 0} 
                                            size={14} 
                                        />
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={3} className={styles.emptyCell}>
                                        No products yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
