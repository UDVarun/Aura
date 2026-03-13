import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./AboutSections.module.css";

const FUTURE_POINTS = [
    "A globally capable marketplace ecosystem with stronger vendor growth tooling.",
    "AI-driven support, automation, and analytics embedded into day-to-day operations.",
    "Deeper operator visibility across trust, moderation, and marketplace performance.",
    "Smarter infrastructure for commerce workflows that continue to scale with the business.",
];

export function FutureVision() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.futureCard}>
                    <span className={styles.eyebrow}>Future vision</span>
                    <h2 className={styles.futureQuote}>
                        Aura is being shaped into a commerce platform where discovery, operations, and intelligence work together.
                    </h2>
                    <p className={styles.sectionLead}>
                        The goal is not only to run a marketplace well today, but to build the platform layer that can
                        support smarter vendor tooling, AI-native workflows, and a more scalable global ecosystem tomorrow.
                    </p>

                    <div className={styles.futureList}>
                        {FUTURE_POINTS.map((point) => (
                            <div key={point} className={styles.listItem}>
                                <span className={styles.listDot} aria-hidden="true" />
                                <span>{point}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.heroActions}>
                        <Link href="/products" className={styles.ctaPrimary}>
                            Explore Aura <ArrowRight size={16} />
                        </Link>
                        <Link href="/become-vendor" className={styles.ctaSecondary}>
                            Build on the platform
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
