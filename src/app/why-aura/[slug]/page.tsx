import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

const WHY_AURA_CONTENT: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    highlights: string[];
    pillars: { title: string; desc: string }[];
    commitments: string[];
    faq: { q: string; a: string }[];
    summary: string;
  }
> = {
  "curated-catalog": {
    eyebrow: "Curated Premium Catalog",
    title: "Selected with intent, not volume.",
    intro:
      "Aura's catalog is intentionally compact and quality-driven. We prioritize products with long-term value, reliable materials, and timeless design language.",
    highlights: [
      "Strict quality and performance checks before listing.",
      "Balanced assortment across tech, home, and lifestyle.",
      "Design consistency so products feel cohesive together.",
    ],
    pillars: [
      {
        title: "Product Vetting",
        desc: "Each item goes through quality, reliability, and serviceability checks before approval.",
      },
      {
        title: "Brand Alignment",
        desc: "We partner with brands that match our standards for durability and design consistency.",
      },
      {
        title: "Assortment Discipline",
        desc: "We prioritize relevance over catalog size, reducing clutter and improving discovery.",
      },
    ],
    commitments: [
      "Clear product specs and practical comparison criteria.",
      "Consistent stock quality across repeat orders.",
      "Continuous catalog audits based on customer feedback.",
    ],
    faq: [
      {
        q: "How do you decide which products are listed?",
        a: "Products are evaluated on quality, reliability, supplier credibility, and long-term customer value.",
      },
      {
        q: "Do you remove products over time?",
        a: "Yes. Underperforming or inconsistent items are phased out to maintain catalog quality.",
      },
    ],
    summary:
      "The result is a catalog that helps customers buy better, faster, and with more confidence.",
  },
  "reliable-fulfillment": {
    eyebrow: "Fast, Reliable Fulfillment",
    title: "Speed with operational discipline.",
    intro:
      "From order confirmation to doorstep delivery, fulfillment is built around predictable timelines and transparent updates.",
    highlights: [
      "Optimized dispatch workflows to reduce handling delays.",
      "Real-time status visibility at every shipping milestone.",
      "Reliable logistics routing for consistent delivery performance.",
    ],
    pillars: [
      {
        title: "Dispatch Precision",
        desc: "Order batching and warehouse checks are designed to reduce processing delays.",
      },
      {
        title: "Tracking Transparency",
        desc: "Customers receive clear updates from order confirmation to last-mile delivery.",
      },
      {
        title: "Logistics Reliability",
        desc: "Courier allocation is optimized for delivery stability and reduced exception rates.",
      },
    ],
    commitments: [
      "Predictable dispatch windows for eligible products.",
      "Proactive communication for delays or address exceptions.",
      "Structured post-delivery support for unresolved shipments.",
    ],
    faq: [
      {
        q: "Can I track my order after checkout?",
        a: "Yes. Tracking updates are shared once the order is processed and handed to the carrier.",
      },
      {
        q: "What happens if a shipment is delayed?",
        a: "Our team monitors exceptions and provides updates with revised delivery expectations.",
      },
    ],
    summary:
      "Customers get fewer surprises, faster delivery, and a smoother post-purchase experience.",
  },
  "expert-customer-care": {
    eyebrow: "Expert Customer Care",
    title: "Support that understands context.",
    intro:
      "Our support model focuses on informed guidance, not scripted replies. Customers get clear help for orders, returns, and product decisions.",
    highlights: [
      "Human-first assistance with practical recommendations.",
      "Faster resolution for shipping and return concerns.",
      "Consistent communication across channels and touchpoints.",
    ],
    pillars: [
      {
        title: "Context-Aware Support",
        desc: "Our agents review order history and issue context before proposing a solution.",
      },
      {
        title: "Resolution Ownership",
        desc: "Cases are followed through to closure with clear updates and next steps.",
      },
      {
        title: "Decision Guidance",
        desc: "Customers get practical recommendations, not generic responses.",
      },
    ],
    commitments: [
      "Clear timelines for return, refund, and exchange requests.",
      "Transparent communication on policy and order changes.",
      "Consistent service quality across all support channels.",
    ],
    faq: [
      {
        q: "Do I speak to a real specialist?",
        a: "Yes. Support requests are handled by trained specialists for product and order workflows.",
      },
      {
        q: "Can support help with product selection?",
        a: "Yes. Our team can recommend options based on your use case, budget, and priorities.",
      },
    ],
    summary:
      "That means less friction, clearer decisions, and a stronger trust relationship with the brand.",
  },
  "secure-transactions": {
    eyebrow: "Secure Transactions",
    title: "Built for trust at every payment step.",
    intro:
      "Payment reliability is core to our platform. We combine secure processing, clear policies, and compliant workflows to protect customer confidence.",
    highlights: [
      "Encrypted checkout with trusted payment infrastructure.",
      "Transparent billing and refund policy communication.",
      "Fraud-aware verification for transaction integrity.",
    ],
    pillars: [
      {
        title: "Checkout Security",
        desc: "Transactions are processed through secure channels with modern encryption practices.",
      },
      {
        title: "Policy Transparency",
        desc: "Billing, cancellations, and refunds are communicated in clear, understandable terms.",
      },
      {
        title: "Risk Monitoring",
        desc: "We monitor transaction patterns to reduce fraud and protect both customers and merchants.",
      },
    ],
    commitments: [
      "No hidden charges in checkout flow.",
      "Clear refund eligibility and processing timelines.",
      "Prompt support for payment-related issues.",
    ],
    faq: [
      {
        q: "Are my payment details stored securely?",
        a: "Sensitive payment data is handled through secure payment infrastructure and protection controls.",
      },
      {
        q: "How are refunds handled?",
        a: "Eligible refunds are processed according to policy with timeline visibility from initiation to completion.",
      },
    ],
    summary:
      "Customers can complete purchases confidently, with clear policy expectations and secure transaction handling.",
  },
};

export default async function WhyAuraDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = WHY_AURA_CONTENT[slug];

  if (!content) notFound();

  return (
    <main className={styles.page}>
      <section className={`container ${styles.hero}`}>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.intro}>{content.intro}</p>
      </section>

      <section className={`container ${styles.body}`}>
        <div className={styles.panel}>
          <section className={styles.blockHighlights}>
            <h2 className={styles.panelTitle}>What This Means in Practice</h2>
            <ul className={styles.list}>
              {content.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.blockPillars}>
            <h2 className={styles.subTitle}>Operational Pillars</h2>
            <div className={styles.pillarGrid}>
              {content.pillars.map((pillar) => (
                <article key={pillar.title} className={styles.pillarCard}>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.blockCommitments}>
            <h2 className={styles.subTitle}>Service Commitments</h2>
            <ul className={styles.commitmentList}>
              {content.commitments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.blockFaq}>
            <h2 className={styles.subTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqGrid}>
              {content.faq.map((item) => (
                <article key={item.q} className={styles.faqCard}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <p className={styles.summary}>{content.summary}</p>
          <div className={styles.actions}>
            <Link href="/products" className={styles.primaryAction}>
              Explore Products
            </Link>
            <Link href="/" className={styles.secondaryAction}>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
