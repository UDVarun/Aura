import { Plus, Search, Edit, Trash2, Filter } from "lucide-react";
import styles from "./page.module.css";

const PRODUCTS = [
    { id: "1", name: "Sony WH-1000XM5", category: "Electronics", price: 398.00, stock: 24, status: "active", vendor: "Sony Official" },
    { id: "2", name: "Mechanical Keyboard", category: "Accessories", price: 159.99, stock: 57, status: "active", vendor: "KeyCraft" },
    { id: "3", name: "Smart Home Speaker", category: "Audio", price: 249.50, stock: 12, status: "active", vendor: "Aura Store" },
    { id: "4", name: "Ceramic Table Lamp", category: "Home Decor", price: 89.00, stock: 0, status: "out_of_stock", vendor: "Aura Store" },
    { id: "5", name: "Laptop Stand Pro", category: "Accessories", price: 79.99, stock: 88, status: "active", vendor: "DeskSetup" },
    { id: "6", name: "Noise-Isolating Earbuds", category: "Audio", price: 199.00, stock: 3, status: "low_stock", vendor: "SoundPro" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "badge-green" },
    out_of_stock: { label: "Out of Stock", cls: "badge-red" },
    low_stock: { label: "Low Stock", cls: "badge-yellow" },
};

export default function AdminProductsPage() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Products</h1>
                    <p className={styles.pageSubtitle}>{PRODUCTS.length} total products</p>
                </div>
                <button className="btn btn-primary"><Plus size={16} /> Add Product</button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search products..." className={`input ${styles.searchInput}`} />
                </div>
                <button className="btn btn-secondary"><Filter size={15} /> Filter</button>
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
                                <th>Vendor</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PRODUCTS.map((p) => (
                                <tr key={p.id} className={styles.tableRow}>
                                    <td className={styles.productName}>{p.name}</td>
                                    <td>{p.category}</td>
                                    <td className={styles.price}>${p.price.toFixed(2)}</td>
                                    <td className={p.stock === 0 ? styles.stockZero : p.stock < 5 ? styles.stockLow : styles.stockOk}>{p.stock}</td>
                                    <td className={styles.vendorCell}>{p.vendor}</td>
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
