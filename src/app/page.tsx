import { redirect } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import { ProductCard, Product } from "@/components/ui/ProductCard";
import { HeroCarousel, Banner } from "@/components/ui/HeroCarousel";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";

const BANNERS: Banner[] = [
  {
    id: "b1",
    title: "The Sound of Perfection.",
    subtitle: "Experience studio-grade audio with our new flagship wireless headphones.",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1800&auto=format&fit=crop",
    linkText: "Shop Audio",
    linkHref: "/products?category=audio"
  },
  {
    id: "b2",
    title: "Elevate Your Workspace.",
    subtitle: "Precision-engineered mechanical keyboards & accessories for professionals.",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1800&auto=format&fit=crop",
    linkText: "Explore Tech",
    linkHref: "/products?category=tech"
  },
  {
    id: "b3",
    title: "Minimalist Living.",
    subtitle: "Curated decor that brings calm and modern elegance to any room.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1800&auto=format&fit=crop",
    linkText: "View Collection",
    linkHref: "/products?category=home"
  }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Sony WH-1000XM5 Wireless Noise Canceling",
    price: 29999.0,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
    isNew: true,
  },
  {
    id: "2",
    name: "Minimalist Mechanical Keyboard",
    price: 12999.99,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop",
    rating: 4.9,
  },
  {
    id: "3",
    name: "Aura Premium Smart Speaker",
    price: 18500.5,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=800&auto=format&fit=crop",
    rating: 4.6,
    isNew: true,
  },
  {
    id: "4",
    name: "Geometric Ceramic Table Lamp",
    price: 3450.0,
    category: "Home Decor",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    rating: 4.5,
  },
  {
    id: "5",
    name: "Matte Black Espresso Machine",
    price: 45999.0,
    category: "Kitchen",
    image: "https://images.unsplash.com/photo-1517246281007-cc1a9388c422?q=80&w=800&auto=format&fit=crop",
    rating: 4.9,
  },
  {
    id: "6",
    name: "Ergonomic Office Chair 2.0",
    price: 24999.0,
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=800&auto=format&fit=crop",
    rating: 4.7,
  }
];

const WHY_AURA = [
  {
    href: "/why-aura/curated-catalog",
    title: "Curated Premium Catalog",
    desc: "Every item is handpicked for quality, longevity, and refined design language.",
  },
  {
    href: "/why-aura/reliable-fulfillment",
    title: "Fast, Reliable Fulfillment",
    desc: "Operationally optimized dispatch with transparent delivery updates at each step.",
  },
  {
    href: "/customer-care",
    title: "Explore Customer Care",
    desc: "Access customer support, policy guidance, and direct help channels in one place.",
  },
  {
    href: "/why-aura/secure-transactions",
    title: "Secure Transactions",
    desc: "Encrypted payments, trusted gateways, and transparent billing policies for confidence.",
  },
];

const TRUST_POINTS = [
  { value: "48h", label: "Average Dispatch" },
  { value: "4.8/5", label: "Customer Rating" },
  { value: "Premium", label: "Curated Quality" },
];

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const code = typeof params.code === "string" ? params.code : undefined;

  if (code) {
    const callbackParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        callbackParams.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((entry) => callbackParams.append(key, entry));
      }
    }

    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return (
    <div className={styles.page}>
      {/* 1. Hero Carousel */}
      <HeroCarousel banners={BANNERS} />

      {/* 2. Deal Scroller */}
      <section className={styles.contentSection}>
        <HorizontalScroller
          title="Deal of the Day"
          subtitle="Limited time offers on premium tech."
        >
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={`deal-${product.id}`} product={product} />
          ))}
        </HorizontalScroller>
      </section>

      {/* 3. Why Aura */}
      <section className={`container ${styles.filterSection} ${styles.contentSection}`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Why Aura</span>
          <h2 className={styles.sectionTitle}>Built for a premium shopping experience.</h2>
          <p className={styles.sectionLead}>From product standards to delivery and support, every detail is designed to feel effortless and reliable.</p>
        </div>
        <div className={styles.featureGrid}>
          {WHY_AURA.map((item) => (
            <Link key={item.title} href={item.href} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{item.title}</h3>
              <p className={styles.featureText}>{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Second Scroller: Recommended */}
      <section className={styles.contentSection}>
        <HorizontalScroller
          title="Recommended for You"
          subtitle="Based on your browsing history."
        >
          {[...MOCK_PRODUCTS].reverse().map((product) => (
            <ProductCard key={`rec-${product.id}`} product={product} />
          ))}
        </HorizontalScroller>
      </section>

      <section className={`container ${styles.closing}`}>
        <div className={styles.closingPanel}>
          <h2 className={styles.closingTitle}>Crafted for professionals who value precision.</h2>
          <p className={styles.closingText}>From desktop to living room, every product in Aura is selected for quality, longevity, and timeless design language.</p>
          <div className={styles.trustRow}>
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className={styles.trustItem}>
                <span className={styles.trustValue}>{point.value}</span>
                <span className={styles.trustLabel}>{point.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.closingActions}>
            <Link href="/about" className={styles.secondaryButton}>Learn About Aura</Link>
            <Link href="/products" className={styles.primaryButton}>Explore Products</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
