import { ShoppingBag, Store, Waypoints } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import styles from "./AboutSections.module.css";

const OVERVIEW = [
    {
        icon: ShoppingBag,
        title: "Customer experience",
        description:
            "Aura gives customers a curated, high-trust storefront with fast search, product discovery, reviews, support, and protected checkout journeys.",
        details: ["Clear discovery and product detail flows", "Support embedded into the buying journey", "Confidence through reviews, trust, and moderation"],
    },
    {
        icon: Store,
        title: "Vendor ecosystem",
        description:
            "Vendors operate storefronts, products, orders, and communications from one centralized workspace built for day-to-day execution.",
        details: ["Vendor-facing inventory and order management", "Operational workflows for support and communications", "A platform that helps vendors scale instead of adapt around friction"],
    },
    {
        icon: Waypoints,
        title: "Marketplace infrastructure",
        description:
            "Aura sits underneath the storefront as an operating layer with admin control, moderation systems, realtime data, and extensible workflows.",
        details: ["Admin visibility across the marketplace", "Realtime updates and scalable backend primitives", "Governance, protection, and platform-wide consistency"],
    },
];

export function PlatformOverview() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.sectionHeader}>
                    <span className={styles.eyebrow}>Platform overview</span>
                    <h2 className={styles.sectionTitle}>One marketplace, three coordinated experiences.</h2>
                    <p className={styles.sectionLead}>
                        Aura is intentionally designed as a connected system, not a disconnected set of pages. Every
                        role benefits from the same marketplace foundation.
                    </p>
                </div>

                <div className={styles.tripleGrid}>
                    {OVERVIEW.map((item) => (
                        <FeatureCard
                            key={item.title}
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            details={item.details}
                            meta="Structured for a premium, trustworthy marketplace experience."
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
