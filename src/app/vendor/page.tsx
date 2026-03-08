import { TrendingUp, ShoppingBag, Package, DollarSign, ArrowUpRight, Star } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";

const STATS = [
    { label: "My Revenue", value: "$12,480", change: "+18.3%", up: true, icon: DollarSign, color: "green" },
    { label: "My Orders", value: "238", change: "+11.5%", up: true, icon: ShoppingBag, color: "blue" },
    { label: "My Products", value: "14", change: "+2", up: true, icon: Package, color: "purple" },
    { label: "Avg. Rating", value: "4.7 ★", change: "+0.3", up: true, icon: Star, color: "yellow" },
];

const TOP_PRODUCTS = [
    { id: "1", name: "Sony WH-1000XM5", sales: 84, revenue: "$33,432", rating: 4.8, stock: 24 },
    { id: "2", name: "Smart Home Speaker", sales: 61, revenue: "$15,219", rating: 4.6, stock: 12 },
    { id: "3", name: "Wireless Earbuds", sales: 45, revenue: "$8,955", rating: 4.5, stock: 3 },
];

const RECENT_ORDERS = [
    { id: "#ORD-1921", customer: "Alex Johnson", product: "Sony WH-1000XM5", amount: "$398.00", status: "delivered" },
    { id: "#ORD-1920", customer: "Maria Garcia", product: "Smart Home Speaker", amount: "$249.50", status: "processing" },
    { id: "#ORD-1917", customer: "Mike Torres", product: "Wireless Earbuds", amount: "$199.00", status: "shipped" },
];

const STATUS_COLORS: Record<string, string> = {
    delivered: "badge-green",
    processing: "badge-blue",
    shipped: "badge-yellow",
};

export default function VendorDashboard() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Vendor Dashboard</h1>
                    <p className={styles.pageSubtitle}>Your store performance overview</p>
                </div>
                <Link href="/vendor/products" className="btn btn-primary"><Package size={16} /> Manage Products</Link>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                {STATS.map(({ label, value, change, up, icon: Icon, color }) => (
                    <div key={label} className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIconWrap} ${styles[`icon_${color}`]}`}><Icon size={20} /></div>
                            <span className={`${styles.statChange} ${up ? styles.statUp : styles.statDown}`}>
                                <ArrowUpRight size={14} /> {change}
                            </span>
                        </div>
                        <div className={styles.statValue}>{value}</div>
                        <div className={styles.statLabel}>{label}</div>
                    </div>
                ))}
            </div>

            <div className={styles.twoCol}>
                {/* Top Products */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Top Products</h2>
                        <Link href="/vendor/products" className={styles.viewAll}>Manage →</Link>
                    </div>
                    {TOP_PRODUCTS.map((p) => (
                        <div key={p.id} className={styles.productRow}>
                            <div className={styles.productInfo}>
                                <span className={styles.productName}>{p.name}</span>
                                <span className={styles.productMeta}>{p.sales} sold · Stock: {p.stock}</span>
                            </div>
                            <div className={styles.productRight}>
                                <span className={styles.productRevenue}>{p.revenue}</span>
                                <span className={styles.productRating}>★ {p.rating}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Orders */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Recent Orders</h2>
                        <Link href="/vendor/orders" className={styles.viewAll}>View all →</Link>
                    </div>
                    {RECENT_ORDERS.map((o) => (
                        <div key={o.id} className={styles.orderRow}>
                            <div>
                                <span className={styles.orderId}>{o.id}</span>
                                <span className={styles.orderCustomer}>{o.customer}</span>
                            </div>
                            <div className={styles.orderRight}>
                                <span className={styles.orderAmount}>{o.amount}</span>
                                <span className={`badge ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
