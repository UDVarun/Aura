import { Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";
import styles from "./AboutSections.module.css";

const TRUST_ITEMS = [
    {
        icon: ShieldCheck,
        title: "Marketplace trust",
        description:
            "Aura is designed around customer confidence with moderation systems, platform oversight, and safer buying flows.",
    },
    {
        icon: LockKeyhole,
        title: "Secure authentication",
        description:
            "Authentication and account handling are backed by secure infrastructure patterns built for modern web applications.",
    },
    {
        icon: Fingerprint,
        title: "Protection systems",
        description:
            "Vendor verification, customer protection workflows, and admin controls help keep the ecosystem safe and credible.",
    },
];

export function TrustSecurity() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.sectionShell}>
                    <div className={styles.sectionContent}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.eyebrow}>Trust and security</span>
                            <h2 className={styles.sectionTitle}>Built to earn confidence at every step.</h2>
                            <p className={styles.sectionLead}>
                                Trust is not a marketing layer on Aura. It is part of the system design, from account
                                security and operations to customer protection and vendor accountability.
                            </p>
                        </div>

                        <div className={styles.securityGrid}>
                            {TRUST_ITEMS.map((item) => (
                                <article key={item.title} className={styles.securityCard}>
                                    <div className={styles.cardAccent}>
                                        <item.icon size={18} />
                                    </div>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <p className={styles.cardText}>{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
