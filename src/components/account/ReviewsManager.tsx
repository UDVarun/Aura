"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Star, MessageSquare, Trash2, Edit3, Package } from "lucide-react";
import styles from "./ReviewsManager.module.css";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

export function ReviewsManager() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMyReviews() {
      if (!user) return;

      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          product:products(id, name, images:product_images(image_url))
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setReviews(data);
      setIsLoading(false);
    }

    fetchMyReviews();
  }, [user, supabase]);

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (!error) {
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading reviews...</div>;

  if (reviews.length === 0) {
    return (
      <div className={styles.empty}>
        <MessageSquare size={60} />
        <h2>No Reviews Yet</h2>
        <p>You haven't reviewed any products yet. Sharing your experience helps other shoppers!</p>
        <Link href="/account/orders" className={styles.shopBtn}>View Your Orders</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Reviews ({reviews.length})</h1>
      
      <div className={styles.list}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.productInfo}>
              <div className={styles.imageWrapper}>
                {review.product?.images?.[0] ? (
                  <Image 
                    src={review.product.images[0].image_url} 
                    alt={review.product.name} 
                    fill 
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}><Package size={20} /></div>
                )}
              </div>
              <div className={styles.productDetails}>
                <Link href={`/products/${review.product?.id}`} className={styles.productName}>
                  {review.product?.name}
                </Link>
                <div className={styles.rating}>
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < review.rating ? "var(--warning)" : "none"}
                      stroke={i < review.rating ? "var(--warning)" : "var(--muted)"}
                    />
                  ))}
                  <span className={styles.date}>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className={styles.content}>
              <p className={styles.comment}>{review.comment}</p>
            </div>

            <div className={styles.actions}>
              <button className={styles.editBtn}>
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
              <button onClick={() => handleDeleteReview(review.id)} className={styles.deleteBtn}>
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
