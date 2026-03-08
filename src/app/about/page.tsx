import type { Metadata } from "next";
import styles from "./page.module.css";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About Us | Aura",
    description:
        "Learn about Aura — our story, mission, values, and the team behind the premium e-commerce experience.",
};

const STATS = [
    { value: "2M+", label: "Happy Customers" },
    { value: "150+", label: "Countries Served" },
    { value: "50K+", label: "Products Listed" },
    { value: "98%", label: "Satisfaction Rate" },
];

const VALUES = [
    {
        icon: "✦",
        title: "Quality First",
        desc: "Every product is vetted by our curation team. We only list items we'd proudly use ourselves.",
    },
    {
        icon: "⚡",
        title: "Lightning Fast",
        desc: "From browsing to doorstep — our streamlined supply chain delivers most orders within 48 hours.",
    },
    {
        icon: "🔐",
        title: "Privacy & Security",
        desc: "Your data is yours. We use industry-leading encryption and never sell personal information.",
    },
    {
        icon: "🌿",
        title: "Sustainability",
        desc: "We partner only with vendors who meet our environmental standards and fair-labour practices.",
    },
    {
        icon: "🤝",
        title: "Vendor Success",
        desc: "Aura is built for vendors too — fair commissions, real-time analytics, and dedicated support.",
    },
    {
        icon: "♾",
        title: "Always Improving",
        desc: "Weekly releases, user-driven features, and a 24/7 support team committed to getting better.",
    },
];

const TEAM = [
    { name: "Sophia Reyes", role: "Founder & CEO", initials: "SR", color: "#6366f1" },
    { name: "Marcus Chen", role: "Chief Technology Officer", initials: "MC", color: "#8b5cf6" },
    { name: "Aisha Patel", role: "Head of Design", initials: "AP", color: "#ec4899" },
    { name: "Jordan Williams", role: "Head of Vendor Relations", initials: "JW", color: "#14b8a6" },
];

export default function AboutPage() {
    return (
        <main className={styles.page}>
            {/* ── Hero ─────────────────────────────────────────────────────────── */}
            <section className={styles.hero}>
                <div className={`container ${styles.heroInner}`}>
                    <span className={styles.badge}>Our Story</span>
                    <h1 className={styles.heroTitle}>
                        Shopping, <span className={styles.gradient}>reimagined</span>.
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Aura started with a simple belief: buying something beautiful online should feel
                        just as good as finding it in your favourite boutique. We are building the
                        platform that makes that real — for every customer, every vendor, everywhere.
                    </p>
                    <div className={styles.heroCta}>
                        <Link href="/products" className="btn btn-primary">
                            Explore Products
                        </Link>
                        <Link href="/register" className={`btn ${styles.btnOutline}`}>
                            Join Aura
                        </Link>
                    </div>
                </div>
                <div className={styles.heroOrb1} aria-hidden="true" />
                <div className={styles.heroOrb2} aria-hidden="true" />
            </section>

            {/* ── Stats ────────────────────────────────────────────────────────── */}
            <section className={styles.statsSection}>
                <div className={`container ${styles.statsGrid}`}>
                    {STATS.map(({ value, label }) => (
                        <div key={label} className={styles.statCard}>
                            <span className={styles.statValue}>{value}</span>
                            <span className={styles.statLabel}>{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Mission ──────────────────────────────────────────────────────── */}
            <section className={styles.missionSection}>
                <div className={`container ${styles.missionGrid}`}>
                    <div className={styles.missionText}>
                        <span className={styles.badge}>Our Mission</span>
                        <h2 className={styles.sectionTitle}>
                            Empowering buyers and builders alike
                        </h2>
                        <p className={styles.bodyText}>
                            We believe commerce works best when it is fair, transparent, and human.
                            Aura connects discerning shoppers with independent vendors across the globe —
                            removing the barriers of geography, logistics, and trust.
                        </p>
                        <p className={styles.bodyText}>
                            Our platform gives vendors the tools to grow their business, while giving
                            customers the confidence to shop freely. Every purchase on Aura supports
                            an independent seller, not a faceless warehouse.
                        </p>
                    </div>
                    <div className={styles.missionVisual}>
                        <div className={styles.visualCard}>
                            <div className={styles.visualInner}>
                                <div className={styles.visualStat}>
                                    <span className={styles.visualNum}>2019</span>
                                    <span className={styles.visualCaption}>Founded</span>
                                </div>
                                <div className={styles.visualDivider} />
                                <div className={styles.visualStat}>
                                    <span className={styles.visualNum}>5⭐</span>
                                    <span className={styles.visualCaption}>App Store Rating</span>
                                </div>
                                <div className={styles.visualDivider} />
                                <div className={styles.visualStat}>
                                    <span className={styles.visualNum}>12K+</span>
                                    <span className={styles.visualCaption}>Active Vendors</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Values ───────────────────────────────────────────────────────── */}
            <section className={styles.valuesSection}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <span className={styles.badge}>What We Stand For</span>
                        <h2 className={styles.sectionTitle}>Our values, in action</h2>
                    </div>
                    <div className={styles.valuesGrid}>
                        {VALUES.map(({ icon, title, desc }) => (
                            <div key={title} className={styles.valueCard}>
                                <div className={styles.valueIcon}>{icon}</div>
                                <h3 className={styles.valueTitle}>{title}</h3>
                                <p className={styles.valueDesc}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Team ─────────────────────────────────────────────────────────── */}
            <section className={styles.teamSection}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <span className={styles.badge}>The People</span>
                        <h2 className={styles.sectionTitle}>Meet the team</h2>
                        <p className={styles.sectionSubtitle}>
                            A diverse group of builders, designers, and dreamers united by one goal.
                        </p>
                    </div>
                    <div className={styles.teamGrid}>
                        {TEAM.map(({ name, role, initials, color }) => (
                            <div key={name} className={styles.teamCard}>
                                <div className={styles.teamAvatar} style={{ background: color }}>
                                    {initials}
                                </div>
                                <h3 className={styles.teamName}>{name}</h3>
                                <p className={styles.teamRole}>{role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────────── */}
            <section className={styles.ctaSection}>
                <div className={`container ${styles.ctaInner}`}>
                    <h2 className={styles.ctaTitle}>Ready to experience Aura?</h2>
                    <p className={styles.ctaSubtitle}>
                        Join millions of shoppers and thousands of vendors on the platform built for everyone.
                    </p>
                    <div className={styles.ctaButtons}>
                        <Link href="/register" className="btn btn-primary">
                            Create Free Account
                        </Link>
                        <Link href="/products" className={`btn ${styles.btnOutline}`}>
                            Start Shopping
                        </Link>
                    </div>
                </div>
                <div className={styles.ctaOrb} aria-hidden="true" />
            </section>
        </main>
    );
}
