"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, ChevronRight, Shapes, ShieldAlert, ArrowUpRight } from "lucide-react";
import styles from "./layout.module.css";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Shapes },
    { href: "/admin/vendors", label: "Vendors", icon: ShoppingBag },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/cases", label: "Cases", icon: ShieldAlert },
    { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.push("/");
        router.refresh();
    };

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <div className={`${styles.shell} workspaceShell`}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>Aura</Link>
                    <span className={styles.roleTag}>Admin</span>
                </div>

                <nav className={styles.nav} aria-label="Admin navigation">
                    {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(styles.navItem, { [styles.navActive]: isActive(href, exact) })}
                        >
                            <Icon size={18} className={styles.navIcon} />
                            <span>{label}</span>
                            {isActive(href, exact) && <ChevronRight size={14} className={styles.navChevron} />}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userBadge}>
                        <div className={styles.userAvatar}>{user?.name?.[0] ?? "A"}</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name ?? "Admin"}</span>
                            <span className={styles.userEmail}>{user?.email ?? ""}</span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Sign out">
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className={styles.main}>
                <div className={styles.content}>
                    <div className="workspaceTopbar">
                        <div className="workspaceMeta">
                            <span className="workspaceKicker">Admin workspace</span>
                            <h1 className="workspaceHeading">Govern the platform with a sharper operational view.</h1>
                            <p className="workspaceText">Products, vendors, cases, and orders now follow the same premium visual system as the storefront.</p>
                        </div>
                        <Link href="/" className="workspaceLink">
                            Open Storefront
                            <ArrowUpRight size={16} />
                        </Link>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
