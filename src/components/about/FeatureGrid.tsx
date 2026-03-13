import { Activity, BadgeCheck, CreditCard, Headset, LayoutDashboard, MessagesSquare } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import styles from "./AboutSections.module.css";

const FEATURES = [
    {
        icon: Headset,
        title: "AI-powered support system",
        description: "Support flows are structured to evolve into automation-first resolution and intelligent assistance.",
        details: ["Guided support creation", "Operator visibility", "Faster resolution handling"],
    },
    {
        icon: LayoutDashboard,
        title: "Multi-vendor marketplace",
        description: "Vendors get serious operational tools for products, orders, storefront presence, and communications.",
        details: ["Vendor product workflows", "Order lifecycle visibility", "Centralized operating surfaces"],
    },
    {
        icon: CreditCard,
        title: "Secure commerce systems",
        description: "Aura is designed around safe checkout, protected platform interactions, and trust-first user flows.",
        details: ["Protected account access", "Trust-conscious transaction flows", "Operational controls around platform actions"],
    },
    {
        icon: MessagesSquare,
        title: "Realtime communication",
        description: "Customers, vendors, and operators can interact through live marketplace workflows with better continuity.",
        details: ["Realtime updates", "Case and communication visibility", "Reduced operational lag"],
    },
    {
        icon: Activity,
        title: "Vendor and admin dashboards",
        description: "Dedicated dashboards turn Aura into a control surface, not just a storefront interface.",
        details: ["Role-specific operational views", "Administrative controls", "Centralized monitoring"],
    },
    {
        icon: BadgeCheck,
        title: "Moderation and trust tooling",
        description: "Aura includes product, review, and vendor oversight so the marketplace stays healthy as it scales.",
        details: ["Review moderation", "Vendor oversight", "Customer protection systems"],
    },
];

export function FeatureGrid() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.sectionHeader}>
                    <span className={styles.eyebrow}>Key features</span>
                    <h2 className={styles.sectionTitle}>The capabilities that make Aura different.</h2>
                    <p className={styles.sectionLead}>
                        Aura combines storefront polish with platform-grade tooling, so the marketplace can feel elegant
                        on the surface and robust underneath.
                    </p>
                </div>

                <div className={styles.featureGrid}>
                    {FEATURES.map((feature) => (
                        <FeatureCard
                            key={feature.title}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            details={feature.details}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
