import { Braces, Cpu, Rocket } from "lucide-react";
import styles from "./AboutSections.module.css";

export function FounderProfile() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.sectionHeader}>
                    <span className={styles.eyebrow}>Founder</span>
                    <h2 className={styles.sectionTitle}>Built by an operator-minded product engineer.</h2>
                    <p className={styles.sectionLead}>
                        Aura is driven by a builder mentality: combine product quality, system design, and business
                        thinking into a marketplace that feels premium for users and dependable for operators.
                    </p>
                </div>

                <div className={styles.founderCard}>
                    <div className={styles.founderTop}>
                        <div className={styles.avatar}>V</div>
                        <div>
                            <h3 className={styles.founderName}>Varun</h3>
                            <p className={styles.founderRole}>Creator of Aura</p>
                        </div>
                    </div>

                    <p className={styles.founderBio}>
                        Varun is a software-focused product builder with a strong interest in systems, marketplace
                        workflows, and modern SaaS interfaces. Aura was created from the belief that marketplace
                        platforms should not force a tradeoff between elegant customer experience and serious operational
                        tooling.
                    </p>

                    <div className={styles.founderList}>
                        <div className={styles.listItem}>
                            <span className={styles.cardAccent}><Braces size={16} /></span>
                            <span>Background in modern frontend engineering and full-stack product development.</span>
                        </div>
                        <div className={styles.listItem}>
                            <span className={styles.cardAccent}><Cpu size={16} /></span>
                            <span>Focused on building reliable systems, automation-first workflows, and premium UI quality.</span>
                        </div>
                        <div className={styles.listItem}>
                            <span className={styles.cardAccent}><Rocket size={16} /></span>
                            <span>Building Aura as a long-term marketplace platform for trusted, scalable digital commerce.</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
