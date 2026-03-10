"use client";

import Link from "next/link";
import { ShoppingCart, Menu, Search, User, X, LogOut, LayoutDashboard, Store, Settings, CircleUserRound, Sun, Moon, ChevronDown } from "lucide-react";
import styles from "./Navbar.module.css";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";

const CUSTOMER_NAV = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All" },
    { href: "/offers", label: "Offers" },
    { href: "/about", label: "About" },
    { href: "/customer-care", label: "Customer Care" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, setTheme } = useTheme();
    const { itemCount, openCart } = useCart();
    const router = useRouter();
    const pathname = usePathname();
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
                setSettingsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const handleLogout = async () => {
        setUserMenuOpen(false);
        setSettingsOpen(false);
        setMobileOpen(false);
        await logout();
        router.push("/");
        router.refresh();
    };

    const getDashboardLink = () => {
        if (user?.role === "admin") return { href: "/admin", label: "Admin Panel", Icon: LayoutDashboard };
        if (user?.role === "vendor") return { href: "/vendor", label: "Vendor Hub", Icon: Store };
        return null;
    };

    const dashboardLink = getDashboardLink();
    const isNavActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

    return (
        <>
            <header className={clsx(styles.header, { [styles.scrolled]: scrolled })}>
                <div className={styles.navContainer}>
                    {/* Left: Logo + Hamburger */}
                    <div className={styles.logoContainer}>
                        <button
                            className={styles.mobileMenu}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen((v) => !v)}
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
                            Aura
                        </Link>
                    </div>

                    {/* Middle-Left: Desktop Nav */}
                    <nav className={styles.desktopNav} aria-label="Main navigation">
                        {CUSTOMER_NAV.map(({ href, label }) => (
                            <Link key={label} href={href} className={clsx(styles.navLink, { [styles.navLinkActive]: isNavActive(href) })}>
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Center: Global Search Bar */}
                    <div className={styles.globalSearch}>
                        <div className={styles.searchBox}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search products, brands and more..."
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className={styles.actions}>
                        {/* User Menu */}
                        <div className={styles.userMenuWrapper} ref={userMenuRef}>
                            <button
                                className={styles.iconButton}
                                aria-label="User account"
                                aria-expanded={userMenuOpen}
                                onClick={() => setUserMenuOpen((v) => !v)}
                            >
                                <User size={20} />
                            </button>

                            {userMenuOpen && (
                                <div className={clsx(styles.userMenu, "animate-slide-down")}>
                                    {isAuthenticated && user ? (
                                        <>
                                            <div className={styles.userInfo}>
                                                <span className={styles.userName}>{user.name}</span>
                                                <span className={styles.userRole}>{user.role}</span>
                                            </div>
                                            <div className={styles.userMenuDivider} />
                                            {dashboardLink && (
                                                <Link href={dashboardLink.href} className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                                                    <dashboardLink.Icon size={15} />
                                                    {dashboardLink.label}
                                                </Link>
                                            )}
                                            <Link href="/account" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                                                <CircleUserRound size={15} />
                                                Profile
                                            </Link>
                                            <button
                                                type="button"
                                                className={clsx(styles.userMenuItem, styles.settingsTrigger)}
                                                onClick={() => setSettingsOpen((v) => !v)}
                                                aria-expanded={settingsOpen}
                                                aria-controls="theme-settings"
                                            >
                                                <span className={styles.settingsLabel}>
                                                    <Settings size={15} />
                                                    Settings
                                                </span>
                                                <ChevronDown size={14} className={clsx(styles.settingsChevron, { [styles.settingsChevronOpen]: settingsOpen })} />
                                            </button>
                                            {settingsOpen && (
                                                <div className={styles.themeSwitchRow} id="theme-settings">
                                                    <button
                                                        type="button"
                                                        className={theme === "light" ? `${styles.themeChip} ${styles.themeChipActive}` : styles.themeChip}
                                                        onClick={() => setTheme("light")}
                                                    >
                                                        <Sun size={14} />
                                                        Light
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={theme === "dark" ? `${styles.themeChip} ${styles.themeChipActive}` : styles.themeChip}
                                                        onClick={() => setTheme("dark")}
                                                    >
                                                        <Moon size={14} />
                                                        Dark
                                                    </button>
                                                </div>
                                            )}
                                            <div className={styles.userMenuDivider} />
                                            <button className={clsx(styles.userMenuItem, styles.logoutItem)} onClick={handleLogout}>
                                                <LogOut size={15} />
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href="/login" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>Sign In</Link>
                                            <Link href="/register" className={clsx(styles.userMenuItem, styles.registerItem)} onClick={() => setUserMenuOpen(false)}>Create Account</Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className={styles.cartButton} aria-label="Shopping cart" onClick={openCart}>
                            <ShoppingCart size={20} />
                            <span className={styles.cartBadge} aria-label={`${itemCount} items in cart`}>{itemCount}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
            )}

            {/* Mobile Slide-Down Navigation */}
            <nav
                className={clsx(styles.mobileNav, { [styles.mobileNavOpen]: mobileOpen })}
                aria-label="Mobile navigation"
                aria-hidden={!mobileOpen}
            >
                <div className={styles.mobileNavContent}>
                    {/* Mobile Search */}
                    <div className={styles.mobileSearch}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" placeholder="Search..." className={styles.mobileSearchInput} />
                    </div>
                    <div className={styles.mobileNavDivider} />

                    {CUSTOMER_NAV.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(styles.mobileNavLink, { [styles.mobileNavLinkActive]: isNavActive(href) })}
                            onClick={() => setMobileOpen(false)}
                        >
                            {label}
                        </Link>
                    ))}
                    <div className={styles.mobileNavDivider} />
                    {isAuthenticated && user ? (
                        <>
                            <Link href="/account" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
                                <CircleUserRound size={16} />
                                Profile
                            </Link>
                            <button className={clsx(styles.mobileNavLink, styles.mobileNavLogout)} onClick={handleLogout}>
                                <LogOut size={16} />
                                Sign Out ({user.name})
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>Sign In</Link>
                            <Link href="/register" className={clsx(styles.mobileNavLink, styles.mobileNavHighlight)} onClick={() => setMobileOpen(false)}>Create Account</Link>
                        </>
                    )}
                </div>
            </nav>
        </>
    );
}
