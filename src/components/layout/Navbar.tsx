"use client";

import Link from "next/link";
import { ShoppingCart, Menu, Search, User, X, LogOut, LayoutDashboard, Store } from "lucide-react";
import styles from "./Navbar.module.css";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const CUSTOMER_NAV = [
    { href: "/products", label: "Shop" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Close user menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const handleLogout = async () => {
        setUserMenuOpen(false);
        setMobileOpen(false);
        await logout();
        router.push("/");
        router.refresh(); // forces middleware to re-evaluate cleared session
    };

    const getDashboardLink = () => {
        if (user?.role === "admin") return { href: "/admin", label: "Admin Panel", Icon: LayoutDashboard };
        if (user?.role === "vendor") return { href: "/vendor", label: "Vendor Hub", Icon: Store };
        return null;
    };

    const dashboardLink = getDashboardLink();

    return (
        <>
            <header className={clsx(styles.header, { [styles.scrolled]: scrolled })}>
                <div className={`container ${styles.navContainer}`}>
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

                    {/* Center: Desktop Nav */}
                    <nav className={styles.desktopNav} aria-label="Main navigation">
                        {CUSTOMER_NAV.map(({ href, label }) => (
                            <Link key={href} href={href} className={styles.navLink}>{label}</Link>
                        ))}
                        {dashboardLink && (
                            <Link href={dashboardLink.href} className={clsx(styles.navLink, styles.dashboardLink)}>
                                <dashboardLink.Icon size={15} />
                                {dashboardLink.label}
                            </Link>
                        )}
                    </nav>

                    {/* Right: Actions */}
                    <div className={styles.actions}>
                        <button className={styles.iconButton} aria-label="Search">
                            <Search size={20} />
                        </button>

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
                                                <User size={15} />
                                                My Account
                                            </Link>
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

                        <Link href="/cart" className={styles.cartButton} aria-label="Shopping cart">
                            <ShoppingCart size={20} />
                            <span className={styles.cartBadge} aria-label="3 items in cart">3</span>
                        </Link>
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
                    {CUSTOMER_NAV.map(({ href, label }) => (
                        <Link key={href} href={href} className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
                            {label}
                        </Link>
                    ))}
                    {dashboardLink && (
                        <Link href={dashboardLink.href} className={clsx(styles.mobileNavLink, styles.mobileNavHighlight)} onClick={() => setMobileOpen(false)}>
                            <dashboardLink.Icon size={16} />
                            {dashboardLink.label}
                        </Link>
                    )}
                    <div className={styles.mobileNavDivider} />
                    {isAuthenticated ? (
                        <button className={clsx(styles.mobileNavLink, styles.mobileNavLogout)} onClick={handleLogout}>
                            <LogOut size={16} />
                            Sign Out ({user?.name})
                        </button>
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
