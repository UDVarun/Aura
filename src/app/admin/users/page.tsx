import { Search, Filter, Edit, UserCheck, UserX } from "lucide-react";
import styles from "../products/page.module.css";

const USERS = [
    { id: "1", name: "Alex Johnson", email: "customer@demo.com", role: "customer", joined: "Jan 12, 2026", orders: 8, status: "active" },
    { id: "2", name: "Admin User", email: "admin@demo.com", role: "admin", joined: "Dec 1, 2025", orders: 0, status: "active" },
    { id: "3", name: "Vendor Partner", email: "vendor@demo.com", role: "vendor", joined: "Jan 5, 2026", orders: 0, status: "active" },
    { id: "4", name: "Sarah Kim", email: "sarah@example.com", role: "customer", joined: "Feb 20, 2026", orders: 3, status: "active" },
    { id: "5", name: "Mike Torres", email: "mike@example.com", role: "customer", joined: "Mar 1, 2026", orders: 1, status: "suspended" },
    { id: "6", name: "KeyCraft Store", email: "keycraft@vendor.com", role: "vendor", joined: "Nov 20, 2025", orders: 0, status: "active" },
];

const ROLE_BADGE: Record<string, string> = { customer: "badge-blue", admin: "badge-red", vendor: "badge-yellow" };
const STATUS_BADGE: Record<string, string> = { active: "badge-green", suspended: "badge-red" };

export default function AdminUsersPage() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Users</h1>
                    <p className={styles.pageSubtitle}>{USERS.length} registered accounts</p>
                </div>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="search" placeholder="Search users..." className={`input ${styles.searchInput}`} />
                </div>
                <button className="btn btn-secondary"><Filter size={15} /> Filter by role</button>
            </div>
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Orders</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {USERS.map((u) => (
                                <tr key={u.id} className={styles.tableRow}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.userAvatar}>{u.name[0]}</div>
                                            <div className={styles.userInfo}>
                                                <span className={styles.userName}>{u.name}</span>
                                                <span className={styles.userEmail}>{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                                    <td>{u.joined}</td>
                                    <td>{u.orders}</td>
                                    <td><span className={`badge ${STATUS_BADGE[u.status]}`}>{u.status}</span></td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} aria-label="Edit user"><Edit size={14} /></button>
                                            <button className={`${styles.actionBtn} ${u.status === "active" ? styles.deleteBtn : ""}`} aria-label={u.status === "active" ? "Suspend" : "Activate"}>
                                                {u.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                                            </button>
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
