"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import styles from "./ProductCard.module.css";
import { Button } from "./Button";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    rating: number;
    isNew?: boolean;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const isLiked = isInWishlist(product.id);

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                {product.isNew && <span className={styles.badge}>New</span>}
                <button
                    className={`${styles.wishlistButton} ${isLiked ? styles.wishlistActive : ""}`}
                    aria-label="Add to wishlist"
                    onClick={() => toggleWishlist(product.id)}
                >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <div className={styles.imageWrapper}>
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <div className={styles.quickAdd}>
                    <Button
                        variant="primary"
                        fullWidth
                        size="sm"
                        className={styles.addToCartBtn}
                        onClick={() =>
                            addItem({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                category: product.category,
                            })
                        }
                    >
                        <ShoppingCart size={16} /> Add to Cart
                    </Button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.category}>{product.category}</div>
                <Link href={`/products/${product.id}`} className={styles.titleLink}>
                    <h3 className={styles.title}>{product.name}</h3>
                </Link>
                <div className={styles.priceRow}>
                    <span className={styles.price}>${product.price.toFixed(2)}</span>
                    <div className={styles.rating}>
                        <span className={styles.star}>★</span>
                        <span className={styles.ratingText}>{product.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
