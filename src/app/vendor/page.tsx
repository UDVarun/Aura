import Link from "next/link";
import styles from "./page.module.css";
import { formatCurrency } from "@/lib/currency";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function VendorDashboardPage() {
    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: vendor } = user
        ? await supabase.from("vendors").select("*").eq("user_id", user.id).single()
        : { data: null };

    const { count: productCount = 0 } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", user?.id ?? "");

    const { count: orderCount = 0 } = await supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", user?.id ?? "");

    const topProducts = await supabase
        .from("products")
        .select("id, title, price, stock_quantity")
        .eq("vendor_id", user?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(3);

    const ordersResponse = await supabase
        .from("order_items")
        .select("quantity, price_at_time")
        .eq("vendor_id", user?.id ?? "")
        .limit(100);

    const topProductsList = topProducts.data ?? [];
    const totalRevenue = (ordersResponse.data ?? []).reduce((sum, item) => {
        return sum + Number(item.price_at_time ?? 0) * Number(item.quantity ?? 0);
    }, 0);

    const lowStockProducts = topProductsList.filter((product) => Number(product.stock_quantity ?? 0) < 5).length;
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
            description: `${lowStockProducts} low-stock items need attention right now.`,
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
                        {vendor
                            ? "Manage your catalog and view a quick overview of your performance."
                            : "You need to apply and be approved before accessing the vendor dashboard."}
                    </p>
                </div>
                <Link href="/vendor/products" className="btn btn-primary">
                    Manage Products
                </Link>
            </div>

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.stat_blue}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Products</span>
                    </div>
                    <div className={styles.statValue}>{productCount ?? 0}</div>
                </div>
                <div className={`${styles.statCard} ${styles.stat_green}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Orders</span>
                    </div>
                    <div className={styles.statValue}>{orderCount ?? 0}</div>
                </div>
                <div className={`${styles.statCard} ${styles.stat_purple}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Status</span>
                    </div>
                    <div className={styles.statValue}>{vendor?.status ?? "pending"}</div>
                </div>
                <div className={`${styles.statCard} ${styles.stat_gold}`}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Revenue</span>
                    </div>
                    <div className={styles.statValue}>{formatCurrency(totalRevenue)}</div>
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
                            </tr>
                        </thead>
                        <tbody>
                            {topProductsList.map((product) => (
                                <tr key={product.id} className={styles.tableRow}>
                                    <td>{product.title}</td>
                                    <td>{formatCurrency(Number(product.price || 0))}</td>
                                    <td>{product.stock_quantity}</td>
                                </tr>
                            ))}
                            {topProductsList.length === 0 && (
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
