"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import styles from "./page.module.css";

const CATEGORIES = ["All", "Electronics", "Audio", "Accessories", "Home Decor", "Clothing"];

const PRODUCTS = [
    { id: "1", name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones", price: 398.00, category: "Electronics", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop", rating: 4.8, reviews: 1243, isNew: true },
    { id: "2", name: "Minimalist Mechanical Keyboard with Custom Switches", price: 159.99, category: "Accessories", image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop", rating: 4.9, reviews: 876 },
    { id: "3", name: "Aura Premium Smart Home Speaker", price: 249.50, category: "Audio", image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=800&auto=format&fit=crop", rating: 4.6, reviews: 543, isNew: true },
    { id: "4", name: "Geometric Ceramic Table Lamp", price: 89.00, category: "Home Decor", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop", rating: 4.5, reviews: 321 },
    { id: "5", name: "Ultra-Slim Laptop Stand Pro", price: 79.99, category: "Accessories", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop", rating: 4.7, reviews: 654 },
    { id: "6", name: "Noise-Isolating Earbuds Elite", price: 199.00, category: "Audio", image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?q=80&w=800&auto=format&fit=crop", rating: 4.6, reviews: 432, isNew: true },
    { id: "7", name: "Wireless Charging Dock Station", price: 59.99, category: "Electronics", image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop", rating: 4.4, reviews: 289 },
    { id: "8", name: "Modern Minimalist Wall Clock", price: 49.99, category: "Home Decor", image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=800&auto=format&fit=crop", rating: 4.3, reviews: 167 },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={12} className={i <= Math.round(rating) ? styles.starFilled : styles.starEmpty} />
            ))}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className="container">
                    <h1 className={styles.pageTitle}>All Products</h1>
                    <p className={styles.pageSubtitle}>Discover our curated collection of {PRODUCTS.length} premium items</p>
                </div>
            </div>

            <div className="container">
                <div className={styles.layout}>
                    {/* Sidebar Filters */}
                    <aside className={styles.sidebar}>
                        <div className={styles.filterSection}>
                            <h3 className={styles.filterTitle}>Categories</h3>
                            <ul className={styles.filterList}>
                                {CATEGORIES.map((cat) => (
                                    <li key={cat}>
                                        <button className={`${styles.filterItem} ${cat === "All" ? styles.filterActive : ""}`}>
                                            {cat}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.filterSection}>
                            <h3 className={styles.filterTitle}>Price Range</h3>
                            <div className={styles.priceInputs}>
                                <input type="number" placeholder="Min" className={`input ${styles.priceInput}`} />
                                <span className={styles.priceSep}>—</span>
                                <input type="number" placeholder="Max" className={`input ${styles.priceInput}`} />
                            </div>
                        </div>

                        <div className={styles.filterSection}>
                            <h3 className={styles.filterTitle}>Rating</h3>
                            <ul className={styles.filterList}>
                                {[4, 3, 2].map((r) => (
                                    <li key={r}>
                                        <button className={styles.filterItem}>
                                            <StarRating rating={r} /> & up
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className={styles.main}>
                        {/* Toolbar */}
                        <div className={styles.toolbar}>
                            <div className={styles.searchBar}>
                                <Search size={16} className={styles.searchIcon} />
                                <input type="search" placeholder="Search products..." className={`input ${styles.searchInput}`} />
                            </div>
                            <div className={styles.toolbarRight}>
                                <button className={`btn btn-secondary ${styles.filterBtn}`}>
                                    <SlidersHorizontal size={15} /> Filters
                                </button>
                                <button className={`btn btn-secondary ${styles.sortBtn}`}>
                                    Sort by <ChevronDown size={14} />
                                </button>
                            </div>
                        </div>

                        <p className={styles.resultCount}>{PRODUCTS.length} products found</p>

                        {/* Grid */}
                        <div className={styles.grid}>
                            {PRODUCTS.map((product) => (
                                <Link href={`/products/${product.id}`} key={product.id} className={styles.card}>
                                    <div className={styles.imageWrapper}>
                                        <Image src={product.image} alt={product.name} fill className={styles.image} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                                        {product.isNew && <span className={`badge badge-blue ${styles.newBadge}`}>New</span>}
                                        <button className={styles.wishlistBtn} aria-label="Add to wishlist" onClick={(e) => e.preventDefault()}>♡</button>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <span className={styles.cardCategory}>{product.category}</span>
                                        <h2 className={styles.cardName}>{product.name}</h2>
                                        <div className={styles.ratingRow}>
                                            <StarRating rating={product.rating} />
                                            <span className={styles.reviewCount}>({product.reviews})</span>
                                        </div>
                                        <div className={styles.priceRow}>
                                            <span className={styles.price}>${product.price.toFixed(2)}</span>
                                            <button className={`btn btn-primary ${styles.addBtn}`} onClick={(e) => e.preventDefault()}>Add to Cart</button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
