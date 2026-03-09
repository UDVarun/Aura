"use client";

import Link from "next/link";
import { Moon, Palette, Sun, User2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import styles from "./page.module.css";

export default function AccountPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { theme, setTheme } = useTheme();

    if (isLoading) {
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
                </div>
            </div>
        </section>
    );
}
