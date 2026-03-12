"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  MapPin,
  Star,
  ShoppingCart,
  MessageSquare,
  Store,
} from "lucide-react";
import clsx from "clsx";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, INR_SYMBOL, parsePriceValue } from "@/lib/currency";
import ReviewDistribution from "@/components/reviews/ReviewDistribution";
import { ThumbsUp, Camera, Video, CheckCircle2 } from "lucide-react";

type ProductRecord = {
  id: string;
  title: string;
  description: string | null;
  price: number | string;
  brand: string | null;
  tier: "elite" | "premium" | "standard" | null;
  rating: number | null;
  stock_quantity: number;
  image_url: string | null;
  vendor_id: string | null;
  categories?: any;
  product_images?: { url: string; display_order: number }[] | null;
  avg_rating?: number;
  review_count?: number;
  rating_distribution?: Record<string, number>;
};

type ProductQuestion = {
  id: string;
  question: string;
  answer: string | null;
  status: string;
  created_at: string;
  answered_at: string | null;
};

type ProductReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  is_verified: boolean;
  helpful_count: number;
  media_urls?: string[];
  profiles?: { email: string };
};

function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className={styles.ratingContainer}>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={16}
            className={i <= Math.round(rating) ? styles.starFilled : styles.starEmpty}
            fill={i <= Math.round(rating) ? "currentColor" : "none"}
          />
        ))}
      </div>
      {count !== undefined && (
        <a href="#reviews" className={styles.reviewLink}>
          {count} reviews
        </a>
      )}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { addItem, openCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [sellerName, setSellerName] = useState("Aura Partner");
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [questionBody, setQuestionBody] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [reviewSort, setReviewSort] = useState("top");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const addActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addActionsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0.15 }
    );

    observer.observe(addActionsRef.current);
    return () => observer.disconnect();
  }, []);

  const loadData = useCallback(async (active = true) => {
    setLoading(true);
    setFeedback("");

    let { data: productData, error } = await supabase
      .from("products")
      .select(`
        id, title, description, price, brand, tier, rating, stock_quantity, image_url, vendor_id, 
        categories(name),
        product_images(url, display_order),
        avg_rating, review_count, rating_distribution
      `)
      .eq("id", id)
      .single() as any;

    if (error && (error.code === "PGRST200" || error.code === "PGRST205")) {
        console.warn("[ProductDetailPage] product_images table missing. Falling back.");
        const fallback = await supabase
          .from("products")
          .select(`
              id, title, description, price, brand, tier, rating, stock_quantity, image_url, vendor_id, 
              categories(name),
              avg_rating, review_count, rating_distribution
          `)
          .eq("id", id)
          .single() as any;
        
        if (fallback.data) {
            (fallback.data as any).product_images = [];
        }
        productData = fallback.data;
        error = fallback.error;
    }

    if (!active) return;
    if (error || !productData) {
      console.error("[ProductDetailPage] Error fetching product:", error);
      setProduct(null);
      setLoading(false);
      return;
    }

    setProduct(productData as unknown as ProductRecord);

    if (productData.vendor_id) {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("store_name")
        .eq("user_id", productData.vendor_id)
        .single();
      if (active && vendor?.store_name) {
        setSellerName(vendor.store_name);
      }
    }

    const [questionRes, reviewRes] = await Promise.all([
      fetch(`/api/product-questions?productId=${id}`),
      fetch(`/api/reviews?productId=${id}&sort=${reviewSort}`),
    ]);

    const questionPayload = await questionRes.json();
    const reviewPayload = await reviewRes.json();

    if (!active) return;
    setQuestions(questionPayload.questions ?? []);
    setReviews(reviewPayload.reviews ?? []);
    setLoading(false);
  }, [id, supabase, reviewSort]);

  useEffect(() => {
    let active = true;
    loadData(active);

    const subscription = supabase
      .channel(`product-updates-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `id=eq.${id}`,
        },
        () => {
          loadData(active);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_reviews",
          filter: `product_id=eq.${id}`,
        },
        () => {
          loadData(active);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review_votes",
        },
        () => {
            // Since review_votes doesn't have product_id, we just refresh all for now if any vote changes
            // Realistically we'd filter by review_id but product_reviews refresh usually covers it
            loadData(active);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(subscription);
    };
  }, [id, supabase, loadData]);

  const formattedPrice = useMemo(() => {
    return formatCurrency(parsePriceValue(product?.price));
  }, [product?.price]);

  const priceAmount = formattedPrice.startsWith(INR_SYMBOL)
    ? formattedPrice.slice(INR_SYMBOL.length)
    : formattedPrice;

  const imageList = useMemo(() => {
    const list: string[] = [];
    if (product?.image_url) list.push(product.image_url);

    const extraImages = (product as any)?.product_images;
    if (extraImages && Array.isArray(extraImages)) {
      const sorted = [...extraImages].sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
      sorted.forEach(img => {
        if (img.url && img.url !== product?.image_url) {
          list.push(img.url);
        }
      });
    }

    if (list.length === 0) {
      return ["https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=1200&auto=format&fit=crop"];
    }
    // De-duplicate URLs
    return Array.from(new Set(list));
  }, [product]);

  const averageRating = reviews.length === 0
    ? 4.7
    : reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;

  const nextImage = () => setActiveImage((prev) => (prev + 1) % imageList.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + imageList.length) % imageList.length);

  const handleAddToCart = async () => {
    if (!product) return;

    await addItem({
      id: product.id,
      name: product.title,
      price: parsePriceValue(product.price),
      image: product.image_url ?? "",
      category: (Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name) ?? "Marketplace",
      quantity,
    });
    openCart();
  };

  const handleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }

    setSubmittingQuestion(true);
    setFeedback("");

    const response = await fetch("/api/product-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, question: questionBody }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || "Unable to send your question.");
      setSubmittingQuestion(false);
      return;
    }

    setQuestions((prev) => [payload.question, ...prev]);
    setQuestionBody("");
    setFeedback("Your question has been sent to the seller.");
    setSubmittingQuestion(false);
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }

    const response = await fetch("/api/reviews/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, voteType: "helpful" }),
    });

    if (response.ok) {
        const payload = await response.json();
        setReviews(prev => prev.map(r => 
            r.id === reviewId ? { ...r, helpful_count: payload.helpful_count } : r
        ));
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReviewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (reviewFiles.length === 0) return [];
    setUploadingMedia(true);
    const urls: string[] = [];

    for (const file of reviewFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        if (data) urls.push(data.publicUrl);
      }
    }

    setUploadingMedia(false);
    return urls;
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }
    setSubmittingReview(true);
    setFeedback("Calculating weighted rating and uploading media...");

    const uploadedUrls = await uploadMedia();

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product?.id,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
        mediaUrls: uploadedUrls,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || "Unable to save your review.");
      setSubmittingReview(false);
      return;
    }

    setReviewTitle("");
    setReviewBody("");
    setReviewRating(5);
    setReviewFiles([]);
    setFeedback("Your review is now live on this product.");
    setSubmittingReview(false);
    loadData();
  };

  const handleReportReview = async (reviewId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }

    const reason = prompt("Please provide a reason for reporting this review:");
    if (!reason) return;

    const response = await fetch("/api/reviews/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, reason }),
    });

    if (response.ok) {
      alert("Thank you. Our moderation team will review this content.");
    } else {
      const data = await response.json();
      alert(data.error || "Unable to submit report.");
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.layout} style={{ minHeight: "55vh", alignItems: "center" }}>
            Loading product details...
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.layout} style={{ minHeight: "55vh", alignItems: "center" }}>
            This product could not be found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumbs}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/products">Products</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{product.title}</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.gallerySection}>
            <div className={styles.thumbnailsList}>
              {imageList.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  className={clsx(styles.thumb, { [styles.thumbActive]: idx === activeImage })}
                  onMouseEnter={() => setActiveImage(idx)}
                  onClick={() => setActiveImage(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className={styles.thumbImage} sizes="64px" />
                </button>
              ))}
            </div>

            <div
              className={styles.galleryMain}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleZoom}
            >
              <Image
                src={imageList[activeImage]}
                alt={product.title}
                fill
                className={styles.mainImage}
                style={{ transform: zoomed ? "scale(1.9)" : "scale(1)", transformOrigin: zoomOrigin }}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <button className={styles.navBtnLeft} onClick={prevImage} aria-label="Previous image">
                <ChevronLeft size={22} />
              </button>
              <button className={styles.navBtnRight} onClick={nextImage} aria-label="Next image">
                <ChevronRight size={22} />
              </button>
              <span className={styles.zoomHint}>Hover to zoom</span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.metaRow}>
              <div className={styles.brandLink}>
                {product.brand || "Aura"}
              </div>
              <span className={styles.metaDot}>•</span>
              <div className={styles.categoryBadge}>
                {(Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name) ?? "Marketplace"}
              </div>
              {product.tier && product.tier !== 'standard' && (
                <>
                  <span className={styles.metaDot}>•</span>
                  <div className={clsx(styles.tierBadge, styles[`tier${product.tier.charAt(0).toUpperCase() + product.tier.slice(1)}`])}>
                    {product.tier}
                  </div>
                </>
              )}
            </div>
            <h1 className={styles.title}>{product.title}</h1>
            <Stars rating={product.avg_rating ?? product.rating ?? 4.7} count={product.review_count ?? reviews.length} />

            <div className={styles.priceBlock}>
              <span className={styles.priceSymbol}>{INR_SYMBOL}</span>
              <span className={styles.priceMain}>{priceAmount}</span>
            </div>
            <p className={styles.description}>
              {product.description || "A premium marketplace listing curated for Aura customers."}
            </p>

            <div className={styles.aboutSection}>
              <h3 className={styles.aboutTitle}>Seller</h3>
              <ul className={styles.featureList}>
                <li>
                  <Store size={14} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
                  Sold by {sellerName}
                </li>
                <li>Customer questions are answered directly by the vendor through Aura.</li>
                <li>Order issues can be escalated to the admin support team from Customer Care.</li>
                <li>Every support interaction stays inside the platform for dispute protection.</li>
              </ul>
            </div>
          </div>

          <aside className={styles.buyBox}>
            <div className={styles.buyBoxPrice}>{formattedPrice}</div>
            <p className={styles.deliveryLine}>Inclusive of GST and tracked marketplace delivery.</p>

            <div className={styles.locationLine}>
              <MapPin size={14} />
              <span>Delivering to your saved address</span>
            </div>

            <h3 className={styles.inStock}>
              {Number(product.stock_quantity || 0) > 0 ? "In Stock" : "Out of Stock"}
            </h3>

            <div className={styles.quantitySelector}>
              <label htmlFor="qty">Quantity</label>
              <select
                id="qty"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={styles.qtySelect}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.buyActions} ref={addActionsRef}>
              <button
                className={styles.addToCartBtn}
                onClick={() => {
                  if (isInCart(product.id)) {
                    openCart();
                    return;
                  }
                  handleAddToCart();
                }}
              >
                <ShoppingCart size={16} />
                {isInCart(product.id) ? "In Cart — View" : "Add to Cart"}
              </button>
              <Link href="/checkout" className={styles.buyNowBtn}>
                Buy Now
              </Link>
            </div>

            <div className={styles.guaranteeList}>
              <div className={styles.guaranteeItem}>
                <ShieldCheck size={18} className={styles.gIcon} />
                <span>Protected marketplace checkout</span>
              </div>
              <div className={styles.guaranteeItem}>
                <RotateCcw size={18} className={styles.gIcon} />
                <span>Refunds and disputes via Aura support</span>
              </div>
              <div className={styles.guaranteeItem}>
                <Truck size={18} className={styles.gIcon} />
                <span>Seller shipment updates tracked in-platform</span>
              </div>
            </div>
          </aside>
        </div>

        <section className={styles.aboutSection} style={{ marginTop: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3 className={styles.aboutTitle}>Questions for the seller</h3>
              <p className={styles.description} style={{ marginTop: "0.5rem" }}>
                Ask about compatibility, delivery expectations, or product specifications before you buy.
              </p>
            </div>
            <Link href="/customer-care" className={styles.buyNowBtn}>
              Open Customer Care
            </Link>
          </div>

          <form onSubmit={handleQuestionSubmit} style={{ marginTop: "1.25rem", display: "grid", gap: "0.75rem" }}>
            <textarea
              className="input"
              value={questionBody}
              onChange={(e) => setQuestionBody(e.target.value)}
              rows={4}
              placeholder="Ask the seller about materials, delivery timing, compatibility, or usage."
              required
            />
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <button className={styles.buyNowBtn} type="submit" disabled={submittingQuestion}>
                <MessageSquare size={15} /> {submittingQuestion ? "Sending..." : "Send Question"}
              </button>
              {feedback && <span className={styles.deliveryLine}>{feedback}</span>}
            </div>
          </form>

          <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
            {questions.length === 0 && (
              <div className={styles.guaranteeItem}>No questions yet. Start the conversation with this seller.</div>
            )}
            {questions.map((question) => (
              <article key={question.id} className={styles.guaranteeItem} style={{ alignItems: "flex-start", flexDirection: "column" }}>
                <strong>Customer question</strong>
                <p>{question.question}</p>
                <span className={styles.deliveryLine}>
                  {new Date(question.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {question.answer ? (
                  <>
                    <strong style={{ marginTop: "0.5rem" }}>Seller response</strong>
                    <p>{question.answer}</p>
                  </>
                ) : (
                  <span className={styles.deliveryLine}>Awaiting seller response</span>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="reviews" className={styles.aboutSection} style={{ marginTop: "4rem", marginBottom: "3rem" }}>
          <h2 className={styles.aboutTitle} style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Customer reviews</h2>
          
          <div className={styles.reviewsLayout}>
            <aside className={styles.reviewsSidebar}>
              <ReviewDistribution 
                distribution={product.rating_distribution || {"1":0,"2":0,"3":0,"4":0,"5":0}}
                totalCount={product.review_count || 0}
                averageRating={product.avg_rating || 4.7}
              />
              
              <div className={styles.reviewThisProduct}>
                <h3 className={styles.aboutTitle}>Review this product</h3>
                <p className={styles.description}>Share your thoughts with other customers</p>
                <button 
                  className={styles.buyNowBtn} 
                  style={{ marginTop: "1rem", width: "100%" }}
                  onClick={() => {
                    const form = document.getElementById('review-form');
                    form?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Write a product review
                </button>
              </div>
            </aside>

            <div className={styles.reviewListSection}>
              <div className={styles.reviewFilters}>
                <select 
                  className={styles.qtySelect}
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                >
                  <option value="top">Top reviews</option>
                  <option value="recent">Most recent</option>
                  <option value="rating_high">Highest rating</option>
                  <option value="rating_low">Lowest rating</option>
                  <option value="verified">Verified purchases only</option>
                </select>
              </div>

              <div className={styles.reviewsListItems}>
                {reviews.length === 0 && (
                  <div className={styles.guaranteeItem}>No reviews yet. Be the first to share your experience.</div>
                )}
                {reviews.map((review) => (
                  <article key={review.id} className={styles.reviewItem}>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerAvatar}>
                        {review.profiles?.email?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <span className={styles.reviewerName}>
                        {review.profiles?.email?.split('@')[0] || "Aura Customer"}
                      </span>
                    </div>
                    
                    <div className={styles.reviewRatingRow}>
                      <Stars rating={review.rating} />
                      <strong className={styles.reviewTitle}>{review.title || "Found it helpful"}</strong>
                    </div>

                    <div className={styles.reviewMeta}>
                      {review.is_verified && (
                        <span className={styles.verifiedBadge}>
                          <CheckCircle2 size={12} /> Verified Purchase
                        </span>
                      )}
                      <span className={styles.reviewDate}>
                        Reviewed in India on {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>

                    {review.body && <p className={styles.reviewBodyText}>{review.body}</p>}
                    
                    {review.media_urls && review.media_urls.length > 0 && (
                      <div className={styles.reviewMediaGallery}>
                        {review.media_urls.map((url, i) => (
                          <div key={i} className={styles.reviewMediaItem}>
                            <Image src={url} alt="Review media" fill objectFit="cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.reviewActions}>
                      <span className={styles.helpfulText}>
                        {review.helpful_count > 0 ? `${review.helpful_count} people found this helpful` : "Was this review helpful?"}
                      </span>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.helpfulBtn}
                          onClick={() => handleHelpfulVote(review.id)}
                        >
                          Helpful
                        </button>
                        <span className={styles.actionSep}>|</span>
                        <button 
                          className={styles.reportBtn}
                          onClick={() => handleReportReview(review.id)}
                        >
                          Report abuse
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div id="review-form" className={styles.reviewFormContainer}>
                <h3 className={styles.aboutTitle}>Write a review</h3>
                <form onSubmit={handleReviewSubmit} style={{ marginTop: "1.25rem", display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div className={styles.ratingInput}>
                      <label>Overall rating</label>
                      <div className={styles.starsInput}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setReviewRating(s)}
                            className={clsx(styles.starBtn, { [styles.starBtnActive]: s <= reviewRating })}
                          >
                            <Star size={24} fill={s <= reviewRating ? "#f5b840" : "none"} color="#f5b840" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Add a headline</label>
                    <input
                      className="input"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="What's most important to know?"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Add photos or video</label>
                    <div className={styles.mediaUploadRow}>
                        <label className={styles.mediaUploadBtn}>
                            <Camera size={20} />
                            <span>Add Media</span>
                            <input 
                                type="file" 
                                accept="image/*,video/*" 
                                multiple 
                                style={{ display: "none" }} 
                                onChange={handleMediaChange}
                            />
                        </label>
                        <div className={styles.mediaPreviews}>
                            {reviewFiles.map((file, i) => (
                                <div key={i} className={styles.mediaPreviewThumb}>
                                    <span>{file.name.slice(-10)}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setReviewFiles(prev => prev.filter((_, idx) => idx !== i))}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Add a written review</label>
                    <textarea
                      className="input"
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      rows={5}
                      placeholder="What did you like or dislike? What did you use this product for?"
                      required
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button className={styles.buyNowBtn} type="submit" disabled={submittingReview || uploadingMedia}>
                      {submittingReview ? (uploadingMedia ? "Uploading..." : "Submitting...") : "Submit"}
                    </button>
                    {feedback && <span className={styles.deliveryLine}>{feedback}</span>}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={clsx(styles.stickyBar, { [styles.stickyBarVisible]: showStickyBar })} aria-hidden={!showStickyBar}>
        <div className={`container ${styles.stickyInner}`}>
          <div>
            <p className={styles.stickyName}>{product.title}</p>
            <p className={styles.stickyPrice}>{formattedPrice}</p>
          </div>
          <button
            className={styles.stickyAddBtn}
            onClick={() => {
              if (isInCart(product.id)) {
                openCart();
                return;
              }
              handleAddToCart();
            }}
          >
            {isInCart(product.id) ? "In Cart — View" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
