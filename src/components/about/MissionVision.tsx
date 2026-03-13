import { Compass, Sparkles } from "lucide-react";
import styles from "./AboutSections.module.css";

export function MissionVision() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.sectionHeader}>
                    <span className={styles.eyebrow}>Mission and vision</span>
                    <h2 className={styles.sectionTitle}>Why Aura exists and where it is going.</h2>
                    <p className={styles.sectionLead}>
                        Aura was created to modernize marketplace commerce with better trust, better tooling, and a
                        better user experience for every role inside the system.
                    </p>
                </div>

                <div className={styles.splitGrid}>
                    <article className={styles.splitCard}>
                        <div className={styles.cardAccent}>
                            <Compass size={18} />
                        </div>
                        <h3 className={styles.cardTitle}>Mission</h3>
                        <p className={styles.cardText}>
                            Build a marketplace platform where discovery feels premium, vendor operations feel clear,
                            and platform governance feels dependable. Aura removes the friction between product
                            discovery, store management, and marketplace trust.
                        </p>
                        <div className={styles.benefitList}>
                            <div className={styles.listItem}><span className={styles.listDot} /><span>Make buying and selling feel seamless.</span></div>
                            <div className={styles.listItem}><span className={styles.listDot} /><span>Reduce platform complexity across every role.</span></div>
                            <div className={styles.listItem}><span className={styles.listDot} /><span>Create a trustworthy system, not just a catalog.</span></div>
                        </div>
                    </article>

                    <article className={styles.splitCard}>
                        <div className={styles.cardAccent}>
                            <Sparkles size={18} />
                        </div>
                        <h3 className={styles.cardTitle}>Vision</h3>
                        <p className={styles.cardText}>
                            Evolve Aura into a globally capable, AI-assisted commerce infrastructure layer where
                            independent vendors, curated brands, and marketplace operators can scale with confidence.
                        </p>
                        <div className={styles.benefitList}>
                            <div className={styles.listItem}><span className={styles.listDot} /><span>AI-guided marketplace operations and support.</span></div>
                            <div className={styles.listItem}><span className={styles.listDot} /><span>Smarter vendor tooling, analytics, and automation.</span></div>
                            <div className={styles.listItem}><span className={styles.listDot} /><span>A trusted marketplace ecosystem with global reach.</span></div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
