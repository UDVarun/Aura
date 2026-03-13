import type { LucideIcon } from "lucide-react";
import styles from "./AboutSections.module.css";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    details?: string[];
    meta?: string;
}

export function FeatureCard({ icon: Icon, title, description, details = [], meta }: FeatureCardProps) {
    return (
        <article className={styles.featureCard}>
            <div className={styles.cardAccent}>
                <Icon size={18} />
            </div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardText}>{description}</p>
            {details.length > 0 && (
                <div className={styles.benefitList}>
                    {details.map((detail) => (
                        <div key={detail} className={styles.listItem}>
                            <span className={styles.listDot} aria-hidden="true" />
                            <span>{detail}</span>
                        </div>
                    ))}
                </div>
            )}
            {meta && <p className={styles.featureMeta}>{meta}</p>}
        </article>
    );
}
