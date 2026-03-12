import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { createServerSupabase } from "@/lib/supabase/server";
import { parsePriceValue } from "@/lib/currency";
import { ProductCard, Product } from "@/components/ui/ProductCard";
import { HeroCarousel, Banner } from "@/components/ui/HeroCarousel";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";

export const revalidate = 300;

const BANNERS: Banner[] = [
  {
    id: "b1",
    eyebrow: "Flagship Audio",
    title: "The Sound of Perfection.",
    subtitle: "Experience studio-grade audio with our new flagship wireless headphones.",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1800&auto=format&fit=crop",
    linkText: "Shop Audio",
    linkHref: "/products?category=audio",
    caption: "Top-rated listening gear",
  },
  {
    id: "b2",
    eyebrow: "Workspace Essentials",
    title: "Elevate Your Workspace.",
    subtitle: "Precision-engineered mechanical keyboards and accessories for professionals.",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1800&auto=format&fit=crop",
    linkText: "Explore Tech",
    linkHref: "/products?category=tech",
    caption: "Designed for focus",
  },
  {
    id: "b3",
    eyebrow: "Modern Living",
    title: "Minimalist Living.",
    subtitle: "Curated decor that brings calm and modern elegance to any room.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1800&auto=format&fit=crop",
    linkText: "View Collection",
    linkHref: "/products?category=home",
    caption: "Refined interiors, simplified",
  },
];

const SHOPPING_PILLARS = [
  {
    title: "Curated brands",
    text: "Every collection is tighter, cleaner, and easier to trust than a generic marketplace grid.",
  },
  {
    title: "Fast browsing",
    text: "Focused sections and stronger hierarchy help customers reach products faster.",
  },
  {
    title: "Confident checkout",
    text: "Professional visuals and cleaner product presentation build trust from first impression.",
  },
];

const QUICK_CATEGORIES = [
  { label: "Audio", href: "/products?category=audio" },
  { label: "Tech", href: "/products?category=tech" },
  { label: "Home", href: "/products?category=home" },
  { label: "Accessories", href: "/products?category=accessories" },
];
const TRUST_POINTS = [
  { value: "48h", label: "Average Dispatch" },
  { value: "4.8/5", label: "Customer Rating" },
  { value: "Premium", label: "Curated Quality" },
];

const COLLECTIONS = [
  {
    title: "Executive Tech",
    description: "Performance-first devices, clean silhouettes, and daily essentials for focused work.",
    href: "/products?category=tech",
  },
  {
    title: "Refined Living",
    description: "Home pieces selected for texture, balance, and long-term visual consistency.",
    href: "/products?category=home",
  },
  {
    title: "Quiet Luxury Audio",
    description: "Immersive sound systems and headphones with premium acoustics and understated design.",
    href: "/products?category=audio",
  },
  {
    title: "Designer Accessories",
    description: "Portable, polished accessories designed to elevate everyday carrying, work, and travel.",
    href: "/products?category=accessories",
  },
];

