"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, LogOut, ChevronRight, Store } from "lucide-react";
import styles from "./layout.module.css";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

const NAV_ITEMS = [
    { href: "/vendor", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/vendor/products", label: "My Products", icon: Package },
    { href: "/vendor/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart2 },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
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
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.brandGroup}>
                        <Store size={18} className={styles.storeIcon} />
                        <Link href="/" className={styles.logo}>Aura</Link>
                    </div>
                    <span className={styles.roleTag}>Vendor</span>
                </div>

                <nav className={styles.nav} aria-label="Vendor navigation">
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
                        <div className={styles.userAvatar}>{user?.name?.[0] ?? "V"}</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name ?? "Vendor"}</span>
                            <span className={styles.userEmail}>{user?.email ?? ""}</span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Sign out">
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            <div className={styles.main}>
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    );
}
