import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Gift, Zap, TicketPercent } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Offers | Aura",
  description: "Discover latest Aura offers, bundles, and member-only deals.",
};

const OFFER_CARDS = [
  {
    title: "New Member Welcome",
    description: "Get 15% off your first order with Aura account signup.",
    code: "WELCOME15",
    Icon: Sparkles,
  },
  {
    title: "Premium Audio Week",
    description: "Up to 25% off curated headphones, speakers, and accessories.",
    code: "AUDIO25",
    Icon: Zap,
  },
  {
    title: "Home Upgrade Bundle",
    description: "Save extra 10% when you buy 3 or more home products.",
    code: "HOMESET10",
    Icon: Gift,
  },
];

const FLASH_DEALS = [
  { label: "Wireless Headphones", discount: "20% OFF", until: "Ends Sunday" },
  { label: "Mechanical Keyboards", discount: "18% OFF", until: "Ends in 2 days" },
  { label: "Desk and Workspace", discount: "12% OFF", until: "Ends this week" },
  { label: "Selected Decor", discount: "30% OFF", until: "Limited stock" },
];

export default function OffersPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <span className={styles.badge}>Aura Offers</span>
          <h1 className={styles.title}>Smart savings on premium products.</h1>
          <p className={styles.subtitle}>
            Explore limited-time offers, member benefits, and bundle discounts curated for professionals.
          </p>
          <div className={styles.heroActions}>
            <Link href="/products" className="btn btn-primary">Shop Deals</Link>
            <Link href="/register" className={`btn ${styles.secondaryBtn}`}>Join and Save</Link>
          </div>
        </div>
      </section>

      <section className={styles.offerSection}>
        <div className={`container ${styles.offerGrid}`}>
          {OFFER_CARDS.map(({ title, description, code, Icon }) => (
            <article key={title} className={styles.offerCard}>
              <div className={styles.offerIcon}><Icon size={18} /></div>
              <h2>{title}</h2>
              <p>{description}</p>
              <div className={styles.codeChip}>
                <TicketPercent size={14} />
                {code}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.flashSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Flash Deals</h2>
            <p>Updated daily with curated markdowns.</p>
          </div>
          <div className={styles.flashGrid}>
            {FLASH_DEALS.map((deal) => (
              <article key={deal.label} className={styles.flashCard}>
                <p className={styles.flashLabel}>{deal.label}</p>
                <p className={styles.flashDiscount}>{deal.discount}</p>
                <p className={styles.flashUntil}>{deal.until}</p>
                <Link href="/products" className={styles.flashLink}>View Deal</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
