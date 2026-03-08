import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import styles from "./ProductCard.module.css";
import { Button } from "./Button";

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
    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                {product.isNew && <span className={styles.badge}>New</span>}
                <button className={styles.wishlistButton} aria-label="Add to wishlist">
                    <Heart size={18} />
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
                    <Button variant="primary" fullWidth size="sm" className={styles.addToCartBtn}>
                        <ShoppingCart size={16} /> Add to Cart
                    </Button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.category}>{product.category}</div>
                <Link href={`/product/${product.id}`} className={styles.titleLink}>
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
