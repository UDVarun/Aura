"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Check, SlidersHorizontal, X } from "lucide-react";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";
import { useMemo, useState, useEffect, Suspense } from "react";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { formatCurrency, INR_SYMBOL, parsePriceValue } from "@/lib/currency";

const BRANDS = ["Sony", "Aura", "Logitech", "Herman Miller", "Apple"];

const shortNumberFormatter = new Intl.NumberFormat("en-IN");
const formatShortCurrency = (value: number) => `${INR_SYMBOL}${shortNumberFormatter.format(value)}`;

type PriceFilterOption = "all" | "under5000" | "5000to15000" | "above15000";

interface CategoryRow {
  id: string;
  name: string;
  slug: string | null;
}

interface ProductRow {
  id: string;
  title: string;
  price: number | string;
  is_featured?: boolean | null;
  image_url?: string | null;
  categories?: { name?: string | null; slug?: string | null } | null;
}

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className={styles.ratingContainer}>
      <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= Math.round(rating) ? styles.starFilled : styles.starEmpty}
            fill={i <= Math.round(rating) ? "currentColor" : "none"}
          />
        ))}
      </div>
      {count !== undefined && <span className={styles.reviewCount}>({count})</span>}
    </div>
  );
}

function ProductsContent() {
  const { addItem, openCart } = useCart();
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<PriceFilterOption>("all");
  const [qualityFilter, setQualityFilter] = useState<"all" | "elite" | "premium" | "standard">("all");
  const selectedCategory = searchParams.get("category")?.toLowerCase() ?? "all";

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: productData, error: productError }, { data: categoryData, error: categoryError }] = await Promise.all([
          supabase
            .from("products")
            .select("*, categories(name, slug)"),
          supabase
            .from("categories")
            .select("id, name, slug")
            .order("name"),
        ]);

        if (productError) throw productError;
        if (categoryError) throw categoryError;
        setProducts(productData || []);
        setCategories(categoryData || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };

  const handleCategoryChange = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug === "all") {
      params.delete("category");
    } else {
      params.set("category", categorySlug);
    }
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategorySlug = product.categories?.slug?.toLowerCase() ?? "";
      const categoryMatch = selectedCategory === "all" || productCategorySlug === selectedCategory;
      // Note: brand is not in our SQL schema yet, using "Aura" as default for now or matching if present
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes("Aura");

      const price = parsePriceValue(product.price);
      const priceMatch =
        priceFilter === "all" ||
        (priceFilter === "under5000" && price < 5000) ||
        (priceFilter === "5000to15000" && price >= 5000 && price <= 15000) ||
        (priceFilter === "above15000" && price > 15000);

      // Rating is not in schema yet, assuming 4.5 for new products
      const qualityMatch = qualityFilter === "all" || qualityFilter === "premium";

      return categoryMatch && brandMatch && priceMatch && qualityMatch;
    });
  }, [products, selectedCategory, selectedBrands, priceFilter, qualityFilter]);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumbs}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Products</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.filterBar}>
              <div className={styles.categoryStrip} aria-label="Product categories">
                {[{ id: "all", name: "All", slug: "all" }, ...categories].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={clsx(styles.filterChip, styles.categoryChip, {
                      [styles.filterChipActive]: (cat.slug ?? "all") === selectedCategory,
                    })}
                    onClick={() => handleCategoryChange(cat.slug ?? "all")}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={styles.filterIconButton}
                onClick={() => setIsFilterOpen((v) => !v)}
                aria-expanded={isFilterOpen}
                aria-controls="shop-filter-panel"
              >
                <SlidersHorizontal size={16} />
              </button>

              {isFilterOpen && (
                <div className={styles.filterDropdown} id="shop-filter-panel">
                  <div className={styles.filterDropdownHeader}>
                    <h3>Filters</h3>
                    <button type="button" className={styles.filterCloseButton} onClick={() => setIsFilterOpen(false)}>
                      <X size={14} />
                    </button>
                  </div>

                  <div className={styles.filterGroup}>
                    <h4>Brand</h4>
                    <ul className={styles.checkboxList}>
                      {BRANDS.map((brand) => (
                        <li key={brand}>
                          <label className={styles.checkboxLabel}>
                            <div className={clsx(styles.checkbox, { [styles.checkboxChecked]: selectedBrands.includes(brand) })}>
                              {selectedBrands.includes(brand) && <Check size={12} strokeWidth={3} />}
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={selectedBrands.includes(brand)}
                                onChange={() => toggleBrand(brand)}
                              />
                            </div>
                            <span className={styles.checkboxText}>{brand}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.filterGroup}>
                    <h4>Price</h4>
                    <div className={styles.filterChipRow}>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: priceFilter === "all" })} onClick={() => setPriceFilter("all")}>All</button>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: priceFilter === "under5000" })} onClick={() => setPriceFilter("under5000")}>Under {formatShortCurrency(5000)}</button>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: priceFilter === "5000to15000" })} onClick={() => setPriceFilter("5000to15000")}>{formatShortCurrency(5000)}-{formatShortCurrency(15000)}</button>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: priceFilter === "above15000" })} onClick={() => setPriceFilter("above15000")}>{formatShortCurrency(15000)}+</button>
                    </div>
                  </div>

                  <div className={styles.filterGroup}>
                    <h4>Quality</h4>
                    <div className={styles.filterChipRow}>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: qualityFilter === "all" })} onClick={() => setQualityFilter("all")}>All</button>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: qualityFilter === "elite" })} onClick={() => setQualityFilter("elite")}>Elite</button>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: qualityFilter === "premium" })} onClick={() => setQualityFilter("premium")}>Premium</button>
                      <button type="button" className={clsx(styles.filterChip, { [styles.filterChipActive]: qualityFilter === "standard" })} onClick={() => setQualityFilter("standard")}>Standard</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className={styles.loaderWrap}>
                <Loader2 className="animate-spin" size={40} />
                <p>Fetching curated collection...</p>
              </div>
            ) : error ? (
              <div className={styles.errorWrap}>
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyWrap}>
                <p>No products found matching your filters.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredProducts.map((product) => {
                  const priceValue = parsePriceValue(product.price);
                  return (
                    <Link href={`/products/${product.id}`} key={product.id} className={styles.card}>
                      <div className={styles.imageWrapper}>
                        <Image
                          src={product.image_url || "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=800&auto=format&fit=crop"}
                          alt={product.title}
                          fill
                          className={styles.image}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {product.is_featured && <span className={styles.badge}>Featured</span>}
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardTop}>
                          <div className={styles.metaRow}>
                            <span className={styles.brand}>Aura</span>
                            <span className={styles.category}>{product.categories?.name}</span>
                          </div>
                          <h2 className={styles.cardName}>{product.title}</h2>
                          <div className={styles.ratingRow}>
                            <StarRating rating={4.5} count={12} />
                          </div>
                          <div className={styles.priceRow}>{formatCurrency(priceValue)}</div>
                          <p className={styles.deliveryText}>Premium shipping included</p>
                        </div>
                        <button
                          className={styles.addBtn}
                          onClick={(e) => {
                            e.preventDefault();
                            const imageUrl = product.image_url ?? "";
                            addItem({
                              id: product.id,
                              name: product.title,
                              price: priceValue,
                              image: imageUrl,
                              category: product.categories?.name ?? "",
                            });
                            openCart();
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
          Loading products...
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
