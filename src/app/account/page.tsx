"use client";

import Link from "next/link";
import { LifeBuoy, MapPinHouse, Moon, Palette, ShoppingBag, Sun, User2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAccountData } from "@/context/AccountDataContext";
import { useTheme } from "@/context/ThemeContext";
import styles from "./page.module.css";

export default function AccountPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { profile, addresses, orders, isLoading: accountLoading } = useAccountData();
    const { theme, setTheme } = useTheme();

    if (isLoading || accountLoading) {
        return (
            <section className={styles.page}>
                <div className={`container ${styles.container}`}>
                    <div className={styles.card}>Loading your profile settings...</div>
                </div>
            </section>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <section className={styles.page}>
                <div className={`container ${styles.container}`}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Profile</h1>
                        <p className={styles.subtitle}>Sign in to manage account preferences and appearance.</p>
                        <Link href="/login" className={styles.cta}>
                            Go to Sign In
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <div className={`container ${styles.container}`}>
                <header className={styles.header}>
                    <span className={styles.kicker}>Account</span>
                    <h1 className={styles.title}>Profile</h1>
                    <p className={styles.subtitle}>Control your account details and visual theme preferences.</p>
                </header>

                <div className={styles.grid}>
                    <article className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <User2 size={18} />
                            Profile
                        </h2>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Name</span>
                            <span className={styles.value}>{user.name}</span>
                        </div>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Email</span>
                            <span className={styles.value}>{user.email}</span>
                        </div>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Role</span>
                            <span className={styles.badge}>{user.role}</span>
                        </div>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Phone</span>
                            <span className={styles.value}>{profile?.phone ?? "Not added yet"}</span>
                        </div>
                    </article>

                    <article className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <Palette size={18} />
                            Appearance
                        </h2>
                        <p className={styles.helpText}>Choose the mode that looks best for your environment.</p>

                        <div className={styles.toggleRow} role="radiogroup" aria-label="Theme mode">
                            <button
                                type="button"
                                className={theme === "light" ? `${styles.modeBtn} ${styles.modeBtnActive}` : styles.modeBtn}
                                onClick={() => setTheme("light")}
                                aria-pressed={theme === "light"}
                            >
                                <Sun size={16} />
                                Light
                            </button>
                            <button
                                type="button"
                                className={theme === "dark" ? `${styles.modeBtn} ${styles.modeBtnActive}` : styles.modeBtn}
                                onClick={() => setTheme("dark")}
                                aria-pressed={theme === "dark"}
                            >
                                <Moon size={16} />
                                Dark
                            </button>
                        </div>
                    </article>

                    <article className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <MapPinHouse size={18} />
                            Saved Addresses
                        </h2>
                        <p className={styles.helpText}>
                            Addresses are loaded from your account, so they follow you across devices after sign-in.
                        </p>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Saved addresses</span>
                            <span className={styles.value}>{addresses.length}</span>
                        </div>
                        {addresses.slice(0, 3).map((address) => (
                            <div key={address.id} className={styles.profileRow}>
                                <span className={styles.label}>{address.label}</span>
                                <span className={styles.value}>
                                    {address.city}, {address.state}
                                </span>
                            </div>
                        ))}
                    </article>

                    {user.role === "customer" && (
                        <article className={styles.card}>
                            <h2 className={styles.cardTitle}>
                                <ShoppingBag size={18} />
                                Orders
                            </h2>
                            <p className={styles.helpText}>
                                Recent purchases are restored from Supabase every time you sign in on a new device.
                            </p>
                            <div className={styles.profileRow}>
                                <span className={styles.label}>Recent orders</span>
                                <span className={styles.value}>{orders.length}</span>
                            </div>
                            {orders.slice(0, 3).map((order) => (
                                <div key={order.id} className={styles.profileRow}>
                                    <span className={styles.label}>{order.order_number}</span>
                                    <span className={styles.value}>{order.status}</span>
                                </div>
                            ))}
                        </article>
                    )}

                    {user.role === "customer" && (
                        <article className={styles.card}>
                            <h2 className={styles.cardTitle}>
                                <LifeBuoy size={18} />
                                Customer Care
                            </h2>
                            <p className={styles.helpText}>
                                Disputes, refunds, and seller issues stay linked to your account and order history.
                            </p>
                            <Link href="/customer-care" className={styles.modeBtn} style={{ marginTop: "1rem", textDecoration: "none" }}>
                                Open Customer Care
                            </Link>
                        </article>
                    )}
                </div>
            </div>
        </section>
    );
}
