"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type ProductRecord = {
  id: string;
  title: string;
  description: string | null;
  price: number | string;
  stock_quantity: number;
  image_url: string | null;
  vendor_id: string | null;
  categories?: { name?: string | null } | null;
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

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
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

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setFeedback("");

      const { data: productData, error } = await supabase
        .from("products")
        .select("id, title, description, price, stock_quantity, image_url, vendor_id, categories(name)")
        .eq("id", params.id)
        .single();

      if (!active) return;
      if (error || !productData) {
        setProduct(null);
        setLoading(false);
        return;
      }

      setProduct(productData as ProductRecord);

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
        fetch(`/api/product-questions?productId=${params.id}`),
        fetch(`/api/reviews?productId=${params.id}`),
      ]);

      const questionPayload = await questionRes.json();
      const reviewPayload = await reviewRes.json();

      if (!active) return;
      setQuestions(questionPayload.questions ?? []);
      setReviews(reviewPayload.reviews ?? []);
      setLoading(false);
    }

    loadData();

    const subscription = supabase
      .channel(`product-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          // Re-fetch to get joined category data
          supabase
            .from("products")
            .select("id, title, description, price, stock_quantity, image_url, vendor_id, categories(name)")
            .eq("id", params.id)
            .single()
            .then(({ data }) => {
              if (data) setProduct(data as ProductRecord);
            });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(subscription);
    };
  }, [params.id, supabase]);

  const formattedPrice = useMemo(() => {
    return formatCurrency(parsePriceValue(product?.price));
  }, [product?.price]);

  const priceAmount = formattedPrice.startsWith(INR_SYMBOL)
    ? formattedPrice.slice(INR_SYMBOL.length)
    : formattedPrice;

  const imageList = !product?.image_url
    ? ["https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=1200&auto=format&fit=crop"]
    : [product.image_url, product.image_url, product.image_url];

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }

    setSubmittingReview(true);
    setFeedback("");

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || "Unable to save your review.");
      setSubmittingReview(false);
      return;
    }

    setReviews((prev) => [payload.review, ...prev]);
    setReviewTitle("");
    setReviewBody("");
    setReviewRating(5);
    setFeedback("Your review is now live on this product.");
    setSubmittingReview(false);
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
            <div className={styles.brandLink}>
                {(Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name) ?? "Marketplace"}
            </div>
            <h1 className={styles.title}>{product.title}</h1>
            <Stars rating={averageRating} count={reviews.length} />

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

        <section id="reviews" className={styles.aboutSection} style={{ marginTop: "2rem", marginBottom: "3rem" }}>
          <h3 className={styles.aboutTitle}>Reviews and post-purchase feedback</h3>
          <p className={styles.description} style={{ marginTop: "0.5rem" }}>
            Reviews strengthen trust across Aura. Verified buyers can rate delivery quality, product accuracy, and seller communication.
          </p>

          <form onSubmit={handleReviewSubmit} style={{ marginTop: "1.25rem", display: "grid", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="rating">Rating</label>
              <select
                id="rating"
                className="input"
                style={{ maxWidth: 120 }}
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} Star
                  </option>
                ))}
              </select>
            </div>
            <input
              className="input"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Headline for your review"
            />
            <textarea
              className="input"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              rows={4}
              placeholder="Share what went well and whether the listing matched the delivered product."
            />
            <div>
              <button className={styles.buyNowBtn} type="submit" disabled={submittingReview}>
                {submittingReview ? "Publishing..." : "Publish Review"}
              </button>
            </div>
          </form>

          <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
            {reviews.length === 0 && (
              <div className={styles.guaranteeItem}>No reviews yet. The first review sets the trust signal for this listing.</div>
            )}
            {reviews.map((review) => (
              <article key={review.id} className={styles.guaranteeItem} style={{ alignItems: "flex-start", flexDirection: "column" }}>
                <Stars rating={review.rating} />
                <strong>{review.title || "Verified customer review"}</strong>
                {review.body && <p>{review.body}</p>}
                <span className={styles.deliveryLine}>
                  Posted {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </article>
            ))}
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
