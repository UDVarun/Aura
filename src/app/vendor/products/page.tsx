import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import styles from "./page.module.css";

const MY_PRODUCTS = [
    { id: "1", name: "Sony WH-1000XM5", category: "Electronics", price: 398.00, stock: 24, sales: 84, status: "active" },
    { id: "3", name: "Aura Premium Smart Home Speaker", category: "Audio", price: 249.50, stock: 12, sales: 61, status: "active" },
    { id: "6", name: "Noise-Isolating Earbuds Elite", category: "Audio", price: 199.00, stock: 3, sales: 45, status: "low_stock" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "badge-green" },
    low_stock: { label: "Low Stock", cls: "badge-yellow" },
    inactive: { label: "Inactive", cls: "badge-red" },
};

export default function VendorProductsPage() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>My Products</h1>
                    <p className={styles.pageSubtitle}>{MY_PRODUCTS.length} products in your store</p>
                </div>
                <button className="btn btn-primary"><Plus size={16} /> Add Product</button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search your products..." className={`input ${styles.searchInput}`} />
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Total Sales</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MY_PRODUCTS.map((p) => (
                                <tr key={p.id} className={styles.tableRow}>
                                    <td>
                                        <div className={styles.productCell}>
                                            <Package size={16} className={styles.productIcon} />
                                            <span className={styles.productName}>{p.name}</span>
                                        </div>
                                    </td>
                                    <td>{p.category}</td>
                                    <td className={styles.price}>${p.price.toFixed(2)}</td>
                                    <td className={p.stock === 0 ? styles.stockZero : p.stock < 5 ? styles.stockLow : styles.stockOk}>{p.stock}</td>
                                    <td className={styles.sales}>{p.sales}</td>
                                    <td><span className={`badge ${STATUS_MAP[p.status].cls}`}>{STATUS_MAP[p.status].label}</span></td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} aria-label="Edit"><Edit size={14} /></button>
                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} aria-label="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