const WHY_AURA = [
  {
    href: "/why-aura/curated-catalog",
    title: "Curated Premium Catalog",
    desc: "Every item is selected for better quality, stronger styling, and a more consistent storefront experience.",
  },
  {
    href: "/why-aura/reliable-fulfillment",
    title: "Fast, Reliable Fulfillment",
    desc: "Operationally optimized dispatch with clearer delivery expectations and customer confidence.",
  },
  {
    href: "/customer-care",
    title: "Customer Care That Feels Professional",
    desc: "Support, policy guidance, and help channels are easier to reach and easier to trust.",
  },
  {
    href: "/why-aura/secure-transactions",
    title: "Secure Transactions",
    desc: "Encrypted payments and clean checkout communication create a safer purchase journey.",
  },
];

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type ProductRow = {
  id: string;
  title: string;
  price: string | number | null;
  image_url: string | null;
  rating: number | null;
  is_featured: boolean | null;
  categories: { name?: string | null; slug?: string | null } | { name?: string | null; slug?: string | null }[] | null;
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

  const supabase = await createServerSupabase();
  const { data: dbProducts } = await supabase
    .from("products")
    .select("id, title, price, image_url, rating, is_featured, categories(name, slug)")
    .order("created_at", { ascending: false })
    .limit(12);

  const products: Product[] = ((dbProducts as ProductRow[] | null) || []).map((p) => ({
    id: p.id,
    name: p.title,
    price: parsePriceValue(p.price),
    image: p.image_url || "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=800&auto=format&fit=crop",
    category: (Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name) || "Marketplace",
    rating: p.rating || 4.5,
    is_featured: p.is_featured ?? false,
  }));

  const featuredProducts = products.filter((p) => p.is_featured);
  const dealProducts = products.slice(0, 8);
  const recProducts = products.slice(4, 12);
  const featuredRail = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroShell}`}>
          <div className={styles.heroFrame}>
            <HeroCarousel banners={BANNERS} />
          </div>
        </div>
        <div className={`container ${styles.heroSupportRow}`}>
          <div className={styles.quickCategoryRow}>
            {QUICK_CATEGORIES.map((item) => (
              <Link key={item.label} href={item.href} className={styles.quickCategoryChip}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.heroStats}>
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className={styles.heroStat}>
                <span className={styles.heroStatValue}>{point.value}</span>
                <span className={styles.heroStatLabel}>{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`container ${styles.assuranceSection}`}>
        <div className={styles.assuranceBar}>
          {SHOPPING_PILLARS.map((pillar) => (
            <div key={pillar.title} className={styles.assuranceItem}>
              <h3 className={styles.assuranceTitle}>{pillar.title}</h3>
              <p className={styles.assuranceText}>{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`container ${styles.collectionsSection}`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Shop by collection</span>
          <h2 className={styles.sectionTitle}>Premium categories that feel organised, elegant, and easy to browse.</h2>
          <p className={styles.sectionLead}>
            Better structure helps the website feel more like a real premium store and less like a generic product grid.
          </p>
        </div>
        <div className={styles.collectionGrid}>
          {COLLECTIONS.map((collection) => (
            <Link key={collection.title} href={collection.href} className={styles.collectionCard}>
              <span className={styles.collectionLabel}>Collection</span>
              <h3 className={styles.collectionTitle}>{collection.title}</h3>
              <p className={styles.collectionText}>{collection.description}</p>
              <span className={styles.collectionCta}>Shop collection</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.contentSection}>
        <HorizontalScroller
          title="Featured Products"
          subtitle="Premium picks presented with better alignment, cleaner spacing, and stronger retail styling."
        >
          {featuredRail.map((product) => (
            <ProductCard key={`featured-${product.id}`} product={product} />
          ))}
        </HorizontalScroller>
      </section>

      <section className={styles.contentSection}>
        <HorizontalScroller
          title="Deal of the Day"
          subtitle="High-value offers designed to stand out without cluttering the storefront."
        >
          {(dealProducts.length > 0 ? dealProducts : featuredRail).map((product) => (
            <ProductCard key={`deal-${product.id}`} product={product} />
          ))}
        </HorizontalScroller>
      </section>

      <section className={`container ${styles.filterSection} ${styles.contentSection}`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Why Aura</span>
          <h2 className={styles.sectionTitle}>A professional e-commerce experience from homepage to checkout.</h2>
          <p className={styles.sectionLead}>Every section is designed to look premium, communicate trust, and help users shop faster.</p>
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

      <section className={styles.contentSection}>
        <HorizontalScroller
          title="Recommended for You"
          subtitle="A more store-ready recommendation section with stronger product emphasis."
        >
          {(recProducts.length > 0 ? recProducts : featuredRail).map((product) => (
            <ProductCard key={`rec-${product.id}`} product={product} />
          ))}
        </HorizontalScroller>
      </section>

      <section className={`container ${styles.closing}`}>
        <div className={styles.closingPanel}>
          <h2 className={styles.closingTitle}>Built to feel like a premium retail brand, not a template.</h2>
          <p className={styles.closingText}>Sharper cards, stronger hero merchandising, and a cleaner layout make your storefront feel more professional and conversion-ready.</p>
          <div className={styles.trustRow}>
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className={styles.trustItem}>
                <span className={styles.trustValue}>{point.value}</span>
                <span className={styles.trustLabel}>{point.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.closingActions}>
            <Link href="/about" className={styles.secondaryButton}>About Aura</Link>
            <Link href="/products" className={styles.primaryButton}>Explore Catalog</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
