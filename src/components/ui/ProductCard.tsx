"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { Button } from "./Button";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/currency";
import styles from "./ProductCard.module.css";

export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    rating: number;
    isNew?: boolean;
    is_featured?: boolean;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem, openCart, isInCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const isLiked = isInWishlist(product.id);
    const inCart = isInCart(product.id);

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                {product.isNew && <span className={styles.badge}>New</span>}
                <button
                    className={`${styles.wishlistBtn} ${isLiked ? styles.active : ""}`}
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <Link href={`/products/${product.id}`} className={styles.imageLink}>
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </Link>
                <div className={styles.imageTint} />
                <div className={styles.quickAdd}>
                    <Button
                        variant="primary"
                        fullWidth
                        size="sm"
                        className={styles.addToCartBtn}
                        onClick={() => {
                            if (inCart) {
                                openCart();
                                return;
                            }
                            addItem({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                category: product.category,
                            });
                        }}
                    >
                        <ShoppingCart size={16} /> {inCart ? "In Cart" : "Add to Cart"}
                    </Button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.metaRow}>
                    <div className={styles.category}>{product.category}</div>
                    <div className={styles.rating}>
                        <Star size={14} fill="currentColor" />
                        <span>{product.rating}</span>
                    </div>
                </div>
                <Link href={`/products/${product.id}`} className={styles.titleLink}>
                    <h3 className={styles.title}>{product.name}</h3>
                </Link>
                <div className={styles.priceRow}>
                    <span className={styles.price}>{formatCurrency(product.price)}</span>
                    <span className={styles.detailLink}>{inCart ? "View bag" : "Quick add"}</span>
                </div>
            </div>
        </div>
    );
}
