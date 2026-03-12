"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useAccountData } from "@/context/AccountDataContext";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import styles from "./WishlistManager.module.css";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/currency";

export function WishlistManager() {
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchWishlistProducts() {
      if (wishlistIds.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(name),
          images:product_images(url)
        `)
        .in("id", wishlistIds);

      if (!error && data) {
        // Fetch vendor names separately since relationship is indirect
        const vendorIds = Array.from(new Set(data.map(p => p.vendor_id).filter(Boolean)));
        
        let vendorMap: Record<string, string> = {};
        if (vendorIds.length > 0) {
          const { data: vendors } = await supabase
            .from("vendors")
            .select("user_id, store_name")
            .in("user_id", vendorIds);
          
          if (vendors) {
            vendorMap = vendors.reduce((acc, v) => ({ ...acc, [v.user_id]: v.store_name }), {});
          }
        }

        const mappedProducts = data.map(p => ({
          ...p,
          name: p.title, // Map title to name for the UI
          vendor_name: vendorMap[p.vendor_id] || "Aura Partner"
        }));
        
        setProducts(mappedProducts);
      }
      setIsLoading(false);
    }

    fetchWishlistProducts();
  }, [wishlistIds, supabase]);

  if (isLoading) return <div className={styles.loading}>Loading wishlist...</div>;

  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <Heart size={60} fill="#e5e7eb" stroke="#e5e7eb" />
        <h2>Your wishlist is empty</h2>
        <p>Save items you like to see them here later!</p>
        <Link href="/products" className={styles.shopBtn}>Find something to love</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Wishlist ({products.length})</h1>
      
      <div className={styles.grid}>
        {products.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <div className={styles.imageWrapper}>
              {product.images?.[0]?.url || product.image_url ? (
                <Image 
                  src={product.images?.[0]?.url || product.image_url} 
                  alt={product.name} 
                  fill 
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <Package size={24} />
                </div>
              )}
              <button 
                onClick={() => removeFromWishlist(product.id)}
                className={styles.removeBtn}
                title="Remove from wishlist"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className={styles.info}>
              <Link href={`/products/${product.id}`} className={styles.name}>
                {product.name}
              </Link>
              <p className={styles.vendor}>{product.vendor_name}</p>
              <p className={styles.price}>{formatCurrency(product.price)}</p>
              
              <button className={styles.cartBtn}>
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
