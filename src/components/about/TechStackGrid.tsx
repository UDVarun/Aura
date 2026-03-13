import { Bot, DatabaseZap, Globe, Lock, Rocket, Server } from "lucide-react";
import styles from "./AboutSections.module.css";

const STACK = [
    { mark: "N", name: "Next.js", text: "App Router architecture for fast navigation, server rendering, and clean routing across the platform." },
    { mark: "R", name: "React", text: "Composable UI architecture that keeps customer, vendor, and admin experiences responsive and maintainable." },
    { mark: "TS", name: "TypeScript", text: "Strong typing across frontend and backend boundaries for safer scaling and better product quality." },
    { mark: "S", name: "Supabase", text: "Authentication, database, storage, and realtime infrastructure powering modern marketplace workflows." },
    { mark: "V", name: "Vercel", text: "Fast global deployment and edge-ready delivery for a polished production-grade experience." },
    { mark: "AI", name: "AI automation", text: "Workflow automation and AI-assisted support systems designed to improve platform operations over time." },
];

const PRINCIPLES = [
    { icon: Rocket, label: "Fast performance" },
    { icon: Lock, label: "Secure systems" },
    { icon: Server, label: "Scalable infrastructure" },
    { icon: DatabaseZap, label: "Realtime operational visibility" },
    { icon: Globe, label: "Cloud-native delivery" },
    { icon: Bot, label: "Automation-ready workflows" },
];

export function TechStackGrid() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.sectionShell}>
                    <div className={styles.sectionContent}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.eyebrow}>Technology stack</span>
                            <h2 className={styles.sectionTitle}>Built on modern infrastructure from day one.</h2>
                            <p className={styles.sectionLead}>
                                Aura is engineered as a fast, secure, and scalable SaaS-grade platform with a product
                                stack chosen for reliability, velocity, and long-term extensibility.
                            </p>
                        </div>

                        <div className={styles.techGrid}>
                            {STACK.map((item) => (
                                <article key={item.name} className={styles.techCard}>
                                    <div className={styles.techIcon}>{item.mark}</div>
                                    <h3 className={styles.techName}>{item.name}</h3>
                                    <p className={styles.techText}>{item.text}</p>
                                </article>
                            ))}
                        </div>

                        <div className={styles.futureList}>
                            {PRINCIPLES.map(({ icon: Icon, label }) => (
                                <div key={label} className={styles.listItem}>
                                    <span className={styles.cardAccent}><Icon size={16} /></span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
