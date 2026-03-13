import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Store } from "lucide-react";
import styles from "./AboutSections.module.css";

const METRICS = [
    { value: "3 roles", label: "Customers, vendors, and operators on one system" },
    { value: "Realtime", label: "Live product, support, and marketplace activity" },
    { value: "AI-ready", label: "Automation-first workflows built into operations" },
    { value: "Global", label: "Designed for trusted cross-market commerce growth" },
];

export function HeroSection() {
    return (
        <section className={`${styles.section} ${styles.heroSection}`}>
            <div className="container">
                <div className={`${styles.sectionShell} ${styles.heroShell}`}>
                    <div className={`${styles.sectionContent} ${styles.heroContent}`}>
                        <div className={styles.heroGrid}>
                            <div className={styles.heroCopy}>
                                <span className={styles.eyebrow}>About Aura</span>
                                <h1 className={styles.heroTitle}>A modern marketplace operating system for trusted commerce.</h1>
                                <p className={styles.heroLead}>
                                    Aura is a premium marketplace platform designed to connect customers, vendors, and
                                    marketplace operators in one seamless commerce ecosystem. It blends storefront
                                    elegance, operational control, and platform trust into a single product experience.
                                </p>
                                <div className={styles.heroActions}>
                                    <Link href="/products" className={styles.ctaPrimary}>
                                        Explore Marketplace <ArrowRight size={16} />
                                    </Link>
                                    <Link href="/become-vendor" className={styles.ctaSecondary}>
                                        Become a Vendor
                                    </Link>
                                </div>
                            </div>

                            <div className={styles.heroPanel}>
                                <div className={styles.heroPanelTop}>
                                    <div>
                                        <p className={styles.heroPanelKicker}>Platform snapshot</p>
                                        <h2 className={styles.heroPanelTitle}>Designed for scale, trust, and velocity.</h2>
                                    </div>
                                    <span className={styles.heroTag}>Built for high-growth commerce</span>
                                </div>
                                <p className={styles.heroPanelText}>
                                    Aura gives customers a refined buying experience, gives vendors a serious operating
                                    system, and gives admins the controls required to run a healthy marketplace.
                                </p>
                                <div className={styles.metricGrid}>
                                    {METRICS.map((metric) => (
                                        <div key={metric.label} className={styles.metricCard}>
                                            <span className={styles.metricValue}>{metric.value}</span>
                                            <span className={styles.metricLabel}>{metric.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.stackNote}>
                                    <Store size={15} />
                                    <span>Multi-vendor commerce</span>
                                    <ShieldCheck size={15} />
                                    <span>Platform trust</span>
                                    <Building2 size={15} />
                                    <span>Operational control</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
