import styles from "./page.module.css";
import Link from "next/link";
import { ProductCard, Product } from "@/components/ui/ProductCard";

// Mock Data
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    price: 398.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
    isNew: true
  },
  {
    id: "2",
    name: "Minimalist Mechanical Keyboard with Custom Switches",
    price: 159.99,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop",
    rating: 4.9
  },
  {
    id: "3",
    name: "Aura Premium Smart Home Speaker",
    price: 249.50,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=800&auto=format&fit=crop",
    rating: 4.6,
    isNew: true
  },
  {
    id: "4",
    name: "Geometric Ceramic Table Lamp",
    price: 89.00,
    category: "Home Decor",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    rating: 4.5
  }
];

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          <h1 className={styles.heroTitle}>
            Elevate Your <span className={styles.highlight}>Lifestyle</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover our curated collection of premium products designed to enhance your everyday experience.
          </p>
          <div className={styles.heroActions}>
            <Link href="/products" className={styles.primaryButton}>
              Shop Now
            </Link>
            <Link href="/collections" className={styles.secondaryButton}>
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      <section className={`container ${styles.featured}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Products</h2>
          <Link href="/products" className={styles.viewAllLink}>
            View All Collection
          </Link>
        </div>

        <div className={styles.productGrid}>
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Adding a lifestyle banner section for visual appeal */}
      <section className={styles.lifestyleBanner}>
        <div className={`container ${styles.bannerContent}`}>
          <h2 className={styles.bannerTitle}>Designed for the Modern Home</h2>
          <p className={styles.bannerText}>
            Our expertly crafted essentials combine form and function to create harmony in your living space.
          </p>
          <Link href="/categories/home" className={styles.primaryButton}>
            Shop Home & Living
          </Link>
        </div>
      </section>
    </div>
  );
}
